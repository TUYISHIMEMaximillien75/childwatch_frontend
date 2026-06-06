import { useState } from "react";
import { Link } from "react-router-dom";
import { KeyRound, Lock, Mail, ShieldCheck } from "lucide-react";
import { requestPasswordReset, resetPassword } from "../services/authApi";

export default function ForgotPassword() {
  const [identifier, setIdentifier] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loadingRequest, setLoadingRequest] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [requestError, setRequestError] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");

  const handleRequestReset = async (event) => {
    event.preventDefault();
    setRequestError("");
    setRequestMessage("");
    setResetMessage("");
    setResetError("");

    if (!identifier.trim()) {
      setRequestError("Email or phone is required");
      return;
    }

    try {
      setLoadingRequest(true);
      const response = await requestPasswordReset({ identifier: identifier.trim() });
      setRequestMessage(response.message || "Reset instructions generated.");
      if (response.resetToken) {
        setToken(response.resetToken);
      }
    } catch (error) {
      setRequestError(error.message || "Failed to request password reset");
    } finally {
      setLoadingRequest(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setResetError("");
    setResetMessage("");

    if (!token.trim() || !newPassword || !confirmPassword) {
      setResetError("Token, new password and confirmation are required");
      return;
    }

    if (newPassword.length < 6) {
      setResetError("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError("Passwords do not match");
      return;
    }

    try {
      setLoadingReset(true);
      const response = await resetPassword({ token: token.trim(), newPassword });
      setResetMessage(response.message || "Password has been reset");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setResetError(error.message || "Failed to reset password");
    } finally {
      setLoadingReset(false);
    }
  };

  return (
    <div className="min-h-screen py-10 px-4" style={{ backgroundColor: 'var(--simba-bg-main)' }}>
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3"
            style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)', border: '1.5px solid #BFDBFE' }}
          >
            <ShieldCheck className="w-6 h-6 text-blue-700" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Reset your password</h1>
          <p className="text-sm text-slate-500 mt-1">
            Request a reset token, then set a new password.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <form onSubmit={handleRequestReset} className="bg-white border rounded-2xl p-5 shadow-sm space-y-4" style={{ borderColor: '#E2E8F0' }}>
            <h2 className="text-sm font-extrabold text-slate-800">1. Request reset token</h2>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Email or phone</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder="you@example.com or +250..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50"
              />
            </div>
            <button
              type="submit"
              disabled={loadingRequest}
              className="w-full py-2.5 rounded-xl disabled:opacity-60 text-sm font-bold transition-all"
              style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)', color: '#FFFFFF', boxShadow: '0 8px 24px rgba(37,99,235,0.16)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'linear-gradient(135deg, #1D4ED8 0%, #1E3A8A 100%)'}
              onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)'}
            >
              {loadingRequest ? "Requesting..." : "Request token"}
            </button>
            {requestMessage && <p className="text-xs text-green-700">{requestMessage}</p>}
            {requestError && <p className="text-xs text-red-600">{requestError}</p>}
          </form>

          <form onSubmit={handleResetPassword} className="bg-white border rounded-2xl p-5 shadow-sm space-y-4" style={{ borderColor: '#E2E8F0' }}>
            <h2 className="text-sm font-extrabold text-slate-800">2. Set new password</h2>

            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Reset token</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={token}
                onChange={(event) => setToken(event.target.value)}
                placeholder="Paste token"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50"
              />
            </div>

            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">New password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="At least 6 characters"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50"
              />
            </div>

            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Confirm password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Repeat new password"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50"
              />
            </div>

            <button
              type="submit"
              disabled={loadingReset}
              className="w-full py-2.5 rounded-xl disabled:opacity-60 text-white text-sm font-bold transition-all"
              style={{ background: '#DC2626' }}
              onMouseEnter={e => e.currentTarget.style.background = '#B91C1C'}
              onMouseLeave={e => e.currentTarget.style.background = '#DC2626'}
            >
              {loadingReset ? "Saving..." : "Reset password"}
            </button>
            {resetMessage && <p className="text-xs text-green-700">{resetMessage}</p>}
            {resetError && <p className="text-xs text-red-600">{resetError}</p>}
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Remembered your password?{" "}
          <Link to="/login" className="font-bold text-yellow-700 hover:text-yellow-900">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
