"use client";

import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getClientDb, isFirebaseConfigured } from "@/lib/firebase/client";
import { trackEvent } from "@/components/analytics/AnalyticsTracker";
import { MagneticButton } from "@/components/ui/MagneticButton";

export function ContactForm({ emailFallback }: { emailFallback?: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isFirebaseConfigured()) {
      window.location.href = `mailto:${emailFallback || "hello@azizspearfishing.com"}?subject=${encodeURIComponent(subject || "Contact")}&body=${encodeURIComponent(message)}`;
      return;
    }
    setStatus("saving");
    try {
      await addDoc(collection(getClientDb(), "messages"), {
        name,
        email,
        company,
        subject,
        message,
        status: "unread",
        createdAt: serverTimestamp(),
      });
      void trackEvent({ type: "message", page: "contact" });
      setStatus("success");
      setName("");
      setEmail("");
      setCompany("");
      setSubject("");
      setMessage("");
    } catch {
      setStatus("error");
    }
  }

  const field =
    "w-full rounded-none border border-foam/20 bg-transparent px-3 py-2 text-sm text-foam outline-none focus:border-accent-teal";

  return (
    <form onSubmit={onSubmit} className="mt-8 w-full max-w-xl space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <input className={field} placeholder="Name" required value={name} onChange={(e) => setName(e.target.value)} />
        <input className={field} type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <input className={field} placeholder="Company (optional)" value={company} onChange={(e) => setCompany(e.target.value)} />
      <input className={field} placeholder="Subject" required value={subject} onChange={(e) => setSubject(e.target.value)} />
      <textarea className={field} rows={4} placeholder="Message" required value={message} onChange={(e) => setMessage(e.target.value)} />
      {status === "success" && <p className="text-sm text-accent-teal">Message sent. Thank you.</p>}
      {status === "error" && <p className="text-sm text-red-300">Unable to send. Please try again.</p>}
      <MagneticButton type="submit" disabled={status === "saving"}>
        {status === "saving" ? "Sending..." : "Send message"}
      </MagneticButton>
    </form>
  );
}
