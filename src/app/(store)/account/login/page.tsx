import Link from "next/link";
import { redirect } from "next/navigation";
import { getCustomerSession } from "@/lib/customer-auth";
import { loginAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string; guest?: string; error?: string };
}) {
  const next = searchParams?.next && searchParams.next.startsWith("/") ? searchParams.next : "/account";
  const showGuestOption = searchParams?.guest === "1";

  // Already logged in (e.g. returning customer with a saved session) - skip straight through.
  const session = await getCustomerSession();
  if (session) redirect(next);

  return (
    <div className="container" style={{ padding: "30px 0 60px" }}>
      <h1 className="section-title" style={{ marginTop: 0 }}>
        {showGuestOption ? "Завършване на поръчката" : "Вход"}
      </h1>

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
          <p className="opt-label" style={{ marginTop: 0 }}>Вход с имейл</p>
          {searchParams?.error === "locked" && (
            <p className="error-text">Твърде много неуспешни опити. Опитайте отново след 15 минути.</p>
          )}
          {searchParams?.error === "1" && (
            <p className="error-text">Грешен имейл или парола.</p>
          )}
          <form action={loginAction}>
            <input type="hidden" name="next" value={next} />
            <div className="field">
              <label>Имейл</label>
              <input name="email" type="email" required />
            </div>
            <div className="field">
              <label>Парола</label>
              <input name="password" type="password" required />
            </div>
            <div className="field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <input type="checkbox" name="remember" id="remember" defaultChecked style={{ width: "auto" }} />
              <label htmlFor="remember" style={{ marginBottom: 0 }}>Запомни ме</label>
            </div>
            <button className="btn" type="submit" style={{ width: "100%" }}>Вход</button>
          </form>
          <p style={{ fontSize: 13, marginTop: 14 }}>
            Нямаш профил?{" "}
            <Link href={`/account/register?next=${encodeURIComponent(next)}${showGuestOption ? "&guest=1" : ""}`} className="muted" style={{ textDecoration: "underline" }}>
              Регистрирай се
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
