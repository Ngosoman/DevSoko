import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listDeveloperProfiles } from "../lib/supabaseMarketplace";

const getDeveloperReputation = (developer) => {
  const skillsCount = Array.isArray(developer.skills) ? developer.skills.length : 0;
  const hourlyRate = Number(developer.hourly_rate || 0);
  let score = 55;
  score += Math.min(skillsCount * 6, 24);
  if (developer.featured) score += 12;
  if (hourlyRate > 0 && hourlyRate <= 50) score += 6;
  if (hourlyRate >= 120) score += 4;
  score = Math.max(40, Math.min(99, score));

  if (score >= 88) return { score, level: "Elite" };
  if (score >= 78) return { score, level: "Gold" };
  if (score >= 66) return { score, level: "Silver" };
  return { score, level: "Rising" };
};

const initialFormState = {
  name: "",
  email: "",
  company: "",
  message: "",
};

const ContactInquiryForm = () => {
  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState("");

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.name.trim()) {
      nextErrors.name = "Name is required.";
    }

    if (!formData.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!formData.company.trim()) {
      nextErrors.company = "Company is required.";
    }

    if (!formData.message.trim()) {
      nextErrors.message = "Tell us what you want to build or hire for.";
    } else if (formData.message.trim().length < 20) {
      nextErrors.message = "Please add a little more detail about your hiring needs.";
    }

    return nextErrors;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitStatus("");

    const nextErrors = validateForm();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Replace this with the actual contact-system integration.
      await new Promise((resolve) => setTimeout(resolve, 700));
      console.log("Contact inquiry submitted:", formData);
      setSubmitStatus("Thanks. Your request has been received and our team will reach out soon.");
      setFormData(initialFormState);
    } catch {
      setSubmitStatus("Something went wrong while submitting your inquiry. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-700 dark:text-blue-300">
            Contact inquiry
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Tell us what talent you need
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            Send us your hiring requirements and we will match you with the best developer for the job.
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:bg-slate-900"
                />
                {errors.name && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@company.com"
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:bg-slate-900"
                />
                {errors.email && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.email}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="company" className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Company
              </label>
              <input
                id="company"
                name="company"
                type="text"
                value={formData.company}
                onChange={handleChange}
                placeholder="Company or project name"
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:bg-slate-900"
              />
              {errors.company && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.company}</p>}
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Hiring requirements
              </label>
              <textarea
                id="message"
                name="message"
                rows="6"
                value={formData.message}
                onChange={handleChange}
                placeholder="Tell us the role, skills, timeline, budget, and any important project details."
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:bg-slate-900"
              />
              {errors.message && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-blue-500 dark:text-slate-950 dark:hover:bg-blue-400"
            >
              {isSubmitting ? "Sending inquiry..." : "Submit inquiry"}
            </button>

            {submitStatus && (
              <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                {submitStatus}
              </p>
            )}
          </form>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-900 p-6 text-white shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-8">
          <h3 className="text-2xl font-bold">Why contact us first?</h3>
          <ul className="mt-5 space-y-4 text-sm leading-6 text-slate-300">
            <li className="rounded-2xl bg-white/5 p-4">We shortlist the best fit based on your project goals.</li>
            <li className="rounded-2xl bg-white/5 p-4">We confirm availability before introducing you to a developer.</li>
            <li className="rounded-2xl bg-white/5 p-4">We help you move from inquiry to engagement without friction.</li>
          </ul>
        </div>
      </div>
    </section>
  );
};

const HireDevelopers = () => {
  const [developers, setDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDevelopers = async () => {
      try {
        setLoading(true);
        const profiles = await listDeveloperProfiles();
        setDevelopers(profiles);
      } catch (err) {
        console.error("Failed to load developer profiles", err);
        setError("We could not load featured developers right now. Please try again shortly.");
      } finally {
        setLoading(false);
      }
    };

    loadDevelopers();
  }, []);

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

              {/* <p className="mt-4 inline-flex rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-800 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-200">
                Public page: no login required to view or inquire.
              </p> */}

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

        {loading ? (
          <div className="mt-10 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            Loading featured developers...
          </div>
        ) : error ? (
          <div className="mt-10 rounded-3xl border border-red-200 bg-red-50 p-10 text-center text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        ) : developers.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            No featured developers have been added yet. Check back soon.
          </div>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {developers.map((developer) => (
              <article key={developer.id} className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
                {(() => {
                  const reputation = getDeveloperReputation(developer);
                  const skills = Array.isArray(developer.skills) ? developer.skills : [];
                  return (
                    <>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-xl font-black text-white dark:bg-blue-500 dark:text-slate-950">
                  {(developer.name || developer.full_name || developer.title || 'D').charAt(0)}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">{reputation.level} Reputation</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-700">Score {reputation.score}</span>
                  {developer.featured ? <span className="rounded-full bg-amber-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-amber-700">Featured</span> : null}
                </div>
                <h3 className="mt-5 text-xl font-bold">{developer.name || developer.full_name || developer.title || 'Developer'}</h3>
                <p className="mt-1 text-sm font-semibold text-blue-700 dark:text-blue-300">
                  {developer.role || developer.specialty || 'Developer'}
                </p>
                <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {developer.summary || developer.bio || 'Featured developer profile coming soon.'}
                </p>

                <div className="mt-5 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                  <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-950/70">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">Specialty:</span> {developer.speciality || developer.specialty || 'General development'}
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-950/70">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">Experience:</span> {developer.experience || 'Available'}
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-950/70">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">Starting rate:</span> {developer.rate || 'Available on request'}
                  </div>
                  {skills.length > 0 ? (
                    <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-950/70">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">Skills:</span> {skills.join(", ")}
                    </div>
                  ) : null}
                </div>

                <Link
                  to="/contactpage"
                  className="mt-6 inline-flex w-full items-center justify-center rounded-full border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Contact us to hire
                </Link>
                    </>
                  );
                })()}
              </article>
            ))}
          </div>
        )}
      </section>

      <ContactInquiryForm />

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