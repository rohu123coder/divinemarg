"use client";
import { Suspense, useState, useRef, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import api from "@/lib/api";
import { useAuthStore, type AuthUser } from "@/lib/store";
import Link from "next/link";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useAuthStore((s) => s.setUser);
  const { isLoggedIn, token, user } = useAuthStore();
  const tabParam = searchParams.get("tab");
  const [mode, setMode] = useState<"login"|"register"|"verify">(
    tabParam === "register" ? "register" : "login"
  );
  const [identifier, setIdentifier] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["","","","","",""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [sentTo, setSentTo] = useState("");
  const [isReg, setIsReg] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputsRef = useRef<Array<HTMLInputElement|null>>([]);
  const redirectTarget = searchParams.get("redirect");

  useEffect(() => {
    if (isLoggedIn && token && user?.role === "astrologer") router.replace("/astrologer/dashboard");
  }, [isLoggedIn, token, user?.role, router]);

  useEffect(() => {
    if (tabParam === "register") {
      setMode("register");
    } else if (tabParam === null || tabParam === "login") {
      setMode("login");
    }
  }, [tabParam]);

  useEffect(() => {
    if (countdown > 0) { const t = setTimeout(() => setCountdown(c => c-1), 1000); return () => clearTimeout(t); }
  }, [countdown]);

  const sendOtp = async () => {
    setError(null); setLoading(true);
    try {
      await api.post("/api/auth/send-otp", 
        identifier.includes("@") ? { email: identifier } : { phone: identifier }
      );
      setSentTo(identifier); setIsReg(false);
      setMode("verify"); setOtp(["","","","","",""]); setCountdown(30);
      setTimeout(() => inputsRef.current[0]?.focus(), 100);
    } catch(e: unknown) {
      const err = e as {response?: {data?: {error?: string}}};
      setError(err?.response?.data?.error ?? "Could not send OTP");
    } finally { setLoading(false); }
  };

  const sendRegisterOtp = async () => {
    setError(null);
    if (!name.trim()) { setError("Enter your full name"); return; }
    if (!/^[6-9]\d{9}$/.test(phone)) { setError("Enter valid 10-digit phone"); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError("Enter valid email"); return; }
    setLoading(true);
    try {
      await api.post("/api/auth/register", { name, phone, email });
      setSentTo(phone + " & " + email); setIsReg(true);
      setMode("verify"); setOtp(["","","","","",""]); setCountdown(30);
      setTimeout(() => inputsRef.current[0]?.focus(), 100);
    } catch(e: unknown) {
      const err = e as {response?: {data?: {error?: string}}};
      setError(err?.response?.data?.error ?? "Registration failed");
    } finally { setLoading(false); }
  };

  const verifyOtp = useCallback(async () => {
    const code = otp.join("");
    if (code.length !== 6) return;
    setError(null); setLoading(true);
    try {
      const id = isReg ? phone : identifier;
      const res = await api.post("/api/auth/verify-otp", { identifier: id, otp: code, isRegistration: isReg });
      const data = res.data?.data as { token: string; user: AuthUser };
      setUser({ ...data.user, role: "user" }, data.token);
      const safe = redirectTarget?.startsWith("/") && !redirectTarget.startsWith("//") ? redirectTarget : "/dashboard";
      router.replace(safe);
    } catch(e: unknown) {
      const err = e as {response?: {data?: {error?: string}}};
      setError(err?.response?.data?.error ?? "Verification failed");
    } finally { setLoading(false); }
  }, [otp, phone, identifier, isReg, redirectTarget, router, setUser]);

  const setDigit = (i: number, v: string) => {
    const d = v.replace(/\D/g,"").slice(-1);
    setOtp(p => { const n=[...p]; n[i]=d; return n; });
    if (d && i < 5) inputsRef.current[i+1]?.focus();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white">
      <Navbar />
      <div className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-purple-100 p-8">
          
          {mode === "login" && (
            <>
              <h1 className="text-2xl font-bold text-slate-900 text-center">Welcome to DivineMarg ✨</h1>
              <p className="text-sm text-slate-500 text-center mt-2 mb-8">Login with your phone number or email</p>
              <div className="space-y-4">
                <input
                  type="text"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder="Phone number or Email"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-violet-500"
                />
                <div className="text-right">
                  <Link
                    href="/forgot-password"
                    className="text-secondary text-[13px] hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                {error && <p className="text-red-600 text-sm">{error}</p>}
                <button onClick={sendOtp} disabled={loading || !identifier}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold disabled:opacity-60">
                  {loading ? "Sending..." : "Send OTP"}
                </button>
                <div className="flex items-center gap-3 my-2">
                  <div className="flex-1 h-px bg-slate-200"/>
                  <span className="text-slate-400 text-sm">OR</span>
                  <div className="flex-1 h-px bg-slate-200"/>
                </div>
                <button onClick={() => { setMode("register"); setError(null); }}
                  className="w-full py-3 rounded-xl border-2 border-purple-600 text-purple-600 font-semibold hover:bg-purple-50">
                  Create Account
                </button>
              </div>
              <Link href="/" className="block text-center text-sm text-violet-600 hover:underline mt-6">← Back to home</Link>
            </>
          )}

          {mode === "register" && (
            <>
              <h1 className="text-2xl font-bold text-slate-900 text-center">Create Account</h1>
              <p className="text-sm text-slate-500 text-center mt-2 mb-8">Join DivineMarg today</p>
              <div className="space-y-4">
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Full Name" className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500"/>
                <div className="flex rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-violet-500">
                  <span className="flex items-center px-3 border-r border-slate-200">🇮🇳 +91</span>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g,"").slice(0,10))}
                    placeholder="Phone number" className="w-full px-3 py-3 outline-none rounded-r-xl"/>
                </div>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="Email address" className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500"/>
                {error && <p className="text-red-600 text-sm">{error}</p>}
                <button onClick={sendRegisterOtp} disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold disabled:opacity-60">
                  {loading ? "Sending..." : "Send OTP & Register"}
                </button>
                <button onClick={() => { setMode("login"); setError(null); }}
                  className="w-full text-center text-sm text-violet-600 hover:underline">
                  Already have account? Sign In
                </button>
              </div>
            </>
          )}

          {mode === "verify" && (
            <>
              <h1 className="text-2xl font-bold text-slate-900 text-center">Enter OTP</h1>
              <p className="text-sm text-slate-500 text-center mt-2 mb-8">OTP sent to: <span className="font-semibold text-slate-700">{sentTo}</span></p>
              <div className="space-y-4">
                <div className="flex justify-between gap-2">
                  {otp.map((d,i) => (
                    <input key={i} ref={el => { inputsRef.current[i]=el; }} inputMode="numeric" maxLength={1} value={d}
                      onChange={e => setDigit(i, e.target.value)}
                      onKeyDown={e => { if(e.key==="Backspace" && !otp[i] && i>0) inputsRef.current[i-1]?.focus(); }}
                      className="h-12 w-full rounded-lg border border-slate-200 text-center text-lg font-bold outline-none focus:ring-2 focus:ring-violet-500"/>
                  ))}
                </div>
                {error && <p className="text-red-600 text-sm">{error}</p>}
                <button onClick={verifyOtp} disabled={loading || otp.some(x => x==="")}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold disabled:opacity-60">
                  {loading ? "Verifying..." : "Verify & Continue"}
                </button>
                <div className="flex justify-between text-sm">
                  <button onClick={() => { setMode(isReg ? "register" : "login"); setError(null); }}
                    className="text-violet-600 hover:underline">← Change {isReg ? "details" : "phone/email"}</button>
                  {countdown > 0 ? (
                    <span className="text-slate-400">Resend in {countdown}s</span>
                  ) : (
                    <button onClick={isReg ? sendRegisterOtp : sendOtp} className="text-violet-600 hover:underline">Resend OTP</button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div></div>}>
      <LoginContent />
    </Suspense>
  );
}
