import Link from "next/link";
import { redirect } from "next/navigation";
import { getCustomerSession } from "@/lib/customer-auth";
import { registerAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: { next?: string; guest?: string; error?: string };
}) {
  const next = searchParams?.next && searchParams.next.startsWith("/") ? searchParams.next : "/account";
  const showGuestOption = searchParams?.guest === "1";

  const session = await getCustomerSession();
  if (session) redirect(next);

  return (
    <div className="container" style={{ padding: "30px 0 60px" }}>
      <h1 className="section-title" style={{ marginTop: 0 }}>Регистрация</h1>

      {showGuestOption && (
        <Link
          href={next}
          className="btn"
          style={{ width: "100%", textAlign: "center", display: "block", marginBottom: 20 }}
        >
          Продължи като гост
        </Link>
      )}

      <div className={showGuestOption ? "pdp" : ""} style={showGuestOption ? { alignItems: "start" } : { maxWidth: 440 }}>
        <div className="card-box">
          {searchParams?.error === "exists" && (
            <p className="error-text">Вече има регистрация с този имейл — влез вместо това.</p>
          )}
          {searchParams?.error === "1" && (
            <p className="error-text">Моля попълни име, имейл и парола (поне 6 символа).</p>
          )}
          <form action={registerAction}>
            <input type="hidden" name="next" value={next} />
            <div className="field">
              <label>Име и фамилия</label>
              <input name="name" required />
            </div>
            <div className="field">
              <label>Имейл</label>
              <input name="email" type="email" required />
            </div>
            <div className="field">
              <label>Телефон (по избор)</label>
              <input name="phone" />
            </div>
            <div className="field">
              <label>Парола (поне 6 символа)</label>
              <input name="password" type="password" minLength={6} required />
            </div>
            <button className="btn" type="submit" style={{ width: "100%" }}>Регистрация</button>
          </form>
          <p style={{ fontSize: 13, marginTop: 14 }}>
            Вече имаш профил?{" "}
            <Link href={`/account/login?next=${encodeURIComponent(next)}${showGuestOption ? "&guest=1" : ""}`} className="muted" style={{ textDecoration: "underline" }}>
              Вход
            </Link>
          </p>
        </div>

        {showGuestOption && (
          <div className="card-box">
            <p className="opt-label" style={{ marginTop: 0 }}>Защо да се регистрираш?</p>
            <p style={{ fontSize: 13.5, color: "var(--muted)" }}>
              По-бърза поръчка следващия път и история на поръчките в профила ти. Не е задължително.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
