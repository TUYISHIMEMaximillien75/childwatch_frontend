import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ShieldCheck, ArrowRight } from "lucide-react";
import { requestPasswordReset } from "../services/authApi";

export default function ForgotPassword() {
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!identifier.trim()) {
      setError("Please enter your email or phone number.");
      return;
    }

    try {
      setLoading(true);
      await requestPasswordReset({ identifier: identifier.trim() });
      setSuccess(true);
    } catch (err) {
      setError(err.message || "An error occurred while requesting the reset link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-yellow-100 dark:bg-yellow-900/30 mb-4 shadow-sm border border-yellow-200 dark:border-yellow-800/50">
            <ShieldCheck className="w-7 h-7 text-yellow-600 dark:text-yellow-400" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Forgot Password?</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            No worries! Enter your email or phone number and we'll send you a link to reset your password.
          </p>
        </div>

        {success ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">Check your email</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              If an account exists for <span className="font-semibold text-slate-700 dark:text-slate-300">{identifier}</span>, an email has been sent with instructions to reset your password.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm font-bold transition-all"
            >
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email or Phone</label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. you@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-[13px] outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-50 dark:focus:ring-yellow-900/20 transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <p className="text-[12px] font-medium text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-yellow-500 hover:bg-yellow-600 text-white text-[13px] font-bold shadow-md shadow-yellow-500/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? "Sending link..." : "Send Reset Link"}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        )}

        <p className="text-center text-[13px] text-slate-500 dark:text-slate-400 mt-8">
          Remembered your password?{" "}
          <Link to="/login" className="font-bold text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}
