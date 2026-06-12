import { Link } from "react-router-dom";

const topDevelopers = [
  {
    name: "Tom Mwambingu",
    role: "Full-Stack Engineer",
    specialty: "React, Django, APIs, Frontend, Backend",
    experience: "3+ years",
    rate: "From $10/hr",
    summary:
      "Strong fit for marketplace builds, dashboards, and end-to-end product work.",
  },
  {
    name: "Eddy Frank",
    role: "Mobile & Frontend Developer",
    specialty: "React Native, Vite, UI systems",
    experience: "3+ years",
    rate: "From $15/hr",
    summary:
      "Best for polished customer-facing experiences and fast-moving product teams.",
  },
  {
    name: "Shem Oduor",
    role: "Backend Engineer",
    specialty: "Python, DRF, payments",
    experience: "3+ years",
    rate: "From $20/hr",
    summary:
      "Ideal for robust APIs, payment integrations, and secure platform workflows.",
  },
  {
    name: "Billy Kemboi",
    role: "Product & DevOps Engineer",
    specialty: "Deployment, CI/CD, cloud setup",
    experience: "3+ years",
    rate: "From $20/hr",
    summary:
      "Helps teams ship safely with deployment support, automation, and cloud readiness.",
  },
];

const HireDevelopers = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 pt-28 pb-16 transition-colors duration-300">
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white px-6 py-12 shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:px-10 lg:px-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.14),_transparent_36%),radial-gradient(circle_at_bottom_left,_rgba(15,23,42,0.08),_transparent_32%)] dark:bg-[radial-gradient(circle_at_top_right,_rgba(96,165,250,0.16),_transparent_36%),radial-gradient(circle_at_bottom_left,_rgba(30,41,59,0.24),_transparent_32%)]" />

          <div className="relative grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-700 dark:text-blue-300">
                Hire our developers
              </p>
              <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                Top talent, curated for your next build.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                Browse a curated list of our best developers, then contact us so we can match you with the right person for your project.
                We handle the introduction and hiring process so you can move fast without guessing.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to="/contactpage"
                  className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-blue-500 dark:text-slate-950 dark:hover:bg-blue-400"
                >
                  Contact us to hire
                </Link>
                <a
                  href="#developers"
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  See developers
                </a>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950/80">
              <h2 className="text-xl font-bold">How it works</h2>
              <ol className="mt-5 space-y-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
                <li className="rounded-2xl bg-white p-4 dark:bg-slate-900">
                  1. Review our top developers and their specialties.
                </li>
                <li className="rounded-2xl bg-white p-4 dark:bg-slate-900">
                  2. Contact us with your project scope, budget, and timeline.
                </li>
                <li className="rounded-2xl bg-white p-4 dark:bg-slate-900">
                  3. We introduce the best fit and help you start the engagement.
                </li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      <section id="developers" className="mx-auto max-w-7xl px-4 pb-6 pt-14 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-700 dark:text-blue-300">
              Featured developers
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Our top picks right now
            </h2>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
            Rates are indicative. Reach out to confirm availability, project fit, and final pricing.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {topDevelopers.map((developer) => (
            <article
              key={developer.name}
              className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-xl font-black text-white dark:bg-blue-500 dark:text-slate-950">
                {developer.name.charAt(0)}
              </div>
              <h3 className="mt-5 text-xl font-bold">{developer.name}</h3>
              <p className="mt-1 text-sm font-semibold text-blue-700 dark:text-blue-300">
                {developer.role}
              </p>
              <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {developer.summary}
              </p>

              <div className="mt-5 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-950/70">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">Specialty:</span> {developer.specialty}
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-950/70">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">Experience:</span> {developer.experience}
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-950/70">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">Starting rate:</span> {developer.rate}
                </div>
              </div>

              <Link
                to="/contactpage"
                className="mt-6 inline-flex w-full items-center justify-center rounded-full border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Contact us to hire
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-slate-900 px-6 py-10 text-white shadow-2xl dark:bg-slate-800 sm:px-10 lg:px-12">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl">Need help choosing the right developer?</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Tell us what you are building, and we will recommend the best developer from our team.
              </p>
            </div>
            <Link
              to="/contactpage"
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
            >
              Contact DevSoko
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HireDevelopers;