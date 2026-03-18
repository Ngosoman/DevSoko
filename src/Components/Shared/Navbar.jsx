import { useEffect, useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { auth } from "../../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import useUserRole from "../../hooks/useUserRole";

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { role } = useUserRole();
  const navigate = useNavigate();

  // Keep legacy user listener for backward compat
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser || null);
    });

    return () => unsubscribe();
  }, []);

  // Handle scroll to toggle navbar background
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setIsMobileOpen(false);
    navigate("/login");
  };

  const toggleMobileMenu = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  return (
    <>
    <nav
      className={`sticky top-0 left-0 w-full z-50 transition-all duration-500 ease-in-out ${
        scrolled 
          ? "bg-white/90 backdrop-blur-md shadow-xl border-b border-gray-100" 
          : "bg-white/60 backdrop-blur-md shadow-lg"
      }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 md:py-3">
            {/* Logo */}
            <NavLink 
              to="/" 
              className="text-3xl md:text-4xl font-black bg-gradient-to-r from-primary-500 to-orange-600 bg-clip-text text-transparent hover:scale-105 transition-all duration-300"
              onClick={() => setIsMobileOpen(false)}
            >
              DevSoko
            </NavLink>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-1 lg:space-x-8">
              <NavLink
                to="/projects"
                className={({ isActive }) =>
                  `px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
                    isActive
                      ? "bg-primary-500 text-white shadow-lg"
                      : "text-gray-700 hover:text-primary-500 hover:bg-primary-50"
                  }`
                }
              >
                Projects
              </NavLink>

              {role === "seller" && (
                <NavLink
                  to="/upload"
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
                      isActive
                        ? "bg-primary-500 text-white shadow-lg"
                        : "text-gray-700 hover:text-primary-500 hover:bg-primary-50"
                    }`
                  }
                >
                  Upload
                </NavLink>
              )}

              {user ? (
                <>
                  <NavLink
                    to={role === "admin" ? "/admin-dashboard" : role === "seller" ? "/seller-dashboard" : "/buyer-dashboard"}
                    className={({ isActive }) =>
                      `px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
                        isActive
                          ? "bg-primary-500 text-white shadow-lg"
                          : "text-gray-700 hover:text-primary-500 hover:bg-primary-50"
                      }`
                    }
                  >
                    Dashboard
                  </NavLink>
                  <button
                    onClick={handleLogout}
                    className="px-6 py-2 bg-gray-100 text-gray-800 font-semibold rounded-xl hover:bg-gray-200 hover:shadow-md transition-all duration-300"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <NavLink
                    to="/login"
                    className="px-4 py-2 font-semibold text-primary-600 hover:text-primary-700 border border-primary-200 hover:border-primary-300 hover:bg-primary-50 rounded-xl transition-all duration-300"
                  >
                    Login
                  </NavLink>
                  <NavLink
                    to="/register"
                    className="px-6 py-2 bg-gradient-to-r from-primary-500 to-orange-600 text-white font-semibold rounded-xl hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
                    onClick={() => setIsMobileOpen(false)}
                  >
                    Register
                  </NavLink>
                </>
              )}
            </div>

            {/* Mobile hamburger button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={toggleMobileMenu}
                className="p-1 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg"
                aria-label="Toggle menu"
              >
                <svg
                  className={`w-8 h-8 transition-transform duration-300 ${
                    isMobileOpen ? "rotate-90" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
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
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-2xl">
            <div className="px-4 pt-2 pb-4 space-y-2 max-h-96 overflow-y-auto">
              <NavLink
                to="/projects"
                className={({ isActive }) =>
                  `block px-4 py-3 rounded-xl font-semibold transition-all duration-300 w-full text-left ${
                    isActive
                      ? "bg-primary-500 text-white shadow-lg"
                      : "text-gray-700 hover:text-primary-500 hover:bg-primary-50"
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
                    `block px-4 py-3 rounded-xl font-semibold transition-all duration-300 w-full text-left ${
                      isActive
                        ? "bg-primary-500 text-white shadow-lg"
                        : "text-gray-700 hover:text-primary-500 hover:bg-primary-50"
                    }`
                  }
                  onClick={() => setIsMobileOpen(false)}
                >
                  Upload
                </NavLink>
              )}

              {user ? (
                <>
                  <NavLink
                    to={role === "admin" ? "/admin-dashboard" : role === "seller" ? "/seller-dashboard" : "/buyer-dashboard"}
                    className={({ isActive }) =>
                      `block px-4 py-3 rounded-xl font-semibold transition-all duration-300 w-full text-left ${
                        isActive
                          ? "bg-primary-500 text-white shadow-lg"
                          : "text-gray-700 hover:text-primary-500 hover:bg-primary-50"
                      }`
                    }
                    onClick={() => setIsMobileOpen(false)}
                  >
                    Dashboard
                  </NavLink>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-3 text-gray-800 font-semibold bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-300"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <NavLink
                    to="/login"
                    className="block px-4 py-3 font-semibold text-primary-600 hover:text-primary-700 border border-primary-200 hover:border-primary-300 hover:bg-primary-50 rounded-xl transition-all duration-300"
                    onClick={() => setIsMobileOpen(false)}
                  >
                    Login
                  </NavLink>
                  <NavLink
                    to="/register"
                    className="block px-4 py-3 bg-gradient-to-r from-primary-500 to-orange-600 text-white font-semibold rounded-xl hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
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
    </>
  );
};

export default Navbar;
