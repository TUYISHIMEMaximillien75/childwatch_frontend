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

export const getInstitutionStats = () => request("/api/institution/stats");
export const getInstitutionStaff = () => request("/api/institution/staff");
export const getInstitutionCases = (params = {}) => {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v && v !== "All")
  ).toString();
  return request(`/api/institution/cases${qs ? `?${qs}` : ""}`);
};
export const getInstitutionMonthly = () => request("/api/institution/monthly");
export const getInstitutionLogs    = () => request("/api/institution/logs");
