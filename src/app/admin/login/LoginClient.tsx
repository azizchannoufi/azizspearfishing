"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginWithEmail, resetPassword, getAdminClaim } from "@/lib/firebase/auth";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { btnPrimary, inputClass, Field, FormStatus } from "@/components/admin/ui";

export default function AdminLoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>();

  const denied = params.get("denied");
  const configured = isFirebaseConfigured();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!configured) {
      setStatus("error");
      setMessage("Firebase is not configured.");
      return;
    }
    setStatus("saving");
    setMessage(undefined);
    try {
      if (mode === "forgot") {
        await resetPassword(email);
        setStatus("success");
        setMessage("Password reset email sent.");
        return;
      }
      const cred = await loginWithEmail(email, password);
      const admin = await getAdminClaim(cred.user, true);
      if (!admin) {
        setStatus("error");
        setMessage("Access denied. Admin role required.");
        return;
      }
      document.cookie = `admin_session=1; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      setStatus("success");
      const next = params.get("next") || "/admin";
      router.replace(next);
    } catch {
      setStatus("error");
      setMessage(
        mode === "forgot"
          ? "Unable to send reset email."
          : "Invalid email or password.",
      );
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Admin Login</h1>
        <p className="mt-1 text-sm text-slate-500">AZIZ Spearfishing CMS</p>

        {denied && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            Access denied. Admin role required.
          </p>
        )}

        {!configured && (
          <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Configure Firebase in .env.local before signing in.
          </p>
        )}

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Field label="Email">
            <input
              type="email"
              required
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </Field>
          {mode === "login" && (
            <Field label="Password">
              <input
                type="password"
                required
                className={inputClass}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </Field>
          )}
          <FormStatus status={status} message={message} />
          <button type="submit" className={btnPrimary + " w-full"} disabled={status === "saving"}>
            {mode === "login" ? "Sign in" : "Send reset link"}
          </button>
        </form>

        <button
          type="button"
          className="mt-4 text-sm text-slate-600 underline"
          onClick={() => {
            setMode((m) => (m === "login" ? "forgot" : "login"));
            setStatus("idle");
          }}
        >
          {mode === "login" ? "Forgot password?" : "Back to login"}
        </button>
      </div>
    </div>
  );
}
