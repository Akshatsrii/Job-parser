const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export async function parseJob(input) {
  const res = await fetch(`${BASE}/parse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Extraction failed');
  return data.data;
}