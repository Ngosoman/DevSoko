import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../supabaseClient";
import { getCurrentUser, getUserProfile, listAllOrders, listAllProjects, listProfiles } from "../../lib/supabaseMarketplace";

const AdminDashboard = () => {
  const [tab, setTab] = useState("overview");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [projects, setProjects] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  const refreshData = async () => {
    try {
      setLoading(true);
      const authUser = await getCurrentUser();
      const [profileData, projectData, orderData, profileList] = await Promise.all([
        getUserProfile(authUser.id),
        listAllProjects(),
        listAllOrders(),
        listProfiles(),
      ]);

      setProfile(profileData);
      setProjects(projectData || []);
      setPurchases(orderData || []);
      setProfiles(profileList || []);
    } catch (error) {
      console.error("Admin dashboard error:", error);
      window.location.href = "/login";
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const filteredProjects = useMemo(() => {
    const term = search.toLowerCase();
    return projects.filter((project) => [project.title, project.description, project.category, project.status].filter(Boolean).join(" ").toLowerCase().includes(term));
  }, [projects, search]);

  const filteredPurchases = useMemo(() => {
    const term = search.toLowerCase();
    return purchases.filter((purchase) => [purchase.project_title, purchase.buyer_email, purchase.status].filter(Boolean).join(" ").toLowerCase().includes(term));
  }, [purchases, search]);

  const filteredProfiles = useMemo(() => {
    const term = search.toLowerCase();
    return profiles.filter((userProfile) => [userProfile.email, userProfile.full_name, userProfile.role].filter(Boolean).join(" ").toLowerCase().includes(term));
  }, [profiles, search]);

  const stats = useMemo(() => {
    const totalOrders = purchases.length;
    const totalRevenue = purchases.reduce((sum, purchase) => sum + Number(purchase.amount || purchase.price || 0), 0);
    const platformCommission = totalRevenue * 0.15;
    const uniqueUsers = new Set([
      ...profiles.map((item) => item.email).filter(Boolean),
      ...purchases.map((item) => item.buyer_email).filter(Boolean),
      ...projects.map((item) => item.seller_id).filter(Boolean),
    ]).size;
    return { totalOrders, totalRevenue, platformCommission, uniqueUsers };
  }, [purchases, profiles, projects]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleDeleteProject = async (id) => {
    if (!window.confirm("Are you sure? This action is permanent for the developer.")) return;
    try {
      await supabase.from("projects").delete().eq("id", id);
      await refreshData();
    } catch (error) {
      console.error("Delete project error:", error);
    }
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-200">Loading admin dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col lg:flex-row transition-colors duration-300">
      <aside className={`transition-all duration-300 ${isSidebarCollapsed ? 'w-full lg:w-20' : 'w-full lg:w-72'} bg-slate-900 dark:bg-slate-800 text-white flex flex-col p-6 shadow-2xl z-20`}>
        <div className={`mb-10 ${isSidebarCollapsed ? 'hidden lg:flex justify-center p-2' : ''}`}>
          <h1 className="text-2xl font-bold tracking-tighter">DEV<span className="text-indigo-400">SOKO</span></h1>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Admin Authority</p>
        </div>
        <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="mb-6 p-2 bg-slate-800/50 rounded-xl hover:bg-slate-700 transition-colors lg:mb-0" aria-label="Toggle sidebar">
          <svg className={`w-5 h-5 transition-transform ${isSidebarCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <nav className="flex-1 space-y-2">
          {[{ id: 'overview', label: 'Global Insights', icon: '📊' }, { id: 'projects', label: 'Project Inventory', icon: '💻' }, { id: 'payments', label: 'Transaction Ledger', icon: '💰' }, { id: 'users', label: 'User Management', icon: '👥' }].map(item => (
            <button key={item.id} onClick={() => setTab(item.id)} className={`w-full flex items-center justify-center lg:justify-start lg:items-start space-x-3 px-4 py-3 rounded-xl transition-all ${tab === item.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'} ${isSidebarCollapsed ? 'p-3 lg:p-4' : ''}`}>
              <span className="text-xl flex-shrink-0">{item.icon}</span>
              <span className={`font-semibold text-sm transition-opacity ${isSidebarCollapsed ? 'hidden lg:block opacity-0 lg:opacity-100' : 'block'}`}>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="mt-auto pt-6 border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className="w-full bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white px-4 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer"
          >
            Secure Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 lg:p-10 overflow-y-auto bg-slate-50 dark:bg-slate-950">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-10 space-y-4 md:space-y-0">
          <div>
            <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 capitalize">{tab} Control</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Monitoring real-time platform activity and data.</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-64 shadow-sm" />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">🔍</span>
            </div>
            <div className="h-10 w-10 bg-indigo-100 dark:bg-indigo-900/20 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold border-2 border-white dark:border-slate-700 shadow-sm">{(profile?.full_name || profile?.email || 'A').charAt(0).toUpperCase()}</div>
          </div>
        </header>

        {tab === "overview" && ( 
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Revenue', value: `KES ${stats.totalRevenue.toLocaleString()}`, color: 'text-slate-800', bg: 'bg-white' },
                { label: 'Platform Profit (15%)', value: `KES ${stats.platformCommission.toLocaleString()}`, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                { label: 'Active Users', value: stats.uniqueUsers, color: 'text-slate-800', bg: 'bg-white' },
                { label: 'Total Orders', value: stats.totalOrders, color: 'text-slate-800', bg: 'bg-white' },
              ].map((card, i) => (
                <div key={i} className={`${card.bg} p-6 rounded-3xl border border-slate-200 shadow-sm`}>
                  <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-2">{card.label}</p>
                  <h3 className={`text-2xl font-black ${card.color}`}>{card.value}</h3>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
              <h4 className="text-xl font-bold text-slate-800 mb-6">Activity Trends</h4>
              <div className="h-64 bg-slate-50 rounded-2xl flex items-center justify-center">
                <span className="text-slate-400">Live chart coming soon</span>
              </div>
            </div>
          </div>
        )}

        {tab === "projects" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
            {filteredProjects.map((project) => (
              <div key={project.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm group hover:shadow-xl transition-all">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-slate-800 line-clamp-1">{project.title}</h3>
                    <span className="bg-green-100 text-green-700 text-[10px] px-2 py-1 rounded-full font-black uppercase">KES {project.price}</span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">{project.description}</p>
                  <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-bold mb-6">
                    <span className="bg-slate-100 px-2 py-1 rounded uppercase tracking-wider">{project.category || 'Project'}</span>
                    <span className="bg-slate-100 px-2 py-1 rounded uppercase tracking-wider">{project.status || 'active'}</span>
                  </div>
                  <button onClick={() => handleDeleteProject(project.id)} className="w-full bg-red-50 text-red-600 py-3 rounded-2xl text-xs font-bold hover:bg-red-600 hover:text-white transition-all uppercase tracking-widest">
                    Terminate Listing
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "payments" && (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm animate-in fade-in duration-500">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-500">Timestamp</th>
                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-500">Buyer</th>
                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-500">Project</th>
                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-500">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPurchases.slice().reverse().slice(0, 10).map((order, index) => (
                    <tr key={index} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {order.created_at ? new Date(order.created_at).toLocaleDateString() : "Unknown"}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">{order.buyer_email || 'Anonymous'}</td>
                      <td className="px-6 py-4 text-sm text-slate-900">{order.project_title || `Project #${order.project_id || order.projectId || index + 1}`}</td>
                      <td className="px-6 py-4 text-sm font-bold text-green-600">KES {order.amount || order.price || 0}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full font-bold uppercase">{order.status || 'Completed'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "users" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex lg:flex-row flex-col lg:items-center lg:space-x-4 space-y-4 lg:space-y-0">
            </div>
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-500">Email</th>
                      <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-500">Name</th>
                      <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-500">Role</th>
                      <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-500">Joined</th>
                      <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProfiles.map((userProfile, index) => (
                      <tr key={userProfile.id || index} className="hover:bg-slate-50">
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">{userProfile.email}</td>
                        <td className="px-6 py-4 text-sm text-slate-500">{userProfile.full_name || userProfile.email?.split('@')[0]}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-bold">{userProfile.role || 'Buyer'}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">{userProfile.created_at ? new Date(userProfile.created_at).toLocaleDateString() : 'N/A'}</td>
                        <td className="px-6 py-4">
                          <span className="text-slate-600 text-xs font-bold">Managed</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
