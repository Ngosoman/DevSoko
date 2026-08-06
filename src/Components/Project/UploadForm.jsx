import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { v4 as uuidv4 } from "uuid";
import { addDcoinTransaction, createActivityLog, createProjectRecord, ensureWallet, getAdminSettings, getCurrentUser, getPricingCost, updateWalletBalance } from "../../lib/supabaseMarketplace";

const UploadForm = () => {
  const [form, setForm] = useState({ title: "", description: "", price: "", category: "React", technologies: "React", github_url: "", demo_url: "", size: "medium", status: "draft" });
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [documentationFile, setDocumentationFile] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(null);
  const [uploadCost, setUploadCost] = useState(0);
  const [wallet, setWallet] = useState({ balance: 0 });

  useEffect(() => {
    const loadData = async () => {
      try {
        const nextSettings = await getAdminSettings();
        setSettings(nextSettings);
        const user = await getCurrentUser();
        if (user) {
          const { data: walletData } = await supabase.from('wallets').select('*').eq('user_id', user.id).maybeSingle();
          setWallet(walletData || { balance: 0 });
        }
      } catch (error) {
        console.error('upload settings load error', error);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!settings) return;
    const cost = getPricingCost({ mode: settings.pricing_mode || 'technology', technology: form.technologies, size: form.size });
    setUploadCost(cost);
  }, [form.technologies, form.size, settings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const user = await getCurrentUser();
      if (!user) {
        setMessage("You must be logged in to upload a project.");
        setLoading(false);
        return;
      }

      const walletRecord = await ensureWallet(user.id);
      setWallet(walletRecord);

      if (Number(walletRecord.balance || 0) < uploadCost) {
        setMessage(`Insufficient D-Coins. Upload cost is ${uploadCost} coins.`);
        setLoading(false);
        return;
      }

      const thumbnailName = `${uuidv4()}-${thumbnailFile?.name || 'thumb.png'}`;
      let thumbnailUrl = "";
      if (thumbnailFile) {
        const { error: thumbError } = await supabase.storage.from('projects').upload(`thumbnails/${thumbnailName}`, thumbnailFile);
        if (thumbError) throw thumbError;
        thumbnailUrl = supabase.storage.from('projects').getPublicUrl(`thumbnails/${thumbnailName}`).data.publicUrl;
      }

      const documentationName = `${uuidv4()}-${documentationFile?.name || 'docs.txt'}`;
      let documentationUrl = "";
      if (documentationFile) {
        const { error: docError } = await supabase.storage.from('projects').upload(`documentation/${documentationName}`, documentationFile);
        if (docError) throw docError;
        documentationUrl = supabase.storage.from('projects').getPublicUrl(`documentation/${documentationName}`).data.publicUrl;
      }

      const projectPayload = {
        title: form.title,
        description: form.description,
        price: Number(form.price),
        category: form.category,
        technologies: form.technologies,
        github_url: form.github_url,
        demo_url: form.demo_url,
        thumbnail_url: thumbnailUrl,
        documentation_url: documentationUrl,
        status: 'pending',
        seller_id: user.id,
        seller_name: user.email,
        downloads: 0,
        views: 0,
        upload_cost: uploadCost,
        pricing_mode: settings?.pricing_mode || 'technology',
        created_at: new Date().toISOString(),
      };

      await createProjectRecord(projectPayload);
      await updateWalletBalance(user.id, -uploadCost);
      await addDcoinTransaction({ userId: user.id, amount: -uploadCost, type: 'deduction', reason: 'upload', metadata: { title: form.title } });
      await createActivityLog({ userId: user.id, action: 'project_uploaded', details: form.title });

      setMessage(`Project submitted successfully. ${uploadCost} D-Coins deducted.`);
      setForm({ title: "", description: "", price: "", category: "React", technologies: "React", github_url: "", demo_url: "", size: "medium", status: "draft" });
      setThumbnailFile(null);
      setDocumentationFile(null);
      const { data: walletData } = await supabase.from('wallets').select('*').eq('user_id', user.id).maybeSingle();
      setWallet(walletData || { balance: 0 });
    } catch (error) {
      console.error("Upload failed:", error);
      setMessage("Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl rounded-[2rem] border border-slate-200 bg-white/90 p-8 shadow-2xl backdrop-blur dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-700">Upload project</p>
          <h2 className="mt-2 text-3xl font-black text-slate-900 dark:text-slate-100">List a premium product</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Your upload cost is calculated live from the active D-Coin pricing mode.</p>
        </div>
        <div className="rounded-2xl bg-slate-100 px-4 py-3 text-right dark:bg-slate-800">
          <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500">Wallet</p>
          <p className="text-xl font-black text-slate-900 dark:text-slate-100">{Number(wallet.balance || 0)} D</p>
        </div>
      </div>

      {message && <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}

      <div className="grid gap-4 md:grid-cols-2">
        <input required type="text" placeholder="Project title" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <input required type="number" placeholder="Price (KES)" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        <input type="text" placeholder="Category" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
        <input type="text" placeholder="Technologies" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" value={form.technologies} onChange={(e) => setForm({ ...form, technologies: e.target.value })} />
        <input type="text" placeholder="GitHub URL" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" value={form.github_url} onChange={(e) => setForm({ ...form, github_url: e.target.value })} />
        <input type="text" placeholder="Demo URL" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" value={form.demo_url} onChange={(e) => setForm({ ...form, demo_url: e.target.value })} />
      </div>

      <textarea required rows="4" placeholder="Describe the project and what buyers will receive." className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
          <span className="mb-2 block font-semibold">Thumbnail</span>
          <input type="file" accept="image/*" onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)} />
        </label>
        <label className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
          <span className="mb-2 block font-semibold">Documentation / ZIP</span>
          <input type="file" accept="*/*" onChange={(e) => setDocumentationFile(e.target.files?.[0] || null)} />
        </label>
      </div>

      <div className="mt-6 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
        <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
          <span>Estimated upload cost</span>
          <span className="font-black text-slate-900 dark:text-slate-100">{uploadCost} D-Coins</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs uppercase tracking-[0.25em] text-slate-500">
          <span>Pricing mode</span>
          <span>{settings?.pricing_mode || 'technology'}</span>
        </div>
      </div>

      <button type="submit" disabled={loading} className="mt-6 w-full rounded-2xl bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:text-slate-950 dark:hover:bg-blue-400">
        {loading ? 'Uploading...' : 'Submit project'}
      </button>
    </form>
  );
};

export default UploadForm;
