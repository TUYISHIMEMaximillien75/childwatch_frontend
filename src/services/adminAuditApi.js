import { getAuthToken } from "../utils/authStorage";

const BASE_URL = "http://localhost:5000/api/admin/audit-logs";

export async function fetchAuditLogs(limit = 100, offset = 0) {
  const token = getAuthToken();
  const res = await fetch(`${BASE_URL}?limit=${limit}&offset=${offset}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch audit logs");
  return res.json();
}
