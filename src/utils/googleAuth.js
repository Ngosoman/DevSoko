import { supabase } from "../supabaseClient";

export const GOOGLE_ROLE_STORAGE_KEY = "devsoko-google-role";

export const getDashboardPath = (role) => {
  if (role === "admin") return "/admin-dashboard";
  if (role === "seller") return "/seller-dashboard";
  if (role === "buyer") return "/buyer-dashboard";
  return "/dashboard";
};

export const getGoogleRedirectUrl = (pathname) => {
  const currentOrigin = typeof window !== "undefined" ? window.location.origin : "";
  const currentPath = pathname || (typeof window !== "undefined" ? window.location.pathname : "/");
  const normalizedPath = currentPath.startsWith("/") ? currentPath : `/${currentPath}`;

  return `${currentOrigin}${normalizedPath}`;
};

export const startGoogleOAuth = async ({ redirectPath, role } = {}) => {
  if (role) {
    sessionStorage.setItem(GOOGLE_ROLE_STORAGE_KEY, role);
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: getGoogleRedirectUrl(redirectPath),
    },
  });

  if (error) {
    throw error;
  }
};

export const ensureGoogleUserProfile = async ({
  defaultRole = "buyer",
  allowRoleUpdate = false,
} = {}) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user;
  if (!user) {
    return null;
  }

  const storedRole = sessionStorage.getItem(GOOGLE_ROLE_STORAGE_KEY);
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  const resolvedRole = storedRole || profile?.role || defaultRole;

  if (!profile) {
    const { error: insertError } = await supabase.from("users").insert({
      id: user.id,
      email: user.email,
      role: resolvedRole,
    });

    if (insertError) {
      throw insertError;
    }
  } else if (allowRoleUpdate && storedRole && storedRole !== profile.role) {
    const { error: updateError } = await supabase
      .from("users")
      .update({ role: resolvedRole, email: user.email })
      .eq("id", user.id);

    if (updateError) {
      throw updateError;
    }
  }

  sessionStorage.removeItem(GOOGLE_ROLE_STORAGE_KEY);
  return { user, role: resolvedRole };
};