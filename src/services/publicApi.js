const BASE_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/public` : "http://localhost:5000/api/public";

export async function fetchPublicStats() {
  const res = await fetch(`${BASE_URL}/stats`);
  if (!res.ok) throw new Error("Failed to fetch public stats");
  return res.json();
}

export async function fetchPublicReports() {
  const res = await fetch(`${BASE_URL}/reports`);
  if (!res.ok) throw new Error("Failed to fetch public reports");
  return res.json();
}

export async function fetchDistrictStats() {
  const res = await fetch(`${BASE_URL}/district-stats`);
  if (!res.ok) throw new Error("Failed to fetch district stats");
  return res.json();
}
