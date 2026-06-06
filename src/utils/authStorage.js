const TOKEN_KEY = "childwatch_token";
const PROFILE_KEY = "childwatch_profile";
const ROLE_KEY = "childwatch_role";

export function saveAuthSession(token, profile, role = "user") {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  localStorage.setItem(ROLE_KEY, role);
}

export function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(PROFILE_KEY);
  localStorage.removeItem(ROLE_KEY);
}

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function isAuthenticated() {
  return Boolean(getAuthToken());
}

export function getAuthRole() {
  return localStorage.getItem(ROLE_KEY);
}

export function getAuthProfile() {
  const raw = localStorage.getItem(PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Merge updates into the cached profile without losing other fields */
export function setAuthProfile(updates) {
  const current = getAuthProfile() || {};
  localStorage.setItem(PROFILE_KEY, JSON.stringify({ ...current, ...updates }));
}

// Returns the sub-role from the user profile ("Police", "Hospital", "Social Worker", etc.)
export function getAuthSubRole() {
  const profile = getAuthProfile();
  return profile?.role ?? null;
}

// Returns the correct dashboard path based on account type + sub-role
export function getDashboardRoute() {
  const accountType = getAuthRole(); // "admin" | "user"
  if (accountType === "admin") return "/admin/dashboard";
  const subRole = getAuthSubRole();
  if (subRole === "Police")             return "/police/dashboard";
  if (subRole === "Social Worker")      return "/social/dashboard";
  if (subRole === "Hospital")           return "/health/dashboard";
  if (subRole === "Community Member")   return "/community/dashboard";
  if (subRole === "Institution Admin")  return "/institution/dashboard";
  return "/reporter/dashboard"; // Parent/Reporter or fallback
}
