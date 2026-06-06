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
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

// ── Case Notes ─────────────────────────────────────────────────
export const getCaseNotes = (caseId) =>
  request(`/api/cases/${caseId}/notes`);

export const addCaseNote = (caseId, payload) =>
  request(`/api/cases/${caseId}/notes`, {
    method: "POST",
    body: JSON.stringify(payload), // { comment?, status? }
  });

// ── Case Assignments ───────────────────────────────────────────
export const assignCase = (caseId, userId) =>
  request(`/api/admin/assignments/${caseId}`, {
    method: "POST",
    body: JSON.stringify({ userId }),
  });

export const getCaseAssignment = (caseId) =>
  request(`/api/admin/assignments/${caseId}`);

export const updateCasePriority = (caseId, priority) =>
  request(`/api/admin/assignments/priority/${caseId}`, {
    method: "PATCH",
    body: JSON.stringify({ priority }),
  });
