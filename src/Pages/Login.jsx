import { useState, useEffect } from 'react';
import LoginForm from "../Components/Auth/LoginForm";

const Login = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    // Generate animated code particles
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      speed: Math.random() * 0.5 + 0.2,
      opacity: Math.random() * 0.5 + 0.2,
      code: ['function', 'const', 'let', '=>', '{', '}', 'class', 'export'][Math.floor(Math.random() * 9)]
    }));
    setParticles(newParticles);

    const interval = setInterval(() => {
      setParticles(particles => particles.map(p => ({
        ...p,
        y: p.y + p.speed,
        opacity: Math.max(0, p.opacity - 0.01),
      })).filter(p => p.y < 110 && p.opacity > 0));
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className={`min-h-screen relative overflow-hidden transition-all duration-500 ${
      darkMode ? 'dark bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900' : 'bg-gradient-to-br from-gradient-50 via-blue-50 to-indigo-100'
    }`}>
      {/* Animated code particles */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="absolute font-mono text-xs font-bold transition-all duration-100 animate-float"
            style={{
              left: `${particle.x}vw`,
              top: `${particle.y}vh`,
              fontSize: `${particle.size}px`,
              opacity: particle.opacity,
              color: darkMode ? '#60A5FA' : '#3B82F6',
            }}
          >
            {particle.code}
          </div>
        ))}
      </div>

      {/* Floating orbs */}
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-primary-400/20 to-orange-400/20 rounded-full blur-3xl animate-float delay-1000"></div>
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-indigo-400/20 to-primary-400/20 rounded-full blur-3xl animate-float delay-2000"></div>
      <div className="absolute top-1/2 left-1/4 w-40 h-40 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-2xl animate-pulse"></div>

      {/* Dark/Light toggle */}
      <button
        onClick={toggleDarkMode}
        className="fixed top-6 right-6 p-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 dark:border-slate-700/50 hover:scale-110 transition-all duration-300 z-50"
        aria-label="Toggle theme"
      >
{darkMode ? (
  <svg className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
) : (
  <svg className="h-6 w-6 text-slate-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
)}
      </button>

      {/* Main content */}
      <div className="min-h-screen flex items-center justify-center p-4 lg:p-8 relative z-10">
        <div className={`max-w-md w-full space-y-8 transition-all duration-700 ${
          darkMode ? 'bg-slate-900/90 backdrop-blur-3xl border border-slate-700/50 shadow-2xl' : 'bg-white/80 backdrop-blur-3xl border border-white/50 shadow-2xl'
        } rounded-3xl p-10`}>
          <div className="text-center space-y-4">
<div className="mx-auto w-24 h-24 bg-gradient-to-r from-primary-500 to-orange-500 rounded-3xl flex items-center justify-center shadow-2xl animate-glow login-font">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="space-y-2">
              <h1 className={`text-4xl font-black bg-gradient-to-r from-primary-500 to-orange-600 bg-clip-text text-transparent ${
                darkMode ? 'drop-shadow-lg' : ''
              }`}>
                DevSoko
              </h1>
              <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Connect with top developers. Unlock premium projects.
              </p>
            </div>
          </div>
          <LoginForm darkMode={darkMode} />
          <div className="pt-8 border-t border-slate-200/50 dark:border-slate-700/50">
            <p className={`text-xs text-center ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              © 2026 DevSoko. Built for creators.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
