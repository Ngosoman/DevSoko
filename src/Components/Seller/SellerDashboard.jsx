import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import DashboardSkeleton from '../Shared/DashboardSkeleton';
import UploadForm from '../Project/UploadForm';
import { getCurrentUser, getReputationLevel, getUserProfile } from '../../lib/supabaseMarketplace';

const navItems = [
  { id: 'overview', label: 'Overview' },
  { id: 'projects', label: 'My Projects' },
  { id: 'upload', label: 'Upload Project' },
  { id: 'sales', label: 'Sales' },
  { id: 'wallet', label: 'Wallet' },
  { id: 'dcoins', label: 'D-Coins' },
  { id: 'reputation', label: 'Reputation' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'profile', label: 'Profile' },
  { id: 'settings', label: 'Settings' },
];

const SellerDashboard = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const [projects, setProjects] = useState([]);
  const [sales, setSales] = useState([]);
  const [profile, setProfile] = useState(null);
  const [wallet, setWallet] = useState({ balance: 0 });
  const [loading, setLoading] = useState(true);
  const [editingProject, setEditingProject] = useState(null);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const nextProfile = await getUserProfile(user.id);
      setProfile(nextProfile);

      const [{ data: walletData }, { data: projectData }, { data: orderData }] = await Promise.all([
        supabase.from('wallets').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('projects').select('*').eq('seller_id', user.id).order('created_at', { ascending: false }),
        supabase.from('orders').select('*').eq('seller_id', user.id).order('created_at', { ascending: false }),
      ]);

      setWallet(walletData || { balance: 0 });
      setProjects(projectData || []);
      setSales(orderData || []);
    } catch (error) {
      console.error('seller dashboard error', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [navigate]);

  const stats = useMemo(() => {
    const totalEarnings = sales.reduce((sum, order) => sum + Number(order.amount || 0), 0);
    const totalSales = sales.length;
    const activeProjects = projects.filter((project) => ['active', 'approved', 'published'].includes(project.status)).length;
    const pendingOrders = sales.filter((order) => (order.status || '').toLowerCase() === 'pending').length;
    const reputation = getReputationLevel({ sales: totalSales, reviews: projects.length, completedJobs: totalSales, uploads: projects.length, rating: 4.5, responseSpeed: 80 });

    return {
      totalEarnings,
      totalSales,
      totalProjects: projects.length,
      activeProjects,
      pendingOrders,
      dcoinBalance: Number(wallet.balance || 0),
      reputation,
    };
  }, [projects, sales, wallet]);

  const updateProjectStatus = async (projectId, status) => {
    await supabase.from('projects').update({ status }).eq('id', projectId);
    fetchData();
  };

  const deleteProject = async (projectId) => {
    if (!window.confirm('Delete this project?')) return;
    await supabase.from('projects').delete().eq('id', projectId);
    fetchData();
  };

  const saveProjectEdit = async (event) => {
    event.preventDefault();
    if (!editingProject) return;
    await supabase.from('projects').update({
      title: editingProject.title,
      description: editingProject.description,
      price: Number(editingProject.price || 0),
      category: editingProject.category,
    }).eq('id', editingProject.id);
    setEditingProject(null);
    fetchData();
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-24 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:px-8">
        <aside className="w-full rounded-[2rem] border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 lg:w-72">
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-700">Seller workspace</p>
            <h2 className="mt-2 text-2xl font-black">{profile?.full_name || profile?.email || 'Developer'}</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Premium dashboard for your projects, sales, and D-Coins.</p>
          </div>
          <nav className="space-y-2">
            {navItems.map((item) => (
              <button key={item.id} onClick={() => setActiveSection(item.id)} className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${activeSection === item.id ? 'bg-slate-900 text-white dark:bg-blue-500 dark:text-slate-950' : 'bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'}`}>
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 space-y-6">
          <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-700">DevSoko marketplace</p>
                <h1 className="mt-2 text-3xl font-black">Convert code into coins</h1>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Track your sales, reputation, and uploads from one premium workspace.</p>
              </div>
              <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                Reputation: {stats.reputation}
              </div>
            </div>
          </section>

          {activeSection === 'overview' && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[
                { label: 'Total Earnings', value: `KES ${stats.totalEarnings.toLocaleString()}` },
                { label: 'Total Sales', value: stats.totalSales },
                { label: 'Total Projects', value: stats.totalProjects },
                { label: 'Active Projects', value: stats.activeProjects },
                { label: 'Pending Orders', value: stats.pendingOrders },
                { label: 'D-Coin Balance', value: `${stats.dcoinBalance} D` },
              ].map((card) => (
                <div key={card.label} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">{card.label}</p>
                  <h3 className="mt-3 text-3xl font-black text-slate-900 dark:text-slate-100">{card.value}</h3>
                </div>
              ))}
            </div>
          )}

          {activeSection === 'projects' && (
            <div className="space-y-4">
              {projects.length === 0 ? <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-900">No projects yet. Start by uploading your first product.</div> : projects.map((project) => (
                <div key={project.id} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-black">{project.title}</h3>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-slate-600 dark:bg-slate-800 dark:text-slate-200">{project.status}</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{project.description}</p>
                      <div className="mt-4 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-blue-50 px-3 py-1 font-semibold text-blue-700 dark:bg-blue-950/70 dark:text-blue-300">{project.category}</span>
                        <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300">KES {project.price}</span>
                        <span className="rounded-full bg-purple-50 px-3 py-1 font-semibold text-purple-700 dark:bg-purple-950/70 dark:text-purple-300">{project.technologies || 'Software'}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => setEditingProject(project)} className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white dark:bg-blue-500 dark:text-slate-950">Edit</button>
                      <button onClick={() => updateProjectStatus(project.id, project.status === 'active' ? 'paused' : 'active')} className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">{project.status === 'active' ? 'Pause' : 'Activate'}</button>
                      <button onClick={() => deleteProject(project.id)} className="rounded-2xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600">Delete</button>
                      <button className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">View analytics</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeSection === 'upload' && (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <UploadForm />
            </div>
          )}

          {activeSection === 'sales' && (
            <div className="grid gap-4 md:grid-cols-2">
              {sales.length === 0 ? <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-900">No sales yet. Your first purchase will appear here.</div> : sales.map((sale) => (
                <div key={sale.id} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-black">{sale.project_title || 'Project sale'}</h3>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Buyer: {sale.buyer_email || 'Anonymous'}</p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300">{sale.status || 'completed'}</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
                    <span>Amount</span>
                    <span className="font-black text-slate-900 dark:text-slate-100">KES {sale.amount || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeSection === 'wallet' && (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-xl font-black">Wallet</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Your current D-Coin balance is ready for new uploads and platform activity.</p>
              <div className="mt-6 rounded-[1.5rem] bg-slate-900 p-6 text-white dark:bg-slate-800">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Available balance</p>
                <p className="mt-3 text-4xl font-black">{stats.dcoinBalance} D</p>
              </div>
            </div>
          )}

          {activeSection === 'dcoins' && (
            <div className="grid gap-4 md:grid-cols-2">
              {[
                { name: 'Starter', coins: 20, price: 'KES 100' },
                { name: 'Builder', coins: 50, price: 'KES 220' },
                { name: 'Creator', coins: 120, price: 'KES 450' },
                { name: 'Studio', coins: 300, price: 'KES 900' },
              ].map((pkg) => (
                <div key={pkg.name} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <h3 className="text-xl font-black">{pkg.name}</h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{pkg.coins} D-Coins</p>
                  <p className="mt-4 text-2xl font-black text-blue-700">{pkg.price}</p>
                </div>
              ))}
            </div>
          )}

          {activeSection === 'reputation' && (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-xl font-black">Reputation status</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Your reputation grows with sales, reviews, uploads, and reliable delivery.</p>
              <div className="mt-6 rounded-[1.5rem] bg-slate-100 p-6 dark:bg-slate-800">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Current level</p>
                <p className="mt-2 text-4xl font-black text-slate-900 dark:text-slate-100">{stats.reputation}</p>
              </div>
            </div>
          )}

          {activeSection === 'notifications' && <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">Notifications will appear here as soon as your activity starts flowing.</div>}
          {activeSection === 'profile' && <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">Your public profile is synced with Supabase and can be expanded with more details later.</div>}
          {activeSection === 'settings' && <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">Seller settings can be connected to Supabase preferences once your profile schema is expanded.</div>}
        </main>
      </div>

      {editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <form onSubmit={saveProjectEdit} className="w-full max-w-xl rounded-[2rem] bg-white p-6 shadow-2xl dark:bg-slate-900">
            <h3 className="text-xl font-black">Edit project</h3>
            <div className="mt-4 space-y-4">
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 dark:border-slate-700 dark:bg-slate-800" value={editingProject.title || ''} onChange={(event) => setEditingProject({ ...editingProject, title: event.target.value })} />
              <textarea className="w-full rounded-2xl border border-slate-200 px-4 py-3 dark:border-slate-700 dark:bg-slate-800" rows="4" value={editingProject.description || ''} onChange={(event) => setEditingProject({ ...editingProject, description: event.target.value })} />
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 dark:border-slate-700 dark:bg-slate-800" value={editingProject.price || ''} onChange={(event) => setEditingProject({ ...editingProject, price: event.target.value })} />
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 dark:border-slate-700 dark:bg-slate-800" value={editingProject.category || ''} onChange={(event) => setEditingProject({ ...editingProject, category: event.target.value })} />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setEditingProject(null)} className="rounded-2xl border border-slate-300 px-4 py-2 font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">Cancel</button>
              <button type="submit" className="rounded-2xl bg-slate-900 px-4 py-2 font-semibold text-white dark:bg-blue-500 dark:text-slate-950">Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default SellerDashboard;
