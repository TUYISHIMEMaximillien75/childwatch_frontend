import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Lock,
  MapPin,
  Moon,
  Shield,
  ShieldAlert,
  Sun,
  Upload,
  User,
} from "lucide-react";
import { createPublicReport, uploadPublicEvidence } from "../services/reporterApi";
import { useTheme } from "../contexts/ThemeContext";

const REPORT_TYPES = ["Missing", "Abuse"];

const DISTRICTS = [
  // Kigali City
  "Gasabo", "Kicukiro", "Nyarugenge",
  // Eastern Province
  "Bugesera", "Gatsibo", "Kayonza", "Kirehe", "Ngoma", "Nyagatare", "Rwamagana",
  // Northern Province
  "Burera", "Gakenke", "Gicumbi", "Musanze", "Rulindo",
  // Southern Province
  "Gisagara", "Huye", "Kamonyi", "Muhanga", "Nyamagabe", "Nyamasheke", "Nyanza", "Ruhango",
  // Western Province
  "Karongi", "Ngororero", "Nyabihu", "Rubavu", "Rutsiro", "Rusizi",
];

export default function PublicReport() {
  const { theme, toggleTheme } = useTheme();
  const [type, setType] = useState("Missing");
  const [anonymous, setAnonymous] = useState(true);
  const [form, setForm] = useState({
    childName: "",
    age: "",
    gender: "",
    location: "",
    district: "",
    description: "",
    reporterContact: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [createdCase, setCreatedCase] = useState(null);
  const [file, setFile] = useState(null);

  const setField = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const resetForm = () => {
    setCreatedCase(null);
    setError("");
    setForm({ childName: "", age: "", gender: "", location: "", district: "", description: "", reporterContact: "" });
    setAnonymous(true);
    setType("Missing");
    setFile(null);
  };

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.childName.trim() || !form.location.trim() || !form.description.trim()) {
      setError("Please provide child name, location, and description.");
      return;
    }
    if (!anonymous && !form.reporterContact.trim()) {
      setError("Reporter contact is required when anonymous reporting is disabled.");
      return;
    }

    try {
      setSubmitting(true);
      const response = await createPublicReport({
        type,
        childName: form.childName.trim(),
        age: form.age ? Number(form.age) : null,
        gender: form.gender.trim() || null,
        location: form.location.trim(),
        district: form.district.trim() || "Unknown",
        description: form.description.trim(),
        anonymous,
        reporterContact: anonymous ? null : form.reporterContact.trim(),
      });
      if (response?.report?.caseId && file) {
        await uploadPublicEvidence(response.report.caseId, file);
      }
      setCreatedCase(response.report || null);
    } catch (submitError) {
      setError(submitError.message || "Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-3 px-3.5 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-yellow-400 dark:focus:border-yellow-500 focus:ring-2 focus:ring-yellow-400/20 transition-all";

  /* ── Success Screen ── */
  if (createdCase) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors duration-300">
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-4 py-3">
          <Link to="/" className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-blue-700">
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
          <button onClick={toggleTheme} className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex flex-1 items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-center shadow-sm sm:p-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Report Submitted!</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Save this Case ID to reference your report in any follow-up communication.
            </p>
            <div className="mt-5 rounded-xl border border-yellow-200 dark:border-yellow-700/50 bg-yellow-50 dark:bg-yellow-900/20 px-4 py-4">
              <p className="text-xs font-bold uppercase tracking-wider text-yellow-700 dark:text-amber-400">Case ID</p>
              <p className="mt-1 font-mono text-2xl font-extrabold text-yellow-800 dark:text-amber-300 break-all">
                {createdCase.caseId}
              </p>
            </div>
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={resetForm}
                className="w-full rounded-xl bg-yellow-500 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-yellow-600 transition-colors active:scale-[0.98]"
              >
                Submit Another Report
              </button>
              <Link
                to="/"
                className="flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Report Form ── */
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors duration-300">

      {/* Sticky mobile top bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-blue-700">
          <ArrowLeft className="h-4 w-4" /> Home
        </Link>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-900 text-white">
              <Shield className="h-3.5 w-3.5" strokeWidth={2.5} />
            </div>
            <span className="text-sm font-extrabold text-blue-950 dark:text-white">Childwatch</span>
          </div>
          <button onClick={toggleTheme} className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Form content */}
      <div className="flex-1 px-4 py-6 sm:py-10">
        <div className="mx-auto w-full max-w-xl">

          {/* Header */}
          <div className="mb-6">
            <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-yellow-200 dark:border-yellow-700/50 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-yellow-700 dark:text-amber-400">
              <ShieldAlert className="h-3.5 w-3.5" />
              Public Tip Line
            </p>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white sm:text-3xl">
              Submit a Child Protection Report
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              No account required. You can submit fully anonymously.
            </p>
          </div>

          {/* Form card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm sm:p-6">
            <form className="space-y-5" onSubmit={handleSubmit}>

              {/* Report Type */}
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Report Type</p>
                <div className="grid grid-cols-2 gap-2">
                  {REPORT_TYPES.map((reportType) => (
                    <button
                      key={reportType}
                      type="button"
                      onClick={() => setType(reportType)}
                      className={`rounded-xl border px-4 py-3.5 text-sm font-bold transition-all active:scale-[0.98] ${
                        type === reportType
                          ? reportType === "Missing"
                            ? "border-yellow-600 bg-yellow-500 text-white shadow-sm"
                            : "border-red-700 bg-red-600 text-white shadow-sm"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                      }`}
                    >
                      {reportType === "Missing" ? "🔍 Missing Child" : "🚨 Child Abuse"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Anonymous toggle */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3.5">
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Submit anonymously</p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">No personal information is saved.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAnonymous((prev) => !prev)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                    anonymous ? "bg-yellow-500" : "bg-slate-300 dark:bg-slate-600"
                  }`}
                  aria-pressed={anonymous}
                >
                  <span
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${
                      anonymous ? "left-6" : "left-1"
                    }`}
                  />
                </button>
              </div>

              {/* Child Name */}
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Child Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    className={`${inputClass} pl-10`}
                    value={form.childName}
                    onChange={setField("childName")}
                    placeholder="Child full name"
                  />
                </div>
              </div>

              {/* Age + Gender */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Age</label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    className={inputClass}
                    value={form.age}
                    onChange={setField("age")}
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Gender</label>
                  <select className={inputClass} value={form.gender} onChange={setField("gender")}>
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Location <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    className={`${inputClass} pl-10`}
                    value={form.location}
                    onChange={setField("location")}
                    placeholder="Last seen location or incident place"
                  />
                </div>
              </div>

              {/* District */}
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">District</label>
                <select className={inputClass} value={form.district} onChange={setField("district")}>
                  <option value="">Select district (optional)</option>
                  {DISTRICTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Reporter Contact (conditional) */}
              {!anonymous && (
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Reporter Contact <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      className={`${inputClass} pl-10`}
                      value={form.reporterContact}
                      onChange={setField("reporterContact")}
                      placeholder="Phone or email for follow-up"
                    />
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={5}
                  className={`${inputClass} resize-none`}
                  value={form.description}
                  onChange={setField("description")}
                  placeholder="Describe what happened, when it occurred, and any useful details..."
                />
              </div>

              {/* File upload */}
              <div>
                <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Upload Photo / Evidence
                </p>
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center transition-colors hover:border-yellow-400 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-yellow-500">
                  <input type="file" className="hidden" onChange={(e) => setFile(e.target.files[0])} accept="image/*,video/*,.pdf" />
                  <Upload className="mb-2 h-7 w-7 text-slate-400" />
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {file ? (
                      <span className="text-yellow-600 dark:text-amber-400 font-bold break-all">{file.name}</span>
                    ) : (
                      "Tap to upload photo or evidence"
                    )}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">JPG, PNG, PDF, MP4 · Max 2 GB</p>
                </label>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-700/50 dark:bg-red-900/20 dark:text-red-400">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-3 pt-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-500 py-4 text-sm font-bold text-white shadow-sm transition-all hover:bg-yellow-600 active:scale-[0.98] disabled:opacity-60"
                >
                  <FileText className="h-4 w-4" />
                  {submitting ? "Submitting..." : "Submit Report"}
                </button>
                <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                  Have an account?{" "}
                  <Link to="/login" className="font-semibold text-yellow-600 hover:underline dark:text-amber-400">
                    Sign in
                  </Link>
                </p>
              </div>
            </form>
          </div>

          {/* Footer note */}
          <p className="mt-4 px-2 text-center text-xs text-slate-400 dark:text-slate-500">
            All reports are reviewed by trained child protection specialists within 24 hours.
          </p>
        </div>
      </div>
    </div>
  );
}
