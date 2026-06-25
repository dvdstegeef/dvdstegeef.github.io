(() => {
  "use strict";

  const config = window.DVDSTEGEEF_CONFIG || {};
  const baseUrl = String(config.apiBaseUrl || "").replace(/\/$/, "");
  const TOKEN_KEY = "dvdstegeef_session_token";

  const isConfigured = () => /^https:\/\//i.test(baseUrl);
  const getToken = () => sessionStorage.getItem(TOKEN_KEY) || "";
  const setToken = token => token
    ? sessionStorage.setItem(TOKEN_KEY, token)
    : sessionStorage.removeItem(TOKEN_KEY);

  const request = async (path, options = {}) => {
    if (!isConfigured()) {
      throw new Error("De beveiligde reserveringsservice is nog niet gekoppeld.");
    }

    const headers = new Headers(options.headers || {});
    headers.set("Accept", "application/json");
    if (options.body && !(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers,
      credentials: "omit"
    });

    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json")
      ? await response.json()
      : { message: await response.text() };

    if (!response.ok) {
      const error = new Error(payload.message || `Verzoek mislukt (${response.status}).`);
      error.status = response.status;
      error.payload = payload;
      throw error;
    }

    return payload;
  };

  const availability = ids => request(
    `/public/availability?ids=${encodeURIComponent(ids.join(","))}`
  );

  const createReservation = payload => request("/public/reservations", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  const lookupReservation = payload => request("/public/reservations/lookup", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  const cancelGuestReservation = (code, managementToken) => request(
    `/public/reservations/${encodeURIComponent(code)}/cancel`,
    {
      method: "POST",
      body: JSON.stringify({ managementToken })
    }
  );

  const login = async payload => {
    const result = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    setToken(result.accessToken || "");
    return result;
  };

  const register = async payload => {
    const result = await request("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    setToken(result.accessToken || "");
    return result;
  };

  const logout = () => setToken("");
  const me = () => request("/me");
  const myReservations = () => request("/me/reservations");
  const updateMyReservation = (code, payload) => request(
    `/me/reservations/${encodeURIComponent(code)}`,
    { method: "PATCH", body: JSON.stringify(payload) }
  );
  const cancelMyReservation = code => request(
    `/me/reservations/${encodeURIComponent(code)}/cancel`,
    { method: "POST" }
  );
  const sendContact = payload => request("/public/contact", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  window.DVDAPI = {
    isConfigured,
    getToken,
    setToken,
    request,
    availability,
    createReservation,
    lookupReservation,
    cancelGuestReservation,
    login,
    register,
    logout,
    me,
    myReservations,
    updateMyReservation,
    cancelMyReservation,
    sendContact
  };
})();
