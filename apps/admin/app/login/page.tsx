"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import api from "@/lib/api";
import { useAdminHydrated } from "@/lib/useAdminHydrated";
import { useAdminStore } from "@/lib/store";

type Form = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const router = useRouter();
  const hydrated = useAdminHydrated();
  const isLoggedIn = useAdminStore((s) => s.isLoggedIn);
  const setAdmin = useAdminStore((s) => s.setAdmin);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<Form>({ defaultValues: { email: "", password: "" } });

  useEffect(() => {
    if (!hydrated) return;
    if (isLoggedIn) {
      router.replace("/dashboard");
    }
  }, [hydrated, isLoggedIn, router]);

  async function onSubmit(data: Form) {
    setError(null);
    try {
      const res = await api.post<{
        success: boolean;
        data?: { token: string; admin: { id: string; email: string; role: string } };
        error?: string;
      }>("/api/admin/login", {
        email: data.email,
        password: data.password,
      });

      if (!res.data.success || !res.data.data) {
        setError(res.data.error ?? "Login failed");
        return;
      }

      setAdmin(res.data.data.admin, res.data.data.token);
      router.push("/dashboard");
    } catch (e: unknown) {
      const msg =
        e &&
        typeof e === "object" &&
        "response" in e &&
        e.response &&
        typeof e.response === "object" &&
        "data" in e.response &&
        e.response.data &&
        typeof e.response.data === "object" &&
        "error" in e.response.data &&
        typeof (e.response.data as { error?: string }).error === "string"
          ? (e.response.data as { error: string }).error
          : "Login failed";
      setError(msg);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">DivineMarg Admin</h1>
        <p className="mt-1 text-sm text-slate-500">Sign in to continue</p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              type="email"
              autoComplete="email"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-500 focus:ring-2"
              {...register("email", { required: true })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              type="password"
              autoComplete="current-password"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-500 focus:ring-2"
              {...register("password", { required: true })}
            />
          </div>

          {error ? (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-indigo-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {isSubmitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
