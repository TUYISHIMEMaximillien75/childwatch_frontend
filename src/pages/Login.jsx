// Login.jsx
// Dependencies: React, Tailwind CSS, lucide-react
// Shared helpers: ./AuthShared  (BrandPanel, MobileTopBar, Field, Spinner)

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2 } from "lucide-react";
import { BrandPanel, MobileTopBar, Field, Spinner, ThemeToggle } from "./Authshared";
import { loginAdmin, loginUser } from "../services/authApi";
import { saveAuthSession, getDashboardRoute } from "../utils/authStorage";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function Login() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [errors,   setErrors]   = useState({});
  const [serverError, setServerError] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);

  /* ── Validation ── */
  const validate = () => {
    const e = {};
    if (!identifier) e.identifier = t("errors.required", "Email or phone is required");
    if (!password)                       e.password = t("errors.required", "Password is required");
    else if (password.length < 6)        e.password = t("profile.passwordTooShort", "At least 6 characters required");
    return e;
  };

  /* ── Submit ── */
  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const errs = validate();
    setErrors(errs);
    setServerError("");
    if (Object.keys(errs).length) return;

    try {
      setLoading(true);
      const loginValue = identifier.trim();
      const userData = await loginUser({ identifier: loginValue, password });
      saveAuthSession(userData.token, userData.user, "user");
      setSuccess(true);
      setTimeout(() => navigate(getDashboardRoute()), 700);
    } catch (userError) {
      const looksLikeEmail = /\S+@\S+\.\S+/.test(identifier);
      if (!looksLikeEmail) {
        setServerError(userError.message || "Login failed");
        return;
      }
      try {
        const adminData = await loginAdmin({ email: identifier.trim(), password });
        saveAuthSession(adminData.token, adminData.admin, "admin");
        setSuccess(true);
        setTimeout(() => navigate("/admin/dashboard"), 700);
      } catch (adminError) {
        setServerError(adminError.message || userError.message || "Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-950">

      {/* ── Mobile top bar ── */}
      <MobileTopBar
        href="/register"
        linkText="No account?"
        linkLabel="Register →"
      />

      {/* ── Left brand panel (desktop only) ── */}
      <div className="lg:w-[46%] xl:w-[42%] shrink-0">
        <BrandPanel mode="login" />
      </div>

      {/* ── Right form panel ── */}
      <div className="relative flex-1 flex items-center justify-center px-5 sm:px-10 py-12 lg:py-0">
        <ThemeToggle className="hidden lg:inline-flex absolute right-6 top-6" />
        {/* Language Switcher */}
        <div className="hidden lg:block absolute right-6 top-16">
          <LanguageSwitcher mode="light" opens="down" />
        </div>
        <div className="w-full max-w-[420px]">

          {/* ── Page heading ── */}
          <div className="mb-8">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-widest uppercase text-yellow-700 mb-3">
              <span className="block w-4 h-px bg-yellow-400" />
              {t("auth.signIn", "Sign in")}
            </span>
            <h1 className="text-[28px] sm:text-[32px] font-extrabold text-slate-900 dark:text-white leading-tight">
              {t("dashboard.welcome", "Welcome back")}
            </h1>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              {t("auth.signInSubtitle", "Sign in to your Childwatch account to continue protecting children.")}
            </p>
          </div>

          {/* ── Success state ── */}
          {success ? (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-7 text-center animate-in fade-in dark:bg-green-500/10 dark:border-green-500/30">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-[17px] font-extrabold text-green-800 dark:text-green-400 mb-1.5">
                Signed in successfully!
              </h3>
              <p className="text-[13px] text-green-600 dark:text-green-300 leading-relaxed">
                Redirecting you to your dashboard…
              </p>
            </div>

          ) : (
            /* ── Form ── */
            <form onSubmit={handleSubmit} noValidate className="space-y-4">

              {/* Email */}
              <Field
                label={t("auth.email", "Email or phone")}
                type="text"
                placeholder="you@example.com or +2507xxxxxxx"
                icon={Mail}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                error={errors.identifier}
              />

              {/* Password */}
              <Field
                label={t("auth.password", "Password")}
                type={showPass ? "text" : "password"}
                placeholder="Your password"
                icon={Lock}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={showPass ? "Hide password" : "Show password"}
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />

              {/* Remember / Forgot row */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <button
                    type="button"
                    onClick={() => setRemember(!remember)}
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-all
                      ${remember ? "border-yellow-500" : "border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900"}`}
                    style={remember ? { background: '#2563EB' } : {}}
                    aria-pressed={remember}
                  >
                    {remember && (
                      <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                  <span className="text-[12px] text-slate-600 dark:text-slate-300 font-medium">{t("auth.rememberMe", "Remember me")}</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[12px] font-semibold text-yellow-700 hover:text-yellow-900 transition-colors"
                >
                  {t("auth.forgotPassword", "Forgot password?")}
                </Link>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 mt-1 disabled:opacity-60
                  font-bold text-[14px] rounded-xl shadow-sm transition-all active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)',
                  color: '#FFFFFF',
                  boxShadow: '0 10px 30px rgba(37,99,235,0.16)'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'linear-gradient(135deg, #1D4ED8 0%, #1E3A8A 100%)'}
                onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)'}
              >
                {loading ? <Spinner /> : <><span>{t("auth.signIn", "Sign in")}</span><ArrowRight className="w-4 h-4" /></>}
              </button>

              {serverError && (
                <p className="text-[12px] text-red-500 font-medium">{serverError}</p>
              )}

            </form>
          )}

          {/* ── Switch to Register ── */}
          {!success && (
            <p className="text-center text-[13px] text-slate-500 dark:text-slate-400 mt-8">
              {t("auth.noAccount", "Don't have an account?")}{" "}
              <Link to="/register" className="font-bold text-yellow-700 hover:text-yellow-900 transition-colors">
                {t("auth.signUp", "Create one →")}
              </Link>
            </p>
          )}

          {/* ── Footer note ── */}
          <p className="text-center text-[11px] text-slate-400 dark:text-slate-500 mt-6 leading-relaxed">
            By signing in you agree to Childwatch&rsquo;s{" "}
            <a href="/terms" className="underline hover:text-slate-600 dark:hover:text-slate-300">Terms</a> and{" "}
            <a href="/privacy" className="underline hover:text-slate-600 dark:hover:text-slate-300">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
