import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { getUserProfile } from "../lib/supabaseMarketplace";

const useUserRole = () => {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const profile = await getUserProfile(user.id);
      setRole(profile?.role || "buyer");
      setLoading(false);
    };

    fetchRole();
  }, []);

  return { role, loading };
};

export default useUserRole;
