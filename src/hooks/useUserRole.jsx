import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

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

      const { data } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (data) {
        setRole(data.role);
      }
      setLoading(false);
    };

    fetchRole();
  }, []);

  return { role, loading };
};

export default useUserRole;
