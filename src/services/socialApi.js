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

// ── Cases ──────────────────────────────────────────────────────
export const getSocialCases = (params = {}) => {
  const entries = Object.entries(params).filter(([, v]) => v);
  const qs = new URLSearchParams(entries).toString();
  return request(`/social/cases${qs ? `?${qs}` : ""}`);
};

export const getSocialCaseDetail = (caseId) =>
  request(`/social/cases/${caseId}`);

export const getSocialStats = () => request("/social/stats");

// ── Status update ──────────────────────────────────────────────
export const updateSocialCaseStatus = (id, status) =>
  request(`/social/cases/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

// ── Case Notes / Visit logs ────────────────────────────────────
export const getSocialCaseNotes = (caseId) =>
  request(`/social/cases/${caseId}/notes`);

export const addSocialCaseNote = (caseId, payload) =>
  request(`/social/cases/${caseId}/notes`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

// ── Assessments ───────────────────────────────────────────────
export const getSocialAssessment = (caseId) =>
  request(`/social/cases/${caseId}/assessment`);

export const submitSocialAssessment = (caseId, payload) =>
  request(`/social/cases/${caseId}/assessment`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

// ── Referrals ─────────────────────────────────────────────────
export const submitSocialReferral = (caseId, payload) =>
  request(`/social/cases/${caseId}/referral`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

// ── Alerts ────────────────────────────────────────────────────
export const getSocialAlerts = () => request("/social/alerts");

export const markSocialAlertRead = (id) =>
  request(`/social/alerts/${id}/read`, { method: "PATCH" });
