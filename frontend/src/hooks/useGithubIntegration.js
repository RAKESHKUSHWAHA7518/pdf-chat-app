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
      setStatus({ connected: false, githubUsername: null, avatarUrl: null, loading: false });
      return;
    }
    try {
      const res = await fetch(`${API_URL}/github/status`, {
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
    fetchStatus();
  }, [fetchStatus]);

  const connectWithToken = async (patToken) => {
    setError(null);
    const res = await fetch(`${API_URL}/github/connect-token`, {
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
      method: "POST",
      headers: authHeaders(auth),
    });
    if (res.ok) {
      await fetchStatus();
    }
  };

  const commitReadme = async (markdownContent) => {
    const res = await fetch(`${API_URL}/github/commit-readme`, {
      method: "POST",
      headers: { ...authHeaders(auth), "Content-Type": "application/json" },
      body: JSON.stringify({ markdownContent }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error?.message || "Failed to commit README to GitHub");
    }
    return data;
  };

  return {
    status,
    loading: status.loading,
    connectWithToken,
    disconnect,
    commitReadme,
    refreshStatus: fetchStatus,
    error,
  };
}
