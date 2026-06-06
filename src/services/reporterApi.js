import { getAuthToken } from "../utils/authStorage";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function request(path, options = {}, requireAuth = true) {
  const token = requireAuth ? getAuthToken() : null;
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };
  
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

export function createPublicReport(payload) {
  return request("/reporter/public-reports", {
    method: "POST",
    body: JSON.stringify(payload),
  }, false);
}

export function getMyReports() {
  return request("/reporter/reports");
}

export function createMyReport(payload) {
  return request("/reporter/reports", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateMyReport(caseId, payload) {
  return request(`/reporter/reports/${encodeURIComponent(caseId)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function trackMyCase(caseId) {
  return request(`/reporter/reports/track/${encodeURIComponent(caseId)}`);
}

export function getMyNotifications() {
  return request("/reporter/notifications");
}

export function markNotificationRead(id) {
  return request(`/reporter/notifications/${id}/read`, {
    method: "PATCH",
  });
}

export function markAllNotificationsRead() {
  return request("/reporter/notifications/read-all", {
    method: "PATCH",
  });
}

export function uploadEvidence(caseId, file) {
  const formData = new FormData();
  formData.append("file", file);
  return request(`/uploads/${encodeURIComponent(caseId)}`, {
    method: "POST",
    body: formData,
  });
}

export function uploadPublicEvidence(caseId, file) {
  const formData = new FormData();
  formData.append("file", file);
  return request(`/public/uploads/${encodeURIComponent(caseId)}`, {
    method: "POST",
    body: formData,
  }, false);
}

