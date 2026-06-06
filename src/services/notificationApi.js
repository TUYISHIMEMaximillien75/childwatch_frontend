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

// GET /api/notifications
export const getNotifications = () => request("/api/notifications");

// PATCH /api/notifications/:id/read
export const markNotificationRead = (id) =>
  request(`/api/notifications/${id}/read`, { method: "PATCH" });

// PATCH /api/notifications/read-all
export const markAllNotificationsRead = () =>
  request("/api/notifications/read-all", { method: "PATCH" });
