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

export const getInstitutionStats = () => request("/institution/stats");
export const getInstitutionStaff = () => request("/institution/staff");
export const getInstitutionCases = (params = {}) => {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v && v !== "All")
  ).toString();
  return request(`/institution/cases${qs ? `?${qs}` : ""}`);
};
export const getInstitutionMonthly = () => request("/institution/monthly");
export const getInstitutionLogs    = () => request("/institution/logs");
