"use client";

import { useCallback, useEffect, useState } from "react";
import { getSession, logout } from "../services/webAuthApi";

type SessionState = {
  loading: boolean;
  authenticated: boolean;
  user: { id: string; email?: string | null } | null;
};

export function useSession() {
  const [state, setState] = useState<SessionState>({
    loading: true,
    authenticated: false,
    user: null,
  });

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const data = await getSession();
      setState({
        loading: false,
        authenticated: data.authenticated,
        user: data.user,
      });
    } catch {
      setState({ loading: false, authenticated: false, user: null });
    }
  }, []);

  const signOut = useCallback(async () => {
    await logout();
    setState({ loading: false, authenticated: false, user: null });
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { ...state, refresh, signOut };
}
