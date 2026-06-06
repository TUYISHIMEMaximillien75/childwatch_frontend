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

export const getSocialCases = (params = {}) => {
  const entries = Object.entries(params).filter(([, v]) => v);
  const qs = new URLSearchParams(entries).toString();
  return request(`/api/social/cases${qs ? `?${qs}` : ""}`);
};

export const getSocialStats = () => request("/api/social/stats");
