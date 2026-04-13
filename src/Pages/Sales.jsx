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

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-4">
      <h3 className="text-xl font-semibold mb-4">Your Sales</h3>
      {mySales.length === 0 ? (
        <p className="text-gray-500">No sales yet.</p>
      ) : (
        <ul className="space-y-3">
          {mySales.map((sale, idx) => (
            <li key={idx} className="border p-4 rounded bg-white shadow">
              <p className="font-semibold">Project: {sale.projects?.title || 'Unknown'}</p>
              <p className="text-sm text-gray-600">Amount: KES {sale.amount}</p>
              <p className="text-sm text-gray-500">Date: {new Date(sale.created_at).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Sales;
