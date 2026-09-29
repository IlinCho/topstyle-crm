"use client";

import { useState } from "react";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [agree, setAgree] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!agree) {
      setError("Моля, потвърди съгласието си с условията.");
      setState("error");
      return;
    }
    setState("sending");
    setError("");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, agree }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Възникна грешка. Опитайте отново.");
        setState("error");
        return;
      }
      setState("ok");
      setEmail("");
    } catch {
      setError("Възникна грешка. Опитайте отново.");
      setState("error");
    }
  }

  return (
    <form className="newsletter-form-wrap" onSubmit={submit}>
      <div className="newsletter-form">
        <input
          type="email"
          placeholder="Вашият имейл"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit" className="btn" disabled={state === "sending"} aria-label="Абонирай се">
          ✉
        </button>
      </div>
      <p className="newsletter-note">
        Можете да се отпишете във всеки момент. За целта моля намерете информацията за контакт с
        нас в правните условия.
      </p>
      <label className="newsletter-consent">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
        Съгласен съм с условията и политиката за поверителност
      </label>
      {state === "ok" && <p className="newsletter-msg newsletter-msg--ok">✓ Благодарим, записахме те!</p>}
      {state === "error" && <p className="newsletter-msg newsletter-msg--error">{error}</p>}
    </form>
  );
}
