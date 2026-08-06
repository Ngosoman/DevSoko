import { supabase } from '../supabaseClient';

export const DEFAULT_ADMIN_SETTINGS = {
  pricing_mode: 'technology',
  technology_costs: {
    'HTML/CSS': 5,
    JavaScript: 8,
    React: 15,
    'React + Firebase': 18,
    'React + Django': 25,
    Flutter: 30,
    'AI Projects': 50,
  },
  project_size_costs: {
    small: 5,
    medium: 15,
    large: 30,
    enterprise: 50,
  },
  commission_rate: 0.1,
  reward_dcoins: 3,
};

export const getPricingCost = ({ mode = 'technology', technology = 'React', size = 'medium' }) => {
  const techCost = DEFAULT_ADMIN_SETTINGS.technology_costs[technology] || 10;
  const sizeCost = DEFAULT_ADMIN_SETTINGS.project_size_costs[size] || 15;

  switch (mode) {
    case 'project-size':
      return sizeCost;
    case 'hybrid':
      return techCost + sizeCost;
    case 'technology':
    default:
      return techCost;
  }
};

export const getReputationLevel = ({ sales = 0, rating = 0, reviews = 0, responseSpeed = 0, completedJobs = 0, uploads = 0 }) => {
  const score = sales * 2 + reviews * 3 + completedJobs + uploads + rating * 10 + responseSpeed * 5;

  if (score >= 300) return 'Elite';
  if (score >= 220) return 'Platinum';
  if (score >= 140) return 'Gold';
  if (score >= 70) return 'Silver';
  return 'Bronze';
};

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

const getAdminEmails = () => {
  const configured = `${import.meta.env.VITE_ADMIN_EMAILS || import.meta.env.VITE_ADMIN_EMAIL || ''}`
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  if (configured.length > 0) {
    return configured;
  }

  return ['admin@gmail.com'];
};

export const isAdminEmail = (email = '') => {
  return getAdminEmails().includes(String(email).trim().toLowerCase());
};

const normalizeRole = (role) => {
  const normalized = `${role || ''}`.trim().toLowerCase();
  if (normalized === 'admin') return 'admin';
  if (normalized === 'seller') return 'seller';
  if (normalized === 'buyer') return 'buyer';
  return null;
};

export const getUserProfile = async (userId) => {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

const isRecoverableProfileError = (error) => {
  if (!error) return false;
  const code = error.code || error.status;
  const message = `${error.message || ''}`.toLowerCase();
  return code === 404 || code === '404' || code === 'PGRST116' || code === '42P01' || code === '42501' || code === 'PGRST205' || message.includes('relation') || message.includes('not found') || message.includes('permission denied');
};

export const upsertProfile = async ({ userId, email, role = 'buyer', fullName = '', extra = {} }) => {
  const payload = {
    id: userId,
    email,
    role,
    full_name: fullName,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...extra,
  };

  try {
    const { data, error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' }).select().single();
    if (error) {
      if (isRecoverableProfileError(error)) {
        return null;
      }
      throw error;
    }
    return data;
  } catch (error) {
    if (isRecoverableProfileError(error)) {
      return null;
    }
    throw error;
  }
};

export const resolveUserRole = async (user) => {
  if (!user) return null;

  const profile = await getUserProfile(user.id);
  const email = user.email || profile?.email || '';
  const normalizedEmail = String(email).trim().toLowerCase();
  const metadataRole = normalizeRole(user?.user_metadata?.role || user?.app_metadata?.role);
  const profileRole = normalizeRole(profile?.role);
  const preferredRole = isAdminEmail(normalizedEmail)
    ? 'admin'
    : metadataRole || profileRole || 'buyer';
  const fullName = profile?.full_name || normalizedEmail.split('@')[0] || 'Admin';

  if (preferredRole === 'admin' && profile?.role !== 'admin') {
    await upsertProfile({
      userId: user.id,
      email,
      role: 'admin',
      fullName,
      extra: profile ? { created_at: profile.created_at || new Date().toISOString() } : {},
    });
    return 'admin';
  }

  if (!profile || profileRole !== preferredRole) {
    await upsertProfile({
      userId: user.id,
      email,
      role: preferredRole,
      fullName,
      extra: profile ? { created_at: profile.created_at || new Date().toISOString() } : {},
    });
  }

  return preferredRole;
};

export const getAdminSettings = async () => {
  const { data, error } = await supabase.from('admin_settings').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (error && error.code !== 'PGRST116') throw error;
  return data || DEFAULT_ADMIN_SETTINGS;
};

export const saveAdminSettings = async (settings) => {
  const payload = {
    id: 'default',
    ...DEFAULT_ADMIN_SETTINGS,
    ...settings,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from('admin_settings').upsert(payload, { onConflict: 'id' }).select().single();
  if (error) throw error;
  return data;
};

export const ensureWallet = async (userId) => {
  try {
    const { data: existing, error } = await supabase.from('wallets').select('*').eq('user_id', userId).maybeSingle();
    if (error) {
      if (isRecoverableProfileError(error)) {
        return null;
      }
      if (error.code !== 'PGRST116') throw error;
    }

    if (existing) return existing;

    const { data, error: insertError } = await supabase.from('wallets').insert({ user_id: userId, balance: 0, currency: 'D-COIN', created_at: new Date().toISOString() }).select().single();
    if (insertError) {
      if (isRecoverableProfileError(insertError)) {
        return null;
      }
      throw insertError;
    }
    return data;
  } catch (error) {
    if (isRecoverableProfileError(error)) {
      return null;
    }
    throw error;
  }
};

export const addDcoinTransaction = async ({ userId, amount, type = 'deduction', reason = 'upload', metadata = {} }) => {
  const { data, error } = await supabase.from('dcoin_transactions').insert({
    user_id: userId,
    amount,
    type,
    reason,
    metadata,
    created_at: new Date().toISOString(),
  }).select().single();
  if (error) throw error;
  return data;
};

export const updateWalletBalance = async (userId, delta) => {
  const wallet = await ensureWallet(userId);
  const nextBalance = Number(wallet.balance || 0) + Number(delta);
  const { data, error } = await supabase.from('wallets').update({ balance: nextBalance, updated_at: new Date().toISOString() }).eq('user_id', userId).select().single();
  if (error) throw error;
  return data;
};

export const createProjectRecord = async (projectPayload) => {
  const { data, error } = await supabase.from('projects').insert(projectPayload).select().single();
  if (error) throw error;
  return data;
};

export const listSellerProjects = async (sellerId) => {
  const { data, error } = await supabase.from('projects').select('*').eq('seller_id', sellerId).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const listAllProjects = async () => {
  const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const listSellerOrders = async (sellerId) => {
  const { data, error } = await supabase.from('orders').select('*').eq('seller_id', sellerId).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const listAllOrders = async () => {
  const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const listDeveloperProfiles = async () => {
  const { data, error } = await supabase.from('developer_profiles').select('*').order('featured', { ascending: false }).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const upsertDeveloperProfile = async (payload) => {
  const finalPayload = {
    ...payload,
    created_at: payload.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from('developer_profiles').upsert(finalPayload, { onConflict: 'id' }).select().single();
  if (error) throw error;
  return data;
};

export const deleteDeveloperProfile = async (id) => {
  const { error } = await supabase.from('developer_profiles').delete().eq('id', id);
  if (error) throw error;
};

export const listProfiles = async () => {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const listNotifications = async (userId) => {
  const { data, error } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const createActivityLog = async ({ userId, action, details = '' }) => {
  const { error } = await supabase.from('activity_logs').insert({
    user_id: userId,
    action,
    details,
    created_at: new Date().toISOString(),
  });
  if (error) throw error;
};

export const createOrder = async (orderPayload) => {
  const { data, error } = await supabase.from('orders').insert(orderPayload).select().single();
  if (error) throw error;
  return data;
};
