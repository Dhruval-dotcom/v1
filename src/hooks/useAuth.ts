"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface User {
  id: string;
  name: string;
  email: string;
  role: "super_admin" | "admin";
  batchId?: string;
  batchName?: string;
}

interface AuthResponse {
  user?: User;
  error?: string;
}

export function useAuth() {
  const { data, error, isLoading, mutate } = useSWR<AuthResponse>(
    "/api/auth/me",
    fetcher,
    {
      onErrorRetry: (_err, _key, _config, revalidate, { retryCount }) => {
        if (retryCount >= 1) return;
        setTimeout(() => revalidate({ retryCount }), 3000);
      },
    }
  );

  return {
    user: data?.user ?? null,
    isLoading,
    isError: !!error,
    mutate,
  };
}
