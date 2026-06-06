import { getAuthToken } from "../utils/authStorage";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error ? `${data.message}: ${data.error}` : data.message || "Request failed");
  }

  return data;
}

async function authRequest(path, options = {}) {
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
    throw new Error(data.error ? `${data.message}: ${data.error}` : data.message || "Request failed");
  }

  return data;
}

export function signupAdmin(payload) {
  return request("/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function loginAdmin(payload) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function registerUser(payload) {
  return request("/auth/user-register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function loginUser(payload) {
  return request("/auth/user-login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getMyAccount() {
  return authRequest("/auth/me");
}

/** Update own profile (name, phone, district) */
export function updateProfile(payload) {
  return authRequest("/auth/profile", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

/** Change own password */
export function changePassword(payload) {
  return authRequest("/auth/change-password", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function requestPasswordReset(payload) {
  return request("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function resetPassword(payload) {
  return request("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
