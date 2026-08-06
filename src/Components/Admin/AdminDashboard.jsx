import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../supabaseClient";
import {
  DEFAULT_ADMIN_SETTINGS,
  getAdminSettings,
  getCurrentUser,
  getUserProfile,
  listAllOrders,
  listAllProjects,
  listDeveloperProfiles,
  listProfiles,
  deleteDeveloperProfile,
  saveAdminSettings,
  upsertDeveloperProfile,
} from "../../lib/supabaseMarketplace";

const navItems = [
  { id: "overview", label: "Overview", icon: "◫", description: "Revenue, health, and momentum" },
  { id: "projects", label: "Projects", icon: "◧", description: "Moderate listings and status" },
  { id: "payments", label: "Payments", icon: "◎", description: "Orders, value, and payouts" },
  { id: "users", label: "Users", icon: "◉", description: "Roles and account governance" },
  { id: "developers", label: "Hire Talent", icon: "◐", description: "Curate developer showcase" },
  { id: "activity", label: "Activity", icon: "◌", description: "Live platform timeline" },
  { id: "settings", label: "Settings", icon: "◍", description: "Pricing and platform rules" },
];

const tabTitles = {
  overview: "Executive Overview",
  projects: "Project Moderation",
  payments: "Transaction Ledger",
  users: "User Governance",
  developers: "Developer Talent Manager",
  activity: "Platform Activity",
  settings: "Marketplace Settings",
};

const formatMoney = (value) => `KES ${Number(value || 0).toLocaleString()}`;

const getRolePillClass = (role) => {
  if (role === "admin") return "bg-amber-100 text-amber-800";
  if (role === "seller") return "bg-blue-100 text-blue-800";
  return "bg-emerald-100 text-emerald-800";
};

const getStatusPillClass = (status) => {
  const normalized = `${status || ""}`.toLowerCase();
  if (["active", "approved", "published", "completed"].includes(normalized)) return "bg-emerald-100 text-emerald-700";
  if (["paused", "pending", "review"].includes(normalized)) return "bg-amber-100 text-amber-700";
  if (["cancelled", "rejected", "suspended"].includes(normalized)) return "bg-rose-100 text-rose-700";
  return "bg-slate-100 text-slate-700";
};

const getDeveloperReputation = (developer) => {
  const skillsCount = Array.isArray(developer.skills) ? developer.skills.length : 0;
  const hourlyRate = Number(developer.hourly_rate || 0);
  let score = 55;
  score += Math.min(skillsCount * 6, 24);
  if (developer.featured) score += 12;
  if (hourlyRate > 0 && hourlyRate <= 50) score += 6;
  if (hourlyRate >= 120) score += 4;
  score = Math.max(40, Math.min(99, score));

  if (score >= 88) return { score, level: "Elite" };
  if (score >= 78) return { score, level: "Gold" };
  if (score >= 66) return { score, level: "Silver" };
  return { score, level: "Rising" };
};

const AdminDashboard = () => {
  const [tab, setTab] = useState("overview");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [projects, setProjects] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [developerProfiles, setDeveloperProfiles] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [adminSettings, setAdminSettings] = useState(DEFAULT_ADMIN_SETTINGS);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [editingDeveloperId, setEditingDeveloperId] = useState(null);
  const [developerForm, setDeveloperForm] = useState({
    full_name: "",
    title: "",
    bio: "",
    skills: "",
    hourly_rate: "",
    image_url: "",
    featured: false,
  });

  const refreshData = async ({ silent = false } = {}) => {
    try {
      if (silent) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }

      const authUser = await getCurrentUser();
      const [profileData, projectData, orderData, profileList, settingsData, developerList] = await Promise.all([
        getUserProfile(authUser.id),
        listAllProjects(),
        listAllOrders(),
        listProfiles(),
        getAdminSettings(),
        listDeveloperProfiles(),
      ]);

      setProfile(profileData);
      setProjects(projectData || []);
      setPurchases(orderData || []);
      setProfiles(profileList || []);
      setAdminSettings(settingsData || DEFAULT_ADMIN_SETTINGS);
      setDeveloperProfiles(developerList || []);
    } catch (error) {
      console.error("Admin dashboard error:", error);
      window.location.href = "/login";
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    if (!statusMessage) return undefined;
    const timeout = window.setTimeout(() => setStatusMessage(""), 2600);
    return () => window.clearTimeout(timeout);
  }, [statusMessage]);

  const filteredProjects = useMemo(() => {
    const term = search.toLowerCase();
    return projects.filter((project) =>
      [project.title, project.description, project.category, project.status]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [projects, search]);

  const filteredPurchases = useMemo(() => {
    const term = search.toLowerCase();
    return purchases.filter((purchase) =>
      [purchase.project_title, purchase.buyer_email, purchase.status]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [purchases, search]);

  const filteredProfiles = useMemo(() => {
    const term = search.toLowerCase();
    return profiles.filter((userProfile) =>
      [userProfile.email, userProfile.full_name, userProfile.role]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [profiles, search]);

  const filteredDevelopers = useMemo(() => {
    const term = search.toLowerCase();
    return developerProfiles.filter((developer) =>
      [
        developer.full_name,
        developer.title,
        developer.bio,
        Array.isArray(developer.skills) ? developer.skills.join(" ") : "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [developerProfiles, search]);

  const stats = useMemo(() => {
    const totalOrders = purchases.length;
    const totalRevenue = purchases.reduce((sum, purchase) => sum + Number(purchase.amount || purchase.price || 0), 0);
    const commissionRate = Number(adminSettings?.commission_rate ?? DEFAULT_ADMIN_SETTINGS.commission_rate);
    const platformCommission = totalRevenue * commissionRate;
    const admins = profiles.filter((item) => item.role === "admin").length;
    const sellers = profiles.filter((item) => item.role === "seller").length;
    const buyers = profiles.filter((item) => item.role === "buyer").length;
    const activeProjects = projects.filter((item) => ["active", "approved", "published"].includes(`${item.status || ""}`.toLowerCase())).length;
    const pendingProjects = projects.filter((item) => ["pending", "review", "paused"].includes(`${item.status || ""}`.toLowerCase())).length;
    const uniqueUsers = new Set([
      ...profiles.map((item) => item.email).filter(Boolean),
      ...purchases.map((item) => item.buyer_email).filter(Boolean),
      ...projects.map((item) => item.seller_id).filter(Boolean),
    ]).size;

    return {
      totalOrders,
      totalRevenue,
      platformCommission,
      admins,
      sellers,
      buyers,
      activeProjects,
      pendingProjects,
      uniqueUsers,
      featuredDevelopers: developerProfiles.filter((item) => item.featured).length,
    };
  }, [adminSettings, profiles, projects, purchases, developerProfiles]);

  const recentActivity = useMemo(() => {
    const projectEvents = projects.slice(0, 5).map((project) => ({
      id: `project-${project.id}`,
      type: "Project",
      title: project.title || "Untitled project",
      subtitle: `${project.category || "General"} listing is ${project.status || "active"}`,
      stamp: project.updated_at || project.created_at,
    }));

    const orderEvents = purchases.slice(0, 5).map((order) => ({
      id: `order-${order.id}`,
      type: "Order",
      title: order.project_title || "Marketplace order",
      subtitle: `${order.buyer_email || "Anonymous buyer"} placed ${formatMoney(order.amount || order.price || 0)}`,
      stamp: order.updated_at || order.created_at,
    }));

    const profileEvents = profiles.slice(0, 5).map((item) => ({
      id: `profile-${item.id}`,
      type: "Account",
      title: item.full_name || item.email || "New user",
      subtitle: `${item.role || "buyer"} account joined the platform`,
      stamp: item.updated_at || item.created_at,
    }));

    const developerEvents = developerProfiles.slice(0, 5).map((item) => ({
      id: `developer-${item.id}`,
      type: "Developer",
      title: item.full_name || item.title || "Developer profile",
      subtitle: `${item.title || "Specialist"}${item.featured ? " featured for hiring" : " listed for hiring"}`,
      stamp: item.updated_at || item.created_at,
    }));

    return [...projectEvents, ...orderEvents, ...profileEvents, ...developerEvents]
      .filter((item) => item.stamp)
      .sort((left, right) => new Date(right.stamp) - new Date(left.stamp))
      .slice(0, 8);
  }, [profiles, projects, purchases, developerProfiles]);

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
      setStatusMessage("Project removed successfully.");
      await refreshData({ silent: true });
    } catch (error) {
      console.error("Delete project error:", error);
      setStatusMessage("Project removal failed.");
    }
  };

  const updateProjectStatus = async (projectId, status) => {
    try {
      await supabase.from("projects").update({ status, updated_at: new Date().toISOString() }).eq("id", projectId);
      setStatusMessage(`Project marked as ${status}.`);
      await refreshData({ silent: true });
    } catch (error) {
      console.error("Project status update error:", error);
      setStatusMessage("Project status update failed.");
    }
  };

  const updateUserRole = async (userId, nextRole) => {
    try {
      await supabase.from("profiles").update({ role: nextRole, updated_at: new Date().toISOString() }).eq("id", userId);
      setProfiles((current) => current.map((item) => (item.id === userId ? { ...item, role: nextRole } : item)));
      setStatusMessage(`User role updated to ${nextRole}.`);
    } catch (error) {
      console.error("User role update error:", error);
      setStatusMessage("User role update failed.");
    }
  };

  const handleDeveloperFormChange = (field, value) => {
    setDeveloperForm((current) => ({ ...current, [field]: value }));
  };

  const resetDeveloperForm = () => {
    setDeveloperForm({
      full_name: "",
      title: "",
      bio: "",
      skills: "",
      hourly_rate: "",
      image_url: "",
      featured: false,
    });
    setEditingDeveloperId(null);
  };

  const handleEditDeveloper = (developer) => {
    setEditingDeveloperId(developer.id);
    setDeveloperForm({
      full_name: developer.full_name || "",
      title: developer.title || "",
      bio: developer.bio || "",
      skills: Array.isArray(developer.skills) ? developer.skills.join(", ") : "",
      hourly_rate: developer.hourly_rate || "",
      image_url: developer.image_url || "",
      featured: Boolean(developer.featured),
    });
    setTab("developers");
  };

  const handleSaveDeveloper = async (event) => {
    event.preventDefault();
    const normalizedSkills = developerForm.skills
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);

    const payload = {
      ...(editingDeveloperId ? { id: editingDeveloperId } : {}),
      full_name: developerForm.full_name.trim(),
      title: developerForm.title.trim(),
      bio: developerForm.bio.trim(),
      skills: normalizedSkills,
      hourly_rate: Number(developerForm.hourly_rate || 0),
      image_url: developerForm.image_url.trim() || null,
      featured: Boolean(developerForm.featured),
    };

    if (!payload.full_name || !payload.title) {
      setStatusMessage("Developer name and title are required.");
      return;
    }

    try {
      await upsertDeveloperProfile(payload);
      setStatusMessage(editingDeveloperId ? "Developer profile updated." : "Developer profile created.");
      resetDeveloperForm();
      await refreshData({ silent: true });
    } catch (error) {
      console.error("Developer save error:", error);
      setStatusMessage("Unable to save developer profile.");
    }
  };

  const handleDeleteDeveloper = async (developerId) => {
    if (!window.confirm("Delete this developer profile from the public hire page?")) return;
    try {
      await deleteDeveloperProfile(developerId);
      setStatusMessage("Developer profile deleted.");
      await refreshData({ silent: true });
    } catch (error) {
      console.error("Developer delete error:", error);
      setStatusMessage("Unable to delete developer profile.");
    }
  };

  const toggleFeaturedDeveloper = async (developer) => {
    try {
      await upsertDeveloperProfile({
        ...developer,
        featured: !developer.featured,
      });
      setStatusMessage(developer.featured ? "Developer removed from featured list." : "Developer marked as featured.");
      await refreshData({ silent: true });
    } catch (error) {
      console.error("Developer featured toggle error:", error);
      setStatusMessage("Unable to update featured status.");
    }
  };

  const handleSettingChange = (field, value) => {
    setAdminSettings((current) => ({ ...current, [field]: value }));
  };

  const handleNestedSettingChange = (group, key, value) => {
    setAdminSettings((current) => ({
      ...current,
      [group]: {
        ...(current[group] || {}),
        [key]: Number(value || 0),
      },
    }));
  };

  const handleSaveSettings = async (event) => {
    event.preventDefault();
    try {
      setIsSavingSettings(true);
      const payload = {
        ...adminSettings,
        commission_rate: Number(adminSettings.commission_rate || 0),
        reward_dcoins: Number(adminSettings.reward_dcoins || 0),
      };
      const saved = await saveAdminSettings(payload);
      setAdminSettings(saved || payload);
      setStatusMessage("Marketplace settings saved.");
    } catch (error) {
      console.error("Settings save error:", error);
      setStatusMessage("Failed to save marketplace settings.");
    } finally {
      setIsSavingSettings(false);
    }
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-200">Loading admin dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-[#f7f7fb] text-slate-900 dark:bg-slate-950 dark:text-slate-100 lg:flex">
      <aside className={`border-b border-slate-200 bg-slate-950 text-white transition-all duration-300 dark:border-slate-800 lg:min-h-screen lg:border-b-0 lg:border-r ${isSidebarCollapsed ? "lg:w-24" : "lg:w-80"}`}>
        <div className="flex h-full flex-col p-4 lg:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className={`${isSidebarCollapsed ? "lg:hidden" : "block"}`}>
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">Admin Authority</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight">DevSoko</h1>
              <p className="mt-2 text-sm text-slate-400">Control listings, users, orders, and pricing from one workspace.</p>
            </div>
            <button onClick={() => setIsSidebarCollapsed((current) => !current)} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3 text-slate-200 transition hover:bg-slate-800" aria-label="Toggle sidebar">
              <svg className={`h-5 w-5 transition-transform ${isSidebarCollapsed ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>

          <div className={`mt-6 rounded-[1.75rem] border border-slate-800 bg-slate-900/70 p-4 ${isSidebarCollapsed ? "lg:hidden" : "block"}`}>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/15 text-lg font-black text-indigo-300">
                {(profile?.full_name || profile?.email || "A").charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold text-white">{profile?.full_name || "Platform admin"}</p>
                <p className="text-xs text-slate-400">{profile?.email || "admin@devsoko.com"}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-slate-800/80 p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Revenue</p>
                <p className="mt-2 font-black text-white">{formatMoney(stats.totalRevenue)}</p>
              </div>
              <div className="rounded-2xl bg-slate-800/80 p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Users</p>
                <p className="mt-2 font-black text-white">{stats.uniqueUsers}</p>
              </div>
            </div>
          </div>

          <nav className="mt-6 flex-1 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${tab === item.id ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "text-slate-300 hover:bg-slate-900 hover:text-white"} ${isSidebarCollapsed ? "justify-center lg:px-2" : ""}`}
              >
                <span className="text-lg font-black">{item.icon}</span>
                <span className={`${isSidebarCollapsed ? "hidden lg:hidden" : "block"}`}>
                  <span className="block text-sm font-bold">{item.label}</span>
                  <span className="block text-[11px] text-current/70">{item.description}</span>
                </span>
              </button>
            ))}
          </nav>

          <div className={`mt-6 space-y-3 border-t border-slate-800 pt-4 ${isSidebarCollapsed ? "lg:hidden" : "block"}`}>
            <button onClick={() => refreshData({ silent: true })} className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-bold text-slate-200 transition hover:bg-slate-800" disabled={isRefreshing}>
              {isRefreshing ? "Refreshing..." : "Refresh live data"}
            </button>
            <button onClick={handleLogout} className="w-full rounded-2xl bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-300 transition hover:bg-rose-500 hover:text-white">
              Secure Logout
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-4 lg:p-8">
        <header className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-indigo-600">Marketplace Command</p>
              <h2 className="mt-2 text-3xl font-black text-slate-900 dark:text-slate-100">{tabTitles[tab] || "Admin Dashboard"}</h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">Monitor platform performance, moderate supply, and adjust marketplace policies in real time.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search dashboard data"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 sm:w-72"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">⌕</span>
              </div>
              <button onClick={() => refreshData({ silent: true })} className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-indigo-500 dark:text-slate-950" disabled={isRefreshing}>
                {isRefreshing ? "Refreshing..." : "Sync now"}
              </button>
            </div>
          </div>
          {statusMessage ? <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{statusMessage}</div> : null}
        </header>

        <div className="mt-6 space-y-6">
          {tab === "overview" && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
                {[
                  { label: "Total Revenue", value: formatMoney(stats.totalRevenue), tone: "bg-white text-slate-900" },
                  { label: "Platform Margin", value: formatMoney(stats.platformCommission), tone: "bg-indigo-50 text-indigo-700" },
                  { label: "Active Listings", value: stats.activeProjects, tone: "bg-white text-slate-900" },
                  { label: "Featured Talent", value: stats.featuredDevelopers, tone: "bg-amber-50 text-amber-700" },
                ].map((card) => (
                  <div key={card.label} className={`rounded-[1.75rem] border border-slate-200 p-6 shadow-sm ${card.tone}`}>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-current/60">{card.label}</p>
                    <h3 className="mt-3 text-3xl font-black">{card.value}</h3>
                  </div>
                ))}
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
                <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Operations Snapshot</p>
                      <h3 className="mt-2 text-2xl font-black">Marketplace balance</h3>
                    </div>
                    <button onClick={() => setTab("activity")} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">View activity</button>
                  </div>
                  <div className="mt-6 grid gap-4 md:grid-cols-3">
                    <div className="rounded-[1.5rem] bg-slate-50 p-5 dark:bg-slate-800">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Admins</p>
                      <p className="mt-3 text-3xl font-black">{stats.admins}</p>
                    </div>
                    <div className="rounded-[1.5rem] bg-slate-50 p-5 dark:bg-slate-800">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Sellers</p>
                      <p className="mt-3 text-3xl font-black">{stats.sellers}</p>
                    </div>
                    <div className="rounded-[1.5rem] bg-slate-50 p-5 dark:bg-slate-800">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Buyers</p>
                      <p className="mt-3 text-3xl font-black">{stats.buyers}</p>
                    </div>
                  </div>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <button onClick={() => setTab("projects")} className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-indigo-500 dark:text-slate-950">Moderate projects</button>
                    <button onClick={() => setTab("users")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Manage user roles</button>
                    <button onClick={() => setTab("developers")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Curate developer talent</button>
                    <button onClick={() => setTab("settings")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Adjust pricing</button>
                  </div>
                </section>

                <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Latest Signals</p>
                  <h3 className="mt-2 text-2xl font-black">What changed today</h3>
                  <div className="mt-6 space-y-4">
                    {recentActivity.slice(0, 4).map((item) => (
                      <div key={item.id} className="rounded-[1.5rem] bg-slate-50 p-4 dark:bg-slate-800">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600">{item.type}</span>
                          <span className="text-xs text-slate-400">{new Date(item.stamp).toLocaleString()}</span>
                        </div>
                        <p className="mt-2 text-sm font-bold text-slate-900 dark:text-slate-100">{item.title}</p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.subtitle}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          )}

          {tab === "projects" && (
            <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
              {filteredProjects.map((project) => (
                <article key={project.id} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">{project.category || "Project"}</p>
                      <h3 className="mt-2 text-xl font-black">{project.title}</h3>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] ${getStatusPillClass(project.status)}`}>
                      {project.status || "active"}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">{project.description || "No description added."}</p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">{formatMoney(project.price)}</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">Seller: {project.seller_id?.slice(0, 8) || "Unknown"}</span>
                  </div>
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <button onClick={() => updateProjectStatus(project.id, "approved")} className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-600">Approve</button>
                    <button onClick={() => updateProjectStatus(project.id, "paused")} className="rounded-2xl border border-amber-200 px-4 py-3 text-sm font-bold text-amber-700 transition hover:bg-amber-50">Pause</button>
                    <button onClick={() => updateProjectStatus(project.id, "review")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Send to review</button>
                    <button onClick={() => handleDeleteProject(project.id)} className="rounded-2xl border border-rose-200 px-4 py-3 text-sm font-bold text-rose-700 transition hover:bg-rose-50">Delete</button>
                  </div>
                </article>
              ))}
              {filteredProjects.length === 0 ? <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-900">No projects match the current search.</div> : null}
            </div>
          )}

          {tab === "payments" && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Order Volume</p>
                  <h3 className="mt-3 text-3xl font-black">{stats.totalOrders}</h3>
                </div>
                <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Gross Revenue</p>
                  <h3 className="mt-3 text-3xl font-black">{formatMoney(stats.totalRevenue)}</h3>
                </div>
                <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Commission Rate</p>
                  <h3 className="mt-3 text-3xl font-black">{Math.round(Number(adminSettings.commission_rate || 0) * 100)}%</h3>
                </div>
              </div>
              <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/70">
                      <tr>
                        <th className="px-6 py-4 text-xs font-black uppercase tracking-[0.25em] text-slate-500">Timestamp</th>
                        <th className="px-6 py-4 text-xs font-black uppercase tracking-[0.25em] text-slate-500">Buyer</th>
                        <th className="px-6 py-4 text-xs font-black uppercase tracking-[0.25em] text-slate-500">Project</th>
                        <th className="px-6 py-4 text-xs font-black uppercase tracking-[0.25em] text-slate-500">Amount</th>
                        <th className="px-6 py-4 text-xs font-black uppercase tracking-[0.25em] text-slate-500">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredPurchases.map((order, index) => (
                        <tr key={order.id || index} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="px-6 py-4 text-sm text-slate-500">{order.created_at ? new Date(order.created_at).toLocaleString() : "Unknown"}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-slate-100">{order.buyer_email || "Anonymous"}</td>
                          <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">{order.project_title || `Project #${order.project_id || index + 1}`}</td>
                          <td className="px-6 py-4 text-sm font-black text-emerald-600">{formatMoney(order.amount || order.price || 0)}</td>
                          <td className="px-6 py-4">
                            <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] ${getStatusPillClass(order.status)}`}>
                              {order.status || "completed"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {tab === "users" && (
            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-slate-50 dark:bg-slate-800/70">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-[0.25em] text-slate-500">Email</th>
                      <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-[0.25em] text-slate-500">Name</th>
                      <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-[0.25em] text-slate-500">Role</th>
                      <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-[0.25em] text-slate-500">Joined</th>
                      <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-[0.25em] text-slate-500">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredProfiles.map((userProfile, index) => (
                      <tr key={userProfile.id || index} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-slate-100">{userProfile.email}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{userProfile.full_name || userProfile.email?.split("@")[0]}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] ${getRolePillClass(userProfile.role)}`}>
                            {userProfile.role || "buyer"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">{userProfile.created_at ? new Date(userProfile.created_at).toLocaleDateString() : "N/A"}</td>
                        <td className="px-6 py-4">
                          <select
                            value={userProfile.role || "buyer"}
                            onChange={(event) => updateUserRole(userProfile.id, event.target.value)}
                            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                          >
                            <option value="buyer">Buyer</option>
                            <option value="seller">Seller</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "developers" && (
            <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Hire Developers Management</p>
                <h3 className="mt-2 text-2xl font-black">{editingDeveloperId ? "Edit developer profile" : "Add developer to public listing"}</h3>
                <form onSubmit={handleSaveDeveloper} className="mt-6 space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                      <span>Full name</span>
                      <input value={developerForm.full_name} onChange={(event) => handleDeveloperFormChange("full_name", event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-800" placeholder="Jane Wanjiku" />
                    </label>
                    <label className="space-y-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                      <span>Role / title</span>
                      <input value={developerForm.title} onChange={(event) => handleDeveloperFormChange("title", event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-800" placeholder="Senior React Engineer" />
                    </label>
                  </div>
                  <label className="space-y-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                    <span>Bio / summary</span>
                    <textarea rows={4} value={developerForm.bio} onChange={(event) => handleDeveloperFormChange("bio", event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-800" placeholder="What this developer is best at and ideal projects." />
                  </label>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                      <span>Skills (comma separated)</span>
                      <input value={developerForm.skills} onChange={(event) => handleDeveloperFormChange("skills", event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-800" placeholder="React, Node.js, TypeScript" />
                    </label>
                    <label className="space-y-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                      <span>Hourly rate (KES)</span>
                      <input type="number" min="0" value={developerForm.hourly_rate} onChange={(event) => handleDeveloperFormChange("hourly_rate", event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-800" placeholder="3500" />
                    </label>
                  </div>
                  <label className="space-y-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                    <span>Avatar image URL (optional)</span>
                    <input value={developerForm.image_url} onChange={(event) => handleDeveloperFormChange("image_url", event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-800" placeholder="https://..." />
                  </label>
                  <label className="inline-flex items-center gap-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                    <input type="checkbox" checked={developerForm.featured} onChange={(event) => handleDeveloperFormChange("featured", event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                    Mark as featured on Hire Developers page
                  </label>
                  <div className="flex flex-wrap justify-end gap-3">
                    {editingDeveloperId ? (
                      <button type="button" onClick={resetDeveloperForm} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                        Cancel edit
                      </button>
                    ) : null}
                    <button type="submit" className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-indigo-500 dark:text-slate-950">
                      {editingDeveloperId ? "Update profile" : "Add developer"}
                    </button>
                  </div>
                </form>
              </section>

              <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Public roster</p>
                    <h3 className="mt-2 text-2xl font-black">Developer profiles</h3>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-slate-600 dark:bg-slate-800 dark:text-slate-300">{filteredDevelopers.length} listed</span>
                </div>
                <div className="mt-5 space-y-3">
                  {filteredDevelopers.map((developer) => {
                    const reputation = getDeveloperReputation(developer);
                    return (
                      <article key={developer.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-black text-slate-900 dark:text-slate-100">{developer.full_name || "Developer"}</p>
                            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">{developer.title || "Specialist"}</p>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${developer.featured ? "bg-amber-100 text-amber-700" : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200"}`}>
                            {developer.featured ? "Featured" : "Listed"}
                          </span>
                        </div>
                        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{developer.bio || "No bio added yet."}</p>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full bg-emerald-100 px-3 py-1 font-bold text-emerald-700">Rep {reputation.level} · {reputation.score}</span>
                          <span className="rounded-full bg-blue-100 px-3 py-1 font-bold text-blue-700">KES {Number(developer.hourly_rate || 0).toLocaleString()}/hr</span>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button onClick={() => handleEditDeveloper(developer)} className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700">Edit</button>
                          <button onClick={() => toggleFeaturedDeveloper(developer)} className="rounded-xl border border-amber-200 px-3 py-2 text-xs font-bold text-amber-700 transition hover:bg-amber-50">{developer.featured ? "Unfeature" : "Feature"}</button>
                          <button onClick={() => handleDeleteDeveloper(developer.id)} className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-50">Delete</button>
                        </div>
                      </article>
                    );
                  })}
                  {filteredDevelopers.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900">No developer profiles yet. Add your first profile from the form.</div> : null}
                </div>
              </section>
            </div>
          )}

          {tab === "activity" && (
            <div className="grid gap-4 lg:grid-cols-2">
              {recentActivity.map((item) => (
                <div key={item.id} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-indigo-700">{item.type}</span>
                    <span className="text-xs text-slate-400">{new Date(item.stamp).toLocaleString()}</span>
                  </div>
                  <h3 className="mt-3 text-xl font-black">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{item.subtitle}</p>
                </div>
              ))}
            </div>
          )}

          {tab === "settings" && (
            <form onSubmit={handleSaveSettings} className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Pricing Engine</p>
                <h3 className="mt-2 text-2xl font-black">Upload pricing and incentives</h3>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                    <span>Pricing mode</span>
                    <select value={adminSettings.pricing_mode || "technology"} onChange={(event) => handleSettingChange("pricing_mode", event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-800">
                      <option value="technology">Technology</option>
                      <option value="project-size">Project size</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </label>
                  <label className="space-y-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                    <span>Commission rate</span>
                    <input type="number" min="0" max="1" step="0.01" value={adminSettings.commission_rate ?? 0.1} onChange={(event) => handleSettingChange("commission_rate", Number(event.target.value))} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-800" />
                  </label>
                  <label className="space-y-2 text-sm font-semibold text-slate-700 dark:text-slate-200 md:col-span-2">
                    <span>Reward D-Coins</span>
                    <input type="number" min="0" step="1" value={adminSettings.reward_dcoins ?? 3} onChange={(event) => handleSettingChange("reward_dcoins", Number(event.target.value))} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-800" />
                  </label>
                </div>

                <div className="mt-8">
                  <h4 className="text-lg font-black">Technology costs</h4>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {Object.entries(adminSettings.technology_costs || {}).map(([key, value]) => (
                      <label key={key} className="space-y-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                        <span>{key}</span>
                        <input type="number" min="0" step="1" value={value} onChange={(event) => handleNestedSettingChange("technology_costs", key, event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-800" />
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mt-8">
                  <h4 className="text-lg font-black">Project size costs</h4>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {Object.entries(adminSettings.project_size_costs || {}).map(([key, value]) => (
                      <label key={key} className="space-y-2 text-sm font-semibold capitalize text-slate-700 dark:text-slate-200">
                        <span>{key}</span>
                        <input type="number" min="0" step="1" value={value} onChange={(event) => handleNestedSettingChange("project_size_costs", key, event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-800" />
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <button type="submit" disabled={isSavingSettings} className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-indigo-500 dark:text-slate-950">
                    {isSavingSettings ? "Saving..." : "Save settings"}
                  </button>
                </div>
              </section>

              <section className="space-y-6">
                <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Policy Summary</p>
                  <h3 className="mt-2 text-2xl font-black">Current platform rules</h3>
                  <div className="mt-6 space-y-4 text-sm text-slate-600 dark:text-slate-300">
                    <div className="rounded-[1.5rem] bg-slate-50 p-4 dark:bg-slate-800">
                      <p className="font-bold text-slate-900 dark:text-slate-100">Pricing mode</p>
                      <p className="mt-1 capitalize">{adminSettings.pricing_mode || "technology"}</p>
                    </div>
                    <div className="rounded-[1.5rem] bg-slate-50 p-4 dark:bg-slate-800">
                      <p className="font-bold text-slate-900 dark:text-slate-100">Commission</p>
                      <p className="mt-1">{Math.round(Number(adminSettings.commission_rate || 0) * 100)}% of each order</p>
                    </div>
                    <div className="rounded-[1.5rem] bg-slate-50 p-4 dark:bg-slate-800">
                      <p className="font-bold text-slate-900 dark:text-slate-100">Reward credits</p>
                      <p className="mt-1">{Number(adminSettings.reward_dcoins || 0)} D-Coins per qualifying action</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Quick actions</p>
                  <div className="mt-4 space-y-3">
                    <button type="button" onClick={() => setTab("projects")} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-left text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Review current project supply</button>
                    <button type="button" onClick={() => setTab("users")} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-left text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Adjust team access and roles</button>
                    <button type="button" onClick={() => refreshData({ silent: true })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-left text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Pull a fresh marketplace snapshot</button>
                  </div>
                </div>
              </section>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
