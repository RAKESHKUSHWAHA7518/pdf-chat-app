// src/hooks/useGithubIntegration.js — React hook managing GitHub connection status and Octokit actions.
import { useState, useEffect, useCallback } from "react";
import { API_URL, authHeaders } from "../api";

export function useGithubIntegration(auth) {
  const [status, setStatus] = useState({
    connected: false,
    githubUsername: null,
    avatarUrl: null,
    loading: true,
  });
  const [error, setError] = useState(null);

  const fetchStatus = useCallback(async () => {
    if (!auth?.token) {
      return;
    }
    try {
      const res = await fetch(`${API_URL}/github/status`, {
        credentials: "include",
        headers: authHeaders(auth),
      });
      if (res.ok) {
        const data = await res.json();
        setStatus({ ...data, loading: false });
      } else {
        setStatus({ connected: false, githubUsername: null, avatarUrl: null, loading: false });
      }
    } catch {
      setStatus({ connected: false, githubUsername: null, avatarUrl: null, loading: false });
    }
  }, [auth]);

  useEffect(() => {
    if (!auth?.token) return;
    const controller = new AbortController();
    fetch(API_URL + "/github/status", { headers: authHeaders(auth), credentials: "include", signal: controller.signal })
      .then(response => response.ok ? response.json() : { connected: false })
      .then(data => setStatus({ ...data, loading: false }))
      .catch(error => { if (error.name !== "AbortError") setStatus({ connected: false, loading: false }); });
    return () => controller.abort();
  }, [auth]);

  const connectWithToken = async (patToken) => {
    setError(null);
    const res = await fetch(`${API_URL}/github/connect-token`, {
        credentials: "include",
      method: "POST",
      headers: { ...authHeaders(auth), "Content-Type": "application/json" },
      body: JSON.stringify({ token: patToken }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error?.message || "Failed to link GitHub token");
    }
    await fetchStatus();
    return data;
  };

  const disconnect = async () => {
    setError(null);
    const res = await fetch(`${API_URL}/github/disconnect`, {
        credentials: "include",
      method: "POST",
      headers: authHeaders(auth),
    });
    if (res.ok) {
      await fetchStatus();
    }
  };


  return {
    status: auth?.token ? status : { connected: false, loading: false },
    loading: Boolean(auth?.token) && status.loading,
    connectWithToken,
    disconnect,
    refreshStatus: fetchStatus,
    error,
  };
}
