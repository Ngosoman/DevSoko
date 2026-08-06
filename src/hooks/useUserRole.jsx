import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { resolveUserRole } from "../lib/supabaseMarketplace";

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

      const resolvedRole = await resolveUserRole(user);
      setRole(resolvedRole || "buyer");
      setLoading(false);
    };

    fetchRole();
  }, []);

  return { role, loading };
};

export default useUserRole;
