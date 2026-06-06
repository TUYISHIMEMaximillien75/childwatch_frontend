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

export const getPoliceCases = (params = {}) => {
  const entries = Object.entries(params).filter(([, v]) => v && v !== "All");
  const qs = new URLSearchParams(entries).toString();
  return request(`/police/cases${qs ? `?${qs}` : ""}`);
};

export const getPoliceStats = () => request("/police/stats");

export const updatePoliceCaseStatus = (id, status) =>
  request(`/police/cases/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

export const getPoliceAlerts       = () => request("/police/alerts");
export const getPoliceDistrictStats = () => request("/police/district-stats");

