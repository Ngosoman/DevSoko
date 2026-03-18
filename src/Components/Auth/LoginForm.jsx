import { useState } from "react";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, db } from "../../firebase";
import { GoogleAuthProvider } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc } from "firebase/firestore";

const LoginForm = ({ darkMode }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await redirectByRole(userCredential.user);
    } catch {
      setError("Invalid credentials. Try demo or register.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await setDoc(doc(db, "users", result.user.uid), {
        role: "buyer",
        email: result.user.email,
        name: result.user.displayName || result.user.email.split('@')[0],
        createdAt: new Date().toISOString()
      }, { merge: true });
      await redirectByRole(result.user);
    } catch {
      setError("Google login failed. Try email.");
    } finally {
      setLoading(false);
    }
  };

  const redirectByRole = async (user) => {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const userRole = userDoc.exists() ? userDoc.data().role : "buyer";

    if (userRole === "admin") navigate("/admin-dashboard");
    else if (userRole === "seller") navigate("/seller-dashboard");
    else if (userRole === "buyer") navigate("/buyer-dashboard");
    else navigate("/dashboard");
  };

  const demoLogin = () => {
    setEmail("demo@devsoko.com");
    setPassword("demo123");
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleEmailLogin} className={`space-y-4 transition-all duration-300 ${
        darkMode ? 'text-slate-100' : 'text-slate-900'
      }`}>
        <div>
          <label className="block text-sm font-bold mb-2 opacity-90">Email</label>
          <input
            type="email"
            placeholder="demo@devsoko.com"
            className={`w-full px-4 py-4 rounded-2xl border-2 transition-all duration-300 focus:ring-4 focus:ring-primary-500/50 backdrop-blur-sm bg-white/60 dark:bg-slate-800/70 border-slate-200/50 dark:border-slate-600/50 focus:border-primary-500 shadow-xl hover:shadow-2xl ${
              error ? 'border-red-400 focus:ring-red-400/50' : ''
            }`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-bold mb-2 opacity-90">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="demo123"
              className={`w-full px-4 py-4 pr-12 rounded-2xl border-2 transition-all duration-300 focus:ring-4 focus:ring-primary-500/50 backdrop-blur-sm bg-white/60 dark:bg-slate-800/70 border-slate-200/50 dark:border-slate-600/50 focus:border-primary-500 shadow-xl hover:shadow-2xl relative peer ${
                error ? 'border-red-400 focus:ring-red-400/50' : ''
              }`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary-500 transition-colors p-1"
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 21.414v0M21 3v0l-8.586 8.586m0 0L21 21.414v0m0 0l-8.586-8.586" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl backdrop-blur-sm text-red-100 text-sm animate-pulse">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-primary-500 to-orange-500 text-white font-bold py-4 px-6 rounded-2xl shadow-2xl hover:shadow-3xl hover:scale-[1.02] transition-all duration-300 focus:ring-4 ring-primary-300 animate-pulse disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 uppercase tracking-wider text-sm"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Signing In...</span>
            </>
          ) : (
            <span>Sign In</span>
          )}
        </button>
      </form>

      <div className={`p-4 bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/30 rounded-2xl backdrop-blur-sm text-center transition-all ${
        darkMode ? 'text-emerald-200' : 'text-emerald-800'
      }`}>
        <p className="font-bold text-sm mb-1">🚀 Quick Demo</p>
        <p className="text-xs opacity-90 mb-2">demo@devsoko.com / demo123</p>
        <button
          type="button"
          onClick={demoLogin}
          className="text-xs px-4 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all duration-200 hover:scale-105 shadow-lg"
        >
          Fill Fields
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className={`w-full border-t border-slate-200 dark:border-slate-600`}></div>
        </div>
        <div className={`relative flex justify-center text-xs uppercase font-bold tracking-wider ${
          darkMode ? 'text-slate-500' : 'text-slate-400'
        }`}>
          Or sign in with
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className={`w-full flex items-center justify-center space-x-3 p-4 rounded-2xl font-semibold transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-[1.02] disabled:opacity-50 group ${
            darkMode
              ? 'bg-slate-800/50 border-2 border-slate-600/50 text-slate-200 hover:bg-slate-700'
              : 'bg-white/70 border-2 border-slate-200/50 text-slate-900 hover:bg-white'
          }`}
        >
          <svg className="w-6 h-6 group-hover:scale-110 transition-all" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span>Continue with Google</span>
        </button>
      </div>

      <p className={`text-xs text-center font-medium ${
        darkMode ? 'text-slate-500' : 'text-slate-500'
      }`}>
        Don't have account? <a href="/register" className="text-primary-500 hover:text-primary-600 font-bold">Sign up</a>
      </p>
    </div>
  );
};

export default LoginForm;
