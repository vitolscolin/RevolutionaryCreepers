const API_TOKEN = "dev-token";

async function request(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-trialtwin-token": API_TOKEN,
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || "Request failed");
  }

  return response.json();
}

export function fetchPatients() {
  return request("/patients");
}

export function fetchTwin(patientId) {
  return request(`/twin/${patientId}`);
}

export function simulatePatient(payload) {
  return request("/simulate", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function fetchDemoProfiles() {
  return fetch("/api/demo-profiles").then((response) => response.json());
}
