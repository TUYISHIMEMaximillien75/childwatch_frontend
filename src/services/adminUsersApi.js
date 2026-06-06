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

export function getManagedUsers() {
  return request("/admin/users");
}

export function getManagedUserById(id) {
  return request(`/admin/users/${id}`);
}

export function createManagedUser(payload) {
  return request("/admin/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateManagedUser(id, payload) {
  return request(`/admin/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function setManagedUserActive(id, active) {
  return request(`/admin/users/${id}/deactivate`, {
    method: "PATCH",
    body: JSON.stringify({ active }),
  });
}

export function deleteManagedUser(id) {
  return request(`/admin/users/${id}`, {
    method: "DELETE",
  });
}
