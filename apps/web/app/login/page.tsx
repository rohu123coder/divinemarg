"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";

import { Navbar } from "@/components/Navbar";
import api from "@/lib/api";
import { useAuthStore, type AuthUser } from "@/lib/store";

const phoneRegex = /^[6-9]\d{9}$/;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useAuthStore((s) => s.setUser);
  const { user, isLoggedIn, token } = useAuthStore();
  const [step, setStep] = useState<1 | 2>(1);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const redirectTarget = searchParams.get("redirect");

  useEffect(() => {
    if (isLoggedIn && token && user?.role === "astrologer") {
      router.replace("/astrologer/dashboard");
    }
  }, [isLoggedIn, token, user?.role, router]);

  const sendOtp = async () => {
    setError(null);
    if (!phoneRegex.test(phone)) {
      setError("Enter a valid 10-digit Indian mobile number");
      return;
    }
    setLoading(true);
    try {
      await api.post(`/api/auth/send-otp`, { phone });
      setStep(2);
      setOtp(["", "", "", "", "", ""]);
      requestAnimationFrame(() => {
        inputsRef.current[0]?.focus();
      });
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
        "error" in e.response.data
          ? String((e.response.data as { error?: string }).error)
          : "Could not send OTP";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = useCallback(async () => {
    const code = otp.join("");
    if (code.length !== 6) {
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await api.post(`/api/auth/verify-otp`, { phone, otp: code });
      const data = res.data?.data as { token: string; user: AuthUser };
      if (!data?.token || !data.user) {
        throw new Error("Invalid response");
      }
      setUser({ ...data.user, role: "user" }, data.token);
      const safeRedirect =
        redirectTarget &&
        redirectTarget.startsWith("/") &&
        !redirectTarget.startsWith("//")
          ? redirectTarget
          : "/dashboard";
      router.replace(safeRedirect);
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
        "error" in e.response.data
          ? String((e.response.data as { error?: string }).error)
          : "Verification failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [otp, phone, redirectTarget, router, setUser]);

  const setDigit = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    setOtp((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    if (digit && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const onOtpKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const onOtpPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) {
      return;
    }
    const arr = text.split("");
    const next = ["", "", "", "", "", ""];
    arr.forEach((c, i) => {
      if (i < 6) {
        next[i] = c;
      }
    });
    setOtp(next);
    const focusIdx = Math.min(arr.length, 5);
    inputsRef.current[focusIdx]?.focus();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white">
      <Navbar />
      <div className="mx-auto flex max-w-md flex-col px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
        <p className="mt-2 text-sm text-slate-600">
          Sign in with your mobile number to continue.
        </p>

        {step === 1 ? (
          <div className="mt-8 space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Mobile number
            </label>
            <div className="flex rounded-xl border border-slate-200 bg-white shadow-sm focus-within:ring-2 focus-within:ring-violet-500">
              <span className="flex items-center border-r border-slate-200 px-3 text-lg">
                🇮🇳 +91
              </span>
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                maxLength={10}
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                }
                className="w-full rounded-r-xl px-3 py-3 text-slate-900 outline-none"
                placeholder="9876543210"
              />
            </div>
            {error ? (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            ) : null}
            <button
              type="button"
              disabled={loading}
              onClick={() => void sendOtp()}
              className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-orange-500 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95 disabled:opacity-60"
            >
              {loading ? "Sending…" : "Send OTP"}
            </button>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            <button
              type="button"
              className="text-sm font-medium text-violet-600 hover:underline"
              onClick={() => {
                setStep(1);
                setError(null);
                setOtp(["", "", "", "", "", ""]);
              }}
            >
              ← Change number
            </button>
            <p className="text-sm text-slate-600">
              Enter the 6-digit code sent to{" "}
              <span className="font-semibold text-slate-900">+91 {phone}</span>
            </p>
            <div className="flex justify-between gap-2">
              {otp.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    inputsRef.current[i] = el;
                  }}
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => setDigit(i, e.target.value)}
                  onKeyDown={(e) => onOtpKeyDown(i, e)}
                  onPaste={i === 0 ? onOtpPaste : undefined}
                  className="h-12 w-full rounded-lg border border-slate-200 text-center text-lg font-semibold text-slate-900 outline-none ring-violet-500 focus:border-violet-500 focus:ring-2"
                  autoComplete="one-time-code"
                />
              ))}
            </div>
            {error ? (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            ) : null}
            <button
              type="button"
              disabled={loading || otp.some((x) => x === "")}
              onClick={() => void verifyOtp()}
              className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-orange-500 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95 disabled:opacity-60"
            >
              {loading ? "Verifying…" : "Verify & continue"}
            </button>
          </div>
        )}

        <p className="mt-10 text-center text-sm text-slate-500">
          <Link href="/" className="text-violet-600 hover:underline">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
