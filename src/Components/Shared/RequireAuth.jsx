import { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "../../supabaseClient";

const RequireAuth = ({ children }) => {
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!mounted) return;
        setUser(user);
      } finally {
        if (mounted) setChecking(false);
      }
    };

    check();

    return () => {
      mounted = false;
    };
  }, []);

  if (checking) return null;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default RequireAuth;
