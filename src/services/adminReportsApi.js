import { getAuthToken } from "../utils/authStorage";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function request(path, options = {}) {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

export function getAdminReports({ status, q } = {}) {
  const params = new URLSearchParams();
  if (status && status !== "All") params.set("status", status);
  if (q) params.set("q", q);
  const query = params.toString();
  return request(`/admin/reports${query ? `?${query}` : ""}`);
}

export function updateAdminReportStatus(id, status) {
  return request(`/admin/reports/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
