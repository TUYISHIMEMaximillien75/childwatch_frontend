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
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

// ── Case Notes ─────────────────────────────────────────────────
export const getCaseNotes = (caseId) =>
  request(`/cases/${caseId}/notes`);

export const addCaseNote = (caseId, payload) =>
  request(`/cases/${caseId}/notes`, {
    method: "POST",
    body: JSON.stringify(payload), // { comment?, status? }
  });

// ── Case Assignments ───────────────────────────────────────────
export const assignCase = (caseId, userId) =>
  request(`/admin/assignments/${caseId}`, {
    method: "POST",
    body: JSON.stringify({ userId }),
  });

export const getCaseAssignment = (caseId) =>
  request(`/admin/assignments/${caseId}`);

export const updateCasePriority = (caseId, priority) =>
  request(`/admin/assignments/priority/${caseId}`, {
    method: "PATCH",
    body: JSON.stringify({ priority }),
  });
