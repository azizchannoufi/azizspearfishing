"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { changePassword } from "@/lib/firebase/auth";
import { useAuth } from "@/components/admin/AuthProvider";
import {
  PageHeader,
  Field,
  FormStatus,
  inputClass,
  btnPrimary,
  btnSecondary,
} from "@/components/admin/ui";

export default function ProfileAdminPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | undefined>();

  async function onChangePassword() {
    if (!user) return;
    if (newPassword.length < 8) {
      setStatus("error");
      setMessage("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus("error");
      setMessage("New passwords do not match.");
      return;
    }
    setStatus("saving");
    setMessage(undefined);
    try {
      await changePassword(user, currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setStatus("success");
      setMessage("Password updated successfully.");
    } catch {
      setStatus("error");
      setMessage("Unable to change password. Check your current password.");
    }
  }

  async function onLogout() {
    await logout();
    router.replace("/admin/login");
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Profile" description="Your admin account." />

      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Name</p>
          <p className="mt-1 text-sm text-slate-900">{user?.displayName || "—"}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Email</p>
          <p className="mt-1 text-sm text-slate-900">{user?.email || "—"}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Role</p>
          <p className="mt-1 text-sm text-slate-900">Admin</p>
        </div>
        <button type="button" className={btnSecondary} onClick={() => void onLogout()}>
          Logout
        </button>
      </div>

      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Change password</h2>
        <Field label="Current password">
          <input
            className={inputClass}
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
          />
        </Field>
        <Field label="New password">
          <input
            className={inputClass}
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
          />
        </Field>
        <Field label="Confirm new password">
          <input
            className={inputClass}
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />
        </Field>
        <FormStatus status={status} message={message} />
        <button type="button" className={btnPrimary} onClick={() => void onChangePassword()}>
          Update password
        </button>
      </div>
    </div>
  );
}
