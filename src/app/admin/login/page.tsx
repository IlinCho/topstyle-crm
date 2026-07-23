import { loginAction } from "../actions";

export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div className="login-shell">
      <form action={loginAction} className="login-box">
        <h1 style={{ fontSize: 20, marginTop: 0 }}>TopStyle Admin</h1>
        <div className="field">
          <label>Имейл</label>
          <input name="email" type="email" required autoFocus />
        </div>
        <div className="field">
          <label>Парола</label>
          <input name="password" type="password" required />
        </div>
        {searchParams?.error && <p className="error-text">Грешен имейл или парола.</p>}
        <button className="btn" style={{ width: "100%", marginTop: 8 }} type="submit">
          Вход
        </button>
      </form>
    </div>
  );
}
