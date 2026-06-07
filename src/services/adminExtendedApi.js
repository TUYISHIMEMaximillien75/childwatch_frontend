import { getAuthToken } from "../utils/authStorage";

const API = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/admin` : "http://localhost:5000/api/admin";
const UPLOAD_API = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/uploads` : "http://localhost:5000/api/uploads";

function authHeaders() {
  return { Authorization: `Bearer ${getAuthToken()}` };
}

// GET /api/admin/stats
export async function fetchAdminStats() {
  const res = await fetch(`${API}/stats`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch admin stats");
  return res.json();
}

// GET /api/admin/analytics
export async function fetchAdminAnalytics() {
  const res = await fetch(`${API}/analytics`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch analytics");
  return res.json();
}

// GET /api/admin/alerts
export async function fetchAdminAlerts() {
  const res = await fetch(`${API}/alerts`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch alerts");
  return res.json();
}

// GET /api/admin/institutions
export async function fetchAdminInstitutions() {
  const res = await fetch(`${API}/institutions`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch institutions");
  return res.json();
}

// GET /api/admin/institutions/:id
export async function fetchAdminInstitutionById(id) {
  const res = await fetch(`${API}/institutions/${id}`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch institution");
  return res.json();
}

// POST /api/admin/institutions
export async function createAdminInstitution(data) {
  const res = await fetch(`${API}/institutions`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || "Failed to create institution");
  return json;
}

// PUT /api/admin/institutions/:id
export async function updateAdminInstitution(id, data) {
  const res = await fetch(`${API}/institutions/${id}`, {
    method: "PUT",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || "Failed to update institution");
  return json;
}

// DELETE /api/admin/institutions/:id
export async function deleteAdminInstitution(id) {
  const res = await fetch(`${API}/institutions/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || "Failed to delete institution");
  return json;
}

// POST /api/admin/alerts
export async function sendAdminAlert(sentTo, message) {
  const res = await fetch(`${API}/alerts`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ sentTo, message }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to send alert");
  }
  return res.json();
}

// GET /api/uploads/admin — list all evidence files
export async function fetchAdminEvidence() {
  const res = await fetch(`${UPLOAD_API}/admin`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch evidence");
  return res.json();
}

// DELETE /api/uploads/:id
export async function deleteEvidence(id) {
  const res = await fetch(`${UPLOAD_API}/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete evidence");
  return res.json();
}

// GET /api/admin/export — download as CSV
export function buildExportUrl(type, format = "csv", filters = {}) {
  const params = new URLSearchParams({ type, format, ...filters });
  return `${API}/export?${params.toString()}`;
}

export async function downloadExport(type, format = "csv", filters = {}) {
  const token = getAuthToken();
  const params = new URLSearchParams({ type, format, ...filters });
  const res = await fetch(`${API}/export?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Export failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `childwatch_${type}.${format}`;
  a.click();
  URL.revokeObjectURL(url);
}
