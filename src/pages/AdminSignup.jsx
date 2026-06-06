import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { BrandPanel, MobileTopBar, Field, Spinner, ThemeToggle } from "./Authshared";
import { signupAdmin } from "../services/authApi";

export default function AdminSignup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const setField = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.fullName.trim()) nextErrors.fullName = "Full name is required";
    if (!form.email.trim()) nextErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) nextErrors.email = "Enter a valid email";
    if (!form.password) nextErrors.password = "Password is required";
    else if (form.password.length < 6) nextErrors.password = "At least 6 characters required";
    if (form.confirmPassword !== form.password) {
      nextErrors.confirmPassword = "Passwords do not match";
    }

    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    setServerError("");

    if (Object.keys(nextErrors).length) return;

    try {
      setLoading(true);
      await signupAdmin({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
      });

      setSuccess(true);
      setTimeout(() => navigate("/login"), 1200);
    } catch (error) {
      setServerError(error.message || "Failed to create admin account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-950">
      <MobileTopBar isLogin={false} href="/login" linkText="Have an account?" linkLabel="Sign in →" />

      <div className="lg:w-[46%] xl:w-[42%] shrink-0">
        <BrandPanel mode="register" />
      </div>

      <div className="relative flex-1 flex items-center justify-center px-5 sm:px-10 py-12 lg:py-0">
        <ThemeToggle className="hidden lg:inline-flex absolute right-6 top-6" />
        <div className="w-full max-w-[420px]">
          <div className="mb-8">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-widest uppercase text-yellow-700 mb-3">
              <span className="block w-4 h-px bg-yellow-400" />
              Admin signup
            </span>
            <h1 className="text-[28px] sm:text-[32px] font-extrabold text-slate-900 dark:text-white leading-tight">
              Create admin account
            </h1>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              Use your email and password to create admin credentials for dashboard access.
            </p>
          </div>

          {success ? (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-7 text-center dark:bg-green-500/10 dark:border-green-500/30">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-[17px] font-extrabold text-green-800 dark:text-green-400 mb-1.5">Account created!</h3>
              <p className="text-[13px] text-green-600 dark:text-green-300">Redirecting to login...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <Field
                label="Full name"
                placeholder="Admin full name"
                icon={User}
                value={form.fullName}
                onChange={setField("fullName")}
                error={errors.fullName}
              />

              <Field
                label="Email address"
                type="email"
                placeholder="admin@example.com"
                icon={Mail}
                value={form.email}
                onChange={setField("email")}
                error={errors.email}
              />

              <Field
                label="Password"
                type={showPass ? "text" : "password"}
                placeholder="At least 6 characters"
                icon={Lock}
                value={form.password}
                onChange={setField("password")}
                error={errors.password}
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowPass((prev) => !prev)}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={showPass ? "Hide password" : "Show password"}
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />

              <Field
                label="Confirm password"
                type={showConfirm ? "text" : "password"}
                placeholder="Repeat password"
                icon={Lock}
                value={form.confirmPassword}
                onChange={setField("confirmPassword")}
                error={errors.confirmPassword}
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowConfirm((prev) => !prev)}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />

              {serverError && (
                <p className="flex items-center gap-1.5 text-[12px] text-red-500 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {serverError}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 disabled:opacity-60 font-bold text-[14px] rounded-xl shadow-sm transition-all active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)', color: '#FFFFFF', boxShadow: '0 10px 30px rgba(37,99,235,0.16)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'linear-gradient(135deg, #1D4ED8 0%, #1E3A8A 100%)'}
                onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)'}
              >
                {loading ? <Spinner /> : <><span>Create admin</span><ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          )}

          {!success && (
            <p className="text-center text-[13px] text-slate-500 dark:text-slate-400 mt-8">
              Already have credentials?{" "}
              <Link to="/login" className="font-bold text-yellow-700 hover:text-yellow-900 transition-colors">
                Sign in →
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
