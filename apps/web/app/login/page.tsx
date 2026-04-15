"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";

import api from "@/lib/api";
import { useAuthStore, type AuthUser } from "@/lib/store";

const phoneRegex = /^[6-9]\d{9}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type AuthMode = "login" | "register" | "verify";

type OtpContext = {
  identifier: string;
  displayText: string;
  isRegistration: boolean;
  returnMode: "login" | "register";
  resendPayload?: { phone?: string; email?: string };
  registrationPayload?: {
    name: string;
    phone: string;
    email: string;
  };
};

function getApiError(e: unknown, fallback: string): string {
  if (
    e &&
    typeof e === "object" &&
    "response" in e &&
    e.response &&
    typeof e.response === "object" &&
    "data" in e.response &&
    e.response.data &&
    typeof e.response.data === "object" &&
    "error" in e.response.data
  ) {
    return String((e.response.data as { error?: string }).error ?? fallback);
  }
  return fallback;
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useAuthStore((state) => state.setUser);
  const { user, isLoggedIn, token } = useAuthStore();
  const redirectTarget = searchParams.get("redirect");

  const [mode, setMode] = useState<AuthMode>("login");
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [otpContext, setOtpContext] = useState<OtpContext | null>(null);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (isLoggedIn && token) {
      if (user?.role === "astrologer") {
        router.replace("/astrologer/dashboard");
        return;
      }
      router.replace("/dashboard");
    }
  }, [isLoggedIn, router, token, user?.role]);

  useEffect(() => {
    if (mode !== "verify" || cooldown <= 0) {
      return;
    }
    const timer = window.setInterval(() => {
      setCooldown((previous) => (previous > 0 ? previous - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [mode, cooldown]);

  const startVerifyMode = (context: OtpContext) => {
    setOtpContext(context);
    setOtp(["", "", "", "", "", ""]);
    setCooldown(30);
    setMode("verify");
    requestAnimationFrame(() => {
      inputsRef.current[0]?.focus();
    });
  };

  const normalizeLoginIdentifier = (value: string) => {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return { error: "Enter phone number or email" } as const;
    }

    const digitsOnly = trimmedValue.replace(/\D/g, "");
    if (digitsOnly.length === 10 && phoneRegex.test(digitsOnly)) {
      return { payload: { phone: digitsOnly }, displayText: `+91 ${digitsOnly}`, identifier: digitsOnly } as const;
    }

    const normalizedEmail = trimmedValue.toLowerCase();
    if (emailRegex.test(normalizedEmail)) {
      return { payload: { email: normalizedEmail }, displayText: normalizedEmail, identifier: normalizedEmail } as const;
    }

    return { error: "Enter a valid Indian phone number or email" } as const;
  };

  const submitLogin = async () => {
    setError(null);
    const normalized = normalizeLoginIdentifier(loginIdentifier);
    if ("error" in normalized) {
      setError(normalized.error);
      return;
    }

    setLoading(true);
    try {
      await api.post("/api/auth/send-otp", normalized.payload);
      startVerifyMode({
        identifier: normalized.identifier,
        displayText: normalized.displayText,
        isRegistration: false,
        returnMode: "login",
        resendPayload: normalized.payload,
      });
    } catch (e: unknown) {
      setError(getApiError(e, "Could not send OTP"));
    } finally {
      setLoading(false);
    }
  };

  const submitRegister = async () => {
    setError(null);
    const cleanedName = registerName.trim();
    const cleanedPhone = registerPhone.replace(/\D/g, "").slice(0, 10);
    const cleanedEmail = registerEmail.trim().toLowerCase();

    if (cleanedName.length < 2) {
      setError("Enter your full name");
      return;
    }
    if (!phoneRegex.test(cleanedPhone)) {
      setError("Enter a valid 10-digit Indian mobile number");
      return;
    }
    if (!emailRegex.test(cleanedEmail)) {
      setError("Enter a valid email address");
      return;
    }

    const payload = {
      name: cleanedName,
      phone: cleanedPhone,
      email: cleanedEmail,
    };

    setLoading(true);
    try {
      await api.post("/api/auth/register", payload);
      startVerifyMode({
        identifier: payload.phone,
        displayText: `+91 ${payload.phone} and ${payload.email}`,
        isRegistration: true,
        returnMode: "register",
        registrationPayload: payload,
      });
    } catch (e: unknown) {
      setError(getApiError(e, "Could not send OTP"));
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (!otpContext || cooldown > 0) {
      return;
    }
    setError(null);
    setLoading(true);
    try {
      if (otpContext.isRegistration) {
        if (!otpContext.registrationPayload) {
          throw new Error("Registration context missing");
        }
        await api.post("/api/auth/register", otpContext.registrationPayload);
      } else {
        if (!otpContext.resendPayload) {
          throw new Error("Resend payload missing");
        }
        await api.post("/api/auth/send-otp", otpContext.resendPayload);
      }
      setCooldown(30);
    } catch (e: unknown) {
      setError(getApiError(e, "Could not resend OTP"));
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = useCallback(async () => {
    if (!otpContext) {
      return;
    }

    const code = otp.join("");
    if (code.length !== 6) {
      setError("Enter the 6-digit OTP");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const response = await api.post("/api/auth/verify-otp", {
        identifier: otpContext.identifier,
        otp: code,
        isRegistration: otpContext.isRegistration,
      });

      const data = response.data?.data as { token: string; user: AuthUser };
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
      setError(getApiError(e, "Verification failed"));
    } finally {
      setLoading(false);
    }
  }, [otp, otpContext, redirectTarget, router, setUser]);

  const setDigit = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    setOtp((previous) => {
      const next = [...previous];
      next[index] = digit;
      return next;
    });

    if (digit && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const onOtpKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const onOtpPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) {
      return;
    }
    const filled = ["", "", "", "", "", ""];
    pasted.split("").forEach((char, index) => {
      filled[index] = char;
    });
    setOtp(filled);
    inputsRef.current[Math.min(pasted.length, 5)]?.focus();
  };

  const switchMode = (targetMode: "login" | "register") => {
    setMode(targetMode);
    setError(null);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-100 via-purple-50 to-indigo-100 px-4 py-8">
      <div className="w-full max-w-md rounded-3xl border border-violet-100 bg-white/95 p-6 shadow-xl shadow-violet-200/60 backdrop-blur">
        {mode === "login" ? (
          <>
            <h1 className="text-center text-2xl font-bold text-slate-900">Welcome to DivineMarg</h1>
            <p className="mt-2 text-center text-sm text-slate-600">
              Login with phone (+91) or email.
            </p>
            <input
              type="text"
              value={loginIdentifier}
              onChange={(event) => setLoginIdentifier(event.target.value)}
              placeholder="+91 phone or you@example.com"
              className="mt-5 w-full rounded-xl border border-violet-200 px-4 py-3 text-slate-900 outline-none ring-violet-500 focus:border-violet-500 focus:ring-2"
            />
            <button
              type="button"
              onClick={() => void submitLogin()}
              disabled={loading}
              className="mt-4 w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
            <div className="my-5 h-px bg-violet-100" />
            <p className="text-center text-sm text-slate-600">
              New here?{" "}
              <button
                type="button"
                onClick={() => switchMode("register")}
                className="font-semibold text-violet-700 hover:underline"
              >
                Create Account
              </button>
            </p>
          </>
        ) : null}

        {mode === "register" ? (
          <>
            <h1 className="text-center text-2xl font-bold text-slate-900">Create Account</h1>
            <div className="mt-5 space-y-3">
              <input
                type="text"
                value={registerName}
                onChange={(event) => setRegisterName(event.target.value)}
                placeholder="Full Name"
                autoComplete="name"
                className="w-full rounded-xl border border-violet-200 px-4 py-3 text-slate-900 outline-none ring-violet-500 focus:border-violet-500 focus:ring-2"
              />
              <div className="flex items-center rounded-xl border border-violet-200 focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500">
                <span className="border-r border-violet-200 px-3 text-sm font-medium text-slate-700">🇮🇳 +91</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={registerPhone}
                  onChange={(event) =>
                    setRegisterPhone(event.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                  placeholder="Phone Number"
                  autoComplete="tel-national"
                  className="w-full rounded-r-xl px-4 py-3 text-slate-900 outline-none"
                />
              </div>
              <input
                type="email"
                value={registerEmail}
                onChange={(event) => setRegisterEmail(event.target.value)}
                placeholder="Email"
                autoComplete="email"
                className="w-full rounded-xl border border-violet-200 px-4 py-3 text-slate-900 outline-none ring-violet-500 focus:border-violet-500 focus:ring-2"
              />
            </div>
            <button
              type="button"
              onClick={() => void submitRegister()}
              disabled={loading}
              className="mt-4 w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
            >
              {loading ? "Sending..." : "Send OTP & Register"}
            </button>
            <p className="mt-5 text-center text-sm text-slate-600">
              Already have account?{" "}
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="font-semibold text-violet-700 hover:underline"
              >
                Sign In
              </button>
            </p>
          </>
        ) : null}

        {mode === "verify" ? (
          <>
            <h1 className="text-center text-2xl font-bold text-slate-900">Enter OTP</h1>
            <p className="mt-2 text-center text-sm text-slate-600">
              OTP sent to <span className="font-semibold text-slate-900">{otpContext?.displayText}</span>
            </p>
            <div className="mt-5 flex justify-between gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(element) => {
                    inputsRef.current[index] = element;
                  }}
                  inputMode="numeric"
                  maxLength={1}
                  autoComplete="one-time-code"
                  value={digit}
                  onChange={(event) => setDigit(index, event.target.value)}
                  onKeyDown={(event) => onOtpKeyDown(index, event)}
                  onPaste={index === 0 ? onOtpPaste : undefined}
                  className="h-12 w-12 rounded-xl border border-violet-200 text-center text-lg font-semibold text-slate-900 outline-none ring-violet-500 focus:border-violet-500 focus:ring-2"
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => void verifyOtp()}
              disabled={loading || otp.some((value) => value === "")}
              className="mt-4 w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
            >
              {loading ? "Verifying..." : "Verify"}
            </button>
            <button
              type="button"
              onClick={() => void resendOtp()}
              disabled={loading || cooldown > 0}
              className="mt-3 w-full rounded-xl border border-violet-200 py-3 text-sm font-semibold text-violet-700 transition hover:bg-violet-50 disabled:opacity-60"
            >
              {cooldown > 0 ? `Resend OTP in ${cooldown}s` : "Resend OTP"}
            </button>
            <button
              type="button"
              onClick={() => switchMode(otpContext?.returnMode ?? "login")}
              className="mt-3 w-full text-sm font-medium text-violet-700 hover:underline"
            >
              Change number/email
            </button>
          </>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        <p className="mt-6 text-center text-xs text-slate-500">
          <Link href="/" className="text-violet-700 hover:underline">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-purple-600" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

