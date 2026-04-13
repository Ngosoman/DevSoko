import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { auth } from "../../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import useUserRole from "../../hooks/useUserRole";

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { role } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser || null);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setIsMobileOpen(false);
    navigate("/login");
  };

  const dashboardPath = user
    ? role === "admin"
      ? "/admin-dashboard"
      : role === "seller"
      ? "/seller-dashboard"
      : "/buyer-dashboard"
    : "/login";

  return (
    <nav className="sticky top-0 z-50 w-full">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <NavLink
          to="/"
          className="text-2xl font-black tracking-tight text-slate-900 hover:text-slate-700 transition-colors duration-300"
          onClick={() => setIsMobileOpen(false)}
        >
          DevSoko
        </NavLink>

        <div className="hidden items-center gap-3 md:flex">
          <NavLink
            to="/projects"
            className={({ isActive }) =>
              `rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-300 ${
                isActive
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
              }`
            }
          >
            Projects
          </NavLink>

          {role === "seller" && (
            <NavLink
              to="/upload"
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-300 ${
                  isActive
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                }`
              }
            >
              Upload
            </NavLink>
          )}

          <NavLink
            to="/contactpage"
            className={({ isActive }) =>
              `rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-300 ${
                isActive
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
              }`
            }
          >
            Contact
          </NavLink>

          {user ? (
            <>
              <NavLink
                to={dashboardPath}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-300 ${
                    isActive
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                  }`
                }
              >
                Dashboard
              </NavLink>
              <button
                onClick={handleLogout}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-all duration-300 hover:bg-slate-100"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                className="rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition-colors duration-300 hover:text-slate-900 hover:bg-slate-100"
              >
                Login
              </NavLink>
              <NavLink
                to="/register"
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:bg-slate-800"
                onClick={() => setIsMobileOpen(false)}
              >
                Register
              </NavLink>
            </>
          )}
        </div>

        <button
          onClick={() => setIsMobileOpen((prev) => !prev)}
          className="md:hidden rounded-lg p-2 text-slate-800 ring-offset-white transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300"
          aria-label="Toggle menu"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={isMobileOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
            />
          </svg>
        </button>
      </div>

      {isMobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white/95 backdrop-blur-sm shadow-xl">
          <div className="space-y-2 px-4 pb-4 pt-2">
            <NavLink
              to="/projects"
              className={({ isActive }) =>
                `block rounded-2xl px-4 py-3 text-sm font-semibold transition-colors duration-300 ${
                  isActive
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                }`
              }
              onClick={() => setIsMobileOpen(false)}
            >
              Projects
            </NavLink>

            {role === "seller" && (
              <NavLink
                to="/upload"
                className={({ isActive }) =>
                  `block rounded-2xl px-4 py-3 text-sm font-semibold transition-colors duration-300 ${
                    isActive
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                  }`
                }
                onClick={() => setIsMobileOpen(false)}
              >
                Upload
              </NavLink>
            )}

            <NavLink
              to="/contactpage"
              className={({ isActive }) =>
                `block rounded-2xl px-4 py-3 text-sm font-semibold transition-colors duration-300 ${
                  isActive
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                }`
              }
              onClick={() => setIsMobileOpen(false)}
            >
              Contact
            </NavLink>

            {user ? (
              <>
                <NavLink
                  to={dashboardPath}
                  className={({ isActive }) =>
                    `block rounded-2xl px-4 py-3 text-sm font-semibold transition-colors duration-300 ${
                      isActive
                        ? "bg-slate-100 text-slate-900"
                        : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                    }`
                  }
                  onClick={() => setIsMobileOpen(false)}
                >
                  Dashboard
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="block w-full rounded-2xl bg-slate-100 px-4 py-3 text-left text-sm font-semibold text-slate-800 transition-all duration-300 hover:bg-slate-200"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink
                  to="/login"
                  className="block rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition-colors duration-300 hover:text-slate-900 hover:bg-slate-100"
                  onClick={() => setIsMobileOpen(false)}
                >
                  Login
                </NavLink>
                <NavLink
                  to="/register"
                  className="block rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-slate-800"
                  onClick={() => setIsMobileOpen(false)}
                >
                  Register
                </NavLink>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
