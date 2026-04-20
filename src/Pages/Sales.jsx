import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

const Sales = ({ user }) => {
  const [mySales, setMySales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSales = async () => {
      if (user && user.id) {
        const { data, error } = await supabase
          .from('purchases')
          .select('*, projects(*)')
          .eq('seller_id', user.id);

        if (error) {
          console.error("Error fetching sales:", error);
        } else {
          setMySales(data || []);
        }
      }
      setLoading(false);
    };

    fetchSales();
  }, [user]);

  if (loading) return <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center p-6 transition-colors duration-300">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-6 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        <h3 className="text-2xl font-semibold mb-6 text-slate-900 dark:text-slate-100">Your Sales</h3>
        {mySales.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400">No sales yet.</p>
        ) : (
          <ul className="space-y-4">
            {mySales.map((sale, idx) => (
              <li key={idx} className="border border-slate-200 dark:border-slate-700 p-6 rounded-lg bg-white dark:bg-slate-800 shadow-sm">
                <p className="font-semibold text-slate-900 dark:text-slate-100">Project: {sale.projects?.title || 'Unknown'}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Amount: KES {sale.amount}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Date: {new Date(sale.created_at).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Sales;
