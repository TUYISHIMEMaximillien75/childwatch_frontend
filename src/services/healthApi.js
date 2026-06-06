import { getAuthToken } from "../utils/authStorage";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function request(path, options = {}) {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
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
  const res = await fetch(`${API_BASE_URL}${path}`, {
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
  return request(`/health/cases${qs ? `?${qs}` : ""}`);
};
export const getHealthCaseDetail = (caseId) => request(`/health/cases/${caseId}`);
export const getHealthStats       = ()       => request("/health/stats");
export const getHealthReport      = ()       => request("/health/stats/report").then(d => d.report || d);

// ── Status update ──────────────────────────────────────────────────
export const updateHealthCaseStatus = (caseId, status) =>
  request(`/health/cases/${caseId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

// ── Case Notes ────────────────────────────────────────────────────
export const getHealthCaseNotes = (caseId) => request(`/health/cases/${caseId}/notes`);
export const addHealthCaseNote  = (caseId, payload) =>
  request(`/health/cases/${caseId}/notes`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

// ── Assessments ───────────────────────────────────────────────────
export const getHealthAssessments = (caseId) => request(`/health/cases/${caseId}/assessments`);
export const createHealthAssessment = (caseId, payload) =>
  request(`/health/cases/${caseId}/assessments`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
export const updateHealthAssessment = (caseId, assessmentId, payload) =>
  request(`/health/cases/${caseId}/assessments/${assessmentId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

// ── Attachments ───────────────────────────────────────────────────
export const getHealthAttachments = (caseId) => request(`/health/cases/${caseId}/attachments`);
export const uploadHealthFile = (caseId, file) => {
  const fd = new FormData();
  fd.append("file", file);
  return upload(`/health/cases/${caseId}/upload`, fd);
};
