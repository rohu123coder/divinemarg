"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
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
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type AuthMode = "register" | "login" | "verify-otp";
type OtpChannel = "phone" | "email";

type OtpContext = {
  identifier: string;
  displayText: string;
  isRegistration: boolean;
  resendPayload?: { phone?: string; email?: string };
  registrationPayload?: {
    name: string;
    phone: string;
    email: string;
    password?: string;
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
  const setUser = useAuthStore((s) => s.setUser);
  const { user, isLoggedIn, token } = useAuthStore();
  const [mode, setMode] = useState<AuthMode>(
    searchParams.get("tab") === "register" ? "register" : "login"
  );
  const [registerName, setRegisterName] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPhone, setLoginPhone] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [activeLoginTab, setActiveLoginTab] = useState<OtpChannel>("phone");
  const [otpContext, setOtpContext] = useState<OtpContext | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const redirectTarget = searchParams.get("redirect");

  useEffect(() => {
    if (isLoggedIn && token) {
      if (user?.role === "astrologer") {
        router.replace("/astrologer/dashboard");
        return;
      }
      router.replace("/dashboard");
    }
  }, [isLoggedIn, token, user?.role, router, user]);

  useEffect(() => {
    if (mode !== "verify-otp" || cooldown <= 0) {
      return;
    }
    const timer = window.setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldown, mode]);

  const startOtpMode = (ctx: OtpContext) => {
    setOtpContext(ctx);
    setOtp(["", "", "", "", "", ""]);
    setMode("verify-otp");
    setCooldown(30);
    requestAnimationFrame(() => {
      inputsRef.current[0]?.focus();
    });
  };

  const sendLoginOtp = async (payload: { phone?: string; email?: string }) => {
    setError(null);
    setLoading(true);
    try {
      await api.post("/api/auth/send-otp", payload);
      const identifier = payload.phone ?? payload.email ?? "";
      const displayText = payload.phone ? `+91 ${payload.phone}` : identifier;
      startOtpMode({
        identifier,
        displayText,
        isRegistration: false,
        resendPayload: payload,
      });
    } catch (e: unknown) {
      setError(getApiError(e, "Could not send OTP"));
    } finally {
      setLoading(false);
    }
  };

  const submitRegister = async () => {
    setError(null);
    if (registerName.trim().length < 2) {
      setError("Enter your full name");
      return;
    }
    if (!phoneRegex.test(registerPhone)) {
      setError("Enter a valid 10-digit Indian mobile number");
      return;
    }
    if (!emailRegex.test(registerEmail.trim().toLowerCase())) {
      setError("Enter a valid email address");
      return;
    }
    if (registerPassword && registerPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    const payload = {
      name: registerName.trim(),
      phone: registerPhone,
      email: registerEmail.trim().toLowerCase(),
      ...(registerPassword ? { password: registerPassword } : {}),
    };

    setLoading(true);
    try {
      await api.post("/api/auth/register", payload);
      startOtpMode({
        identifier: payload.phone,
        displayText: `+91 ${payload.phone} and ${payload.email}`,
        isRegistration: true,
        registrationPayload: payload,
      });
    } catch (e: unknown) {
      setError(getApiError(e, "Could not send OTP"));
    } finally {
      setLoading(false);
    }
  };

  const submitLoginIdentifier = async () => {
    const value = loginIdentifier.trim();
    if (!value) {
      setError("Enter your phone number or email");
      return;
    }
    if (/^\d{10}$/.test(value)) {
      if (!phoneRegex.test(value)) {
        setError("Enter a valid 10-digit Indian mobile number");
        return;
      }
      await sendLoginOtp({ phone: value });
      return;
    }
    if (!emailRegex.test(value)) {
      setError("Enter a valid email address");
      return;
    }
    await sendLoginOtp({ email: value.toLowerCase() });
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
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await api.post("/api/auth/verify-otp", {
        identifier: otpContext.identifier,
        otp: code,
        isRegistration: otpContext.isRegistration,
      });
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
      setError(getApiError(e, "Verification failed"));
    } finally {
      setLoading(false);
    }
  }, [otp, otpContext, redirectTarget, router, setUser]);

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

  const switchToLogin = () => {
    setMode("login");
    setError(null);
  };

  const switchToRegister = () => {
    setMode("register");
    setError(null);
  };

  const backToInput = () => {
    setMode(otpContext?.isRegistration ? "register" : "login");
    setError(null);
    setOtp(["", "", "", "", "", ""]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white">
      <Navbar />
      <div className="mx-auto flex max-w-3xl flex-col px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-bold text-slate-900">
          {mode === "register" ? "Create your account" : "Welcome to DivineMarg"}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {mode === "verify-otp"
            ? "Enter your OTP to continue."
            : "Secure login with OTP on both phone and email."}
        </p>

        {mode === "register" ? (
          <div className="mt-8 space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <label className="block text-sm font-medium text-slate-700">Full Name</label>
            <div className="flex items-center rounded-xl border border-slate-200 bg-white px-3 focus-within:ring-2 focus-within:ring-violet-500">
              <span className="mr-2 text-slate-500">👤</span>
              <input
                type="text"
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                className="w-full py-3 text-slate-900 outline-none"
                placeholder="Your full name"
                autoComplete="name"
              />
            </div>

            <label className="block text-sm font-medium text-slate-700">Phone Number</label>
            <div className="flex rounded-xl border border-slate-200 bg-white shadow-sm focus-within:ring-2 focus-within:ring-violet-500">
              <span className="flex items-center border-r border-slate-200 px-3 text-lg">🇮🇳 +91</span>
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                maxLength={10}
                value={registerPhone}
                onChange={(e) =>
                  setRegisterPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                }
                className="w-full rounded-r-xl px-3 py-3 text-slate-900 outline-none"
                placeholder="9876543210"
              />
            </div>

            <label className="block text-sm font-medium text-slate-700">Email Address</label>
            <div className="flex items-center rounded-xl border border-slate-200 bg-white px-3 focus-within:ring-2 focus-within:ring-violet-500">
              <span className="mr-2 text-slate-500">✉️</span>
              <input
                type="email"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                className="w-full py-3 text-slate-900 outline-none"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <label className="block text-sm font-medium text-slate-700">Password (optional)</label>
            <div className="flex items-center rounded-xl border border-slate-200 bg-white px-3 focus-within:ring-2 focus-within:ring-violet-500">
              <input
                type={showPassword ? "text" : "password"}
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                className="w-full py-3 text-slate-900 outline-none"
                placeholder="optional - for web login"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="text-xs font-semibold text-violet-600"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <p className="text-xs text-slate-500">optional - for web login</p>

            {error ? (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            ) : null}

            <button
              type="button"
              disabled={loading}
              onClick={() => void submitRegister()}
              className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95 disabled:opacity-60"
            >
              {loading ? "Sending…" : "Create Account & Send OTP"}
            </button>

            <p className="text-center text-sm text-slate-600">
              Already have account?{" "}
              <button
                type="button"
                className="font-semibold text-violet-600 hover:underline"
                onClick={switchToLogin}
              >
                Sign In
              </button>
            </p>
          </div>
        ) : null}

        {mode === "login" ? (
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">Login with Phone/Email</h2>
              <p className="mt-1 text-xs text-slate-500">
                Enter 10-digit phone or email. We auto-detect.
              </p>
              <input
                type="text"
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value.trimStart())}
                className="mt-4 w-full rounded-xl border border-slate-200 px-3 py-3 text-slate-900 outline-none ring-violet-500 focus:border-violet-500 focus:ring-2"
                placeholder="9876543210 or you@example.com"
              />
              <button
                type="button"
                disabled={loading}
                onClick={() => void submitLoginIdentifier()}
                className="mt-4 w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95 disabled:opacity-60"
              >
                {loading ? "Sending…" : "Send OTP"}
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 grid grid-cols-2 rounded-lg bg-slate-100 p-1 text-xs font-semibold">
                <button
                  type="button"
                  className={`rounded-md px-3 py-2 ${
                    activeLoginTab === "phone"
                      ? "bg-white text-violet-700 shadow-sm"
                      : "text-slate-600"
                  }`}
                  onClick={() => setActiveLoginTab("phone")}
                >
                  Phone OTP
                </button>
                <button
                  type="button"
                  className={`rounded-md px-3 py-2 ${
                    activeLoginTab === "email"
                      ? "bg-white text-violet-700 shadow-sm"
                      : "text-slate-600"
                  }`}
                  onClick={() => setActiveLoginTab("email")}
                >
                  Email OTP
                </button>
              </div>

              {activeLoginTab === "phone" ? (
                <>
                  <div className="flex rounded-xl border border-slate-200 bg-white shadow-sm focus-within:ring-2 focus-within:ring-violet-500">
                    <span className="flex items-center border-r border-slate-200 px-3 text-lg">🇮🇳 +91</span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={loginPhone}
                      onChange={(e) => setLoginPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      className="w-full rounded-r-xl px-3 py-3 text-slate-900 outline-none"
                      placeholder="9876543210"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      if (!phoneRegex.test(loginPhone)) {
                        setError("Enter a valid 10-digit Indian mobile number");
                        return;
                      }
                      void sendLoginOtp({ phone: loginPhone });
                    }}
                    className="mt-4 w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95 disabled:opacity-60"
                  >
                    {loading ? "Sending…" : "Send OTP"}
                  </button>
                </>
              ) : (
                <>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-3 text-slate-900 outline-none ring-violet-500 focus:border-violet-500 focus:ring-2"
                    placeholder="you@example.com"
                  />
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      const email = loginEmail.trim().toLowerCase();
                      if (!emailRegex.test(email)) {
                        setError("Enter a valid email address");
                        return;
                      }
                      void sendLoginOtp({ email });
                    }}
                    className="mt-4 w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95 disabled:opacity-60"
                  >
                    {loading ? "Sending…" : "Send OTP"}
                  </button>
                </>
              )}
            </div>

            <div className="md:col-span-2">
              {error ? (
                <p className="text-sm text-red-600" role="alert">
                  {error}
                </p>
              ) : null}
              <p className="mt-2 text-center text-sm text-slate-600">
                New here?{" "}
                <button
                  type="button"
                  className="font-semibold text-violet-600 hover:underline"
                  onClick={switchToRegister}
                >
                  Create Account
                </button>
              </p>
            </div>
          </div>
        ) : null}

        {mode === "verify-otp" ? (
          <div className="mt-8 space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <button
              type="button"
              className="text-sm font-medium text-violet-600 hover:underline"
              onClick={backToInput}
            >
              ← Change phone/email
            </button>
            <p className="text-sm text-slate-600">
              OTP sent to:{" "}
              <span className="font-semibold text-slate-900">
                {otpContext?.displayText ?? "your contact"}
              </span>
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
              className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95 disabled:opacity-60"
            >
              {loading ? "Verifying…" : "Verify & Continue"}
            </button>
            <button
              type="button"
              disabled={loading || cooldown > 0}
              onClick={() => void resendOtp()}
              className="w-full rounded-xl border border-violet-200 py-3 text-sm font-semibold text-violet-700 transition hover:bg-violet-50 disabled:opacity-60"
            >
              {cooldown > 0 ? `Resend OTP in ${cooldown}s` : "Resend OTP"}
            </button>
          </div>
        ) : null}

        <p className="mt-10 text-center text-sm text-slate-500">
          <Link href="/" className="text-violet-600 hover:underline">
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
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

