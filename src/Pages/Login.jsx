import { motion as Motion } from "framer-motion";
import {
  Shield,
  Workflow,
  Sparkles,
  Clock3,
  Layers,
} from "lucide-react";
import LoginForm from "../Components/Auth/LoginForm";

const Login = () => {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <section className="relative w-full lg:w-1/2 overflow-hidden bg-slate-950 dark:bg-[#0d1117] px-6 py-10 sm:px-10 lg:px-14">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-14 h-44 w-44 rounded-full bg-cyan-500/20 blur-3xl" />
          <div className="absolute bottom-20 right-12 h-52 w-52 rounded-full bg-orange-500/20 blur-3xl" />
        </div>

        <Motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative mx-auto max-w-xl"
        >
          <p className="text-xs font-black uppercase tracking-[0.38em] text-slate-400">DevSoko Access</p>
          <h1 className="mt-5 text-4xl font-black leading-tight text-white sm:text-5xl">
            Welcome back to your
            <span className="block text-cyan-300">marketplace command center</span>
          </h1>
          <p className="mt-5 max-w-lg text-sm leading-7 text-slate-300">
            Continue where you left off, manage your projects, and scale your earnings in one secure workspace.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {[
              { icon: Shield, title: "Secure Auth", body: "Role-aware authentication for buyer, seller, and admin flows." },
              { icon: Workflow, title: "Live Workflows", body: "Real-time project, payment, and hiring operations." },
              { icon: Sparkles, title: "Premium Experience", body: "A polished dashboard designed for daily productivity." },
              { icon: Clock3, title: "Always in Sync", body: "Refresh data and track activity as your marketplace grows." },
            ].map((item, index) => (
              <Motion.article
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + index * 0.08 }}
                className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4 backdrop-blur"
              >
                <item.icon className="h-5 w-5 text-cyan-300" />
                <p className="mt-3 text-sm font-bold text-white">{item.title}</p>
                <p className="mt-1 text-xs leading-6 text-slate-400">{item.body}</p>
              </Motion.article>
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4 text-slate-300 backdrop-blur">
            <div className="flex items-center gap-3">
              <Layers className="h-5 w-5 text-orange-300" />
              <p className="text-sm font-semibold">Unified login for all roles</p>
            </div>
            <p className="mt-2 text-xs leading-6 text-slate-400">
              Admin accounts sign in from this same page and are automatically redirected to the admin dashboard.
            </p>
          </div>
        </Motion.div>
      </section>

      <section className="w-full lg:w-1/2 bg-white dark:bg-slate-950 flex items-center justify-center px-6 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <Motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 text-center"
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Sign in to DevSoko</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">Access your dashboard and continue building.</p>
          </Motion.div>
          <LoginForm />
        </div>
      </section>
    </div>
  );
};

export default Login;
