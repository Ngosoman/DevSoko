import { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { resolveUserRole } from "../../lib/supabaseMarketplace";

const RequireAuth = ({ children, allowedRoles = null }) => {
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!mounted) return;
        setUser(user);

        if (user) {
          const resolvedRole = await resolveUserRole(user);
          if (!mounted) return;
          setRole(resolvedRole || "buyer");
        }
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

  if (allowedRoles && !allowedRoles.includes(role)) {
    const redirectPath = role === "admin"
      ? "/admin-dashboard"
      : role === "seller"
        ? "/seller-dashboard"
        : "/buyer-dashboard";

    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

export default RequireAuth;
