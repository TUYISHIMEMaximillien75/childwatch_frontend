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

// GET /notifications
export const getNotifications = () => request("/notifications");

// PATCH /notifications/:id/read
export const markNotificationRead = (id) =>
  request(`/notifications/${id}/read`, { method: "PATCH" });

// PATCH /notifications/read-all
export const markAllNotificationsRead = () =>
  request("/notifications/read-all", { method: "PATCH" });
