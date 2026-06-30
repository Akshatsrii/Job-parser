const BASE =
  import.meta.env.VITE_API_URL ||
  "https://job-parser-1.onrender.com/api";

export async function parseJob(input) {
  const response = await fetch(`${BASE}/parse`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ input }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Extraction failed");
  }

  return data.data;
}