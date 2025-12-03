const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

async function parseResponse(response) {
  const contentType = response.headers.get("content-type");
  const hasJson = contentType && contentType.includes("application/json");
  const data = hasJson ? await response.json() : await response.text();
  if (!response.ok) {
    const detail = typeof data === "string" ? data : data?.detail || JSON.stringify(data);
    throw new Error(detail || "Error al comunicarse con la API");
  }
  return data;
}

export async function apiFetch(endpoint, { method = "GET", body, token, headers = {} } = {}) {
  const config = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${apiUrl}${endpoint}`, config);
  return parseResponse(response);
}

export { apiUrl };