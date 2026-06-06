import { getAuthToken } from "../utils/authStorage";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

async function request(path, options = {}) {
  const token = getAuthToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

async function upload(path, formData) {
  const token = getAuthToken();
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Upload failed");
  return data;
}

// ── Cases ──────────────────────────────────────────────────────────
export const getHealthCases  = (params = {}) => {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
  return request(`/api/health/cases${qs ? `?${qs}` : ""}`);
};
export const getHealthCaseDetail = (caseId) => request(`/api/health/cases/${caseId}`);
export const getHealthStats       = ()       => request("/api/health/stats");
export const getHealthReport      = ()       => request("/api/health/stats/report").then(d => d.report || d);

// ── Status update ──────────────────────────────────────────────────
export const updateHealthCaseStatus = (caseId, status) =>
  request(`/api/health/cases/${caseId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

// ── Case Notes ────────────────────────────────────────────────────
export const getHealthCaseNotes = (caseId) => request(`/api/health/cases/${caseId}/notes`);
export const addHealthCaseNote  = (caseId, payload) =>
  request(`/api/health/cases/${caseId}/notes`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

// ── Assessments ───────────────────────────────────────────────────
export const getHealthAssessments = (caseId) => request(`/api/health/cases/${caseId}/assessments`);
export const createHealthAssessment = (caseId, payload) =>
  request(`/api/health/cases/${caseId}/assessments`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
export const updateHealthAssessment = (caseId, assessmentId, payload) =>
  request(`/api/health/cases/${caseId}/assessments/${assessmentId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

// ── Attachments ───────────────────────────────────────────────────
export const getHealthAttachments = (caseId) => request(`/api/health/cases/${caseId}/attachments`);
export const uploadHealthFile = (caseId, file) => {
  const fd = new FormData();
  fd.append("file", file);
  return upload(`/api/health/cases/${caseId}/upload`, fd);
};
