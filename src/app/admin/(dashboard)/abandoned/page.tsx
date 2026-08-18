import { db } from "@/lib/db";
import { formatBgn } from "@/lib/format";
import { deleteAbandonedCheckoutAction } from "../../actions";

export const dynamic = "force-dynamic";

const STEP_LABELS: Record<number, string> = {
  1: "Лични данни",
  2: "Доставка",
  3: "Плащане",
};

type SnapshotItem = { name: string; size: string; color: string; qty: number; priceBgn: number };

export default async function AbandonedCheckoutsPage() {
  const rows = await db.abandonedCheckout.findMany({ orderBy: { updatedAt: "desc" } });

  return (
    <>
      <div className="admin-topbar">
        <h1 className="admin-h1">Изоставени поръчки ({rows.length})</h1>
      </div>

      <p className="muted" style={{ marginTop: -6, marginBottom: 16, fontSize: 13 }}>
        Клиенти, започнали поръчка (въвели име/имейл/телефон), но не я довършили. Изчезват от този
        списък автоматично, щом завършат истинска поръчка — иначе остават тук, за да им звъннеш/пишеш.
      </p>

      <div className="card-box">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Последна активност</th>
              <th>Име</th>
              <th>Телефон</th>
              <th>Имейл</th>
              <th>Град</th>
              <th>Стъпка</th>
              <th>Продукти</th>
              <th>Сума</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              let items: SnapshotItem[] = [];
              try {
                items = JSON.parse(r.itemsJson);
              } catch {}
              return (
                <tr key={r.id}>
                  <td className="muted" style={{ whiteSpace: "nowrap" }}>
                    {new Date(r.updatedAt).toLocaleString("bg-BG", { dateStyle: "short", timeStyle: "short" })}
                  </td>
                  <td>{r.name || "—"}</td>
                  <td>{r.phone || "—"}</td>
                  <td>{r.email || "—"}</td>
                  <td>{r.city || "—"}</td>
                  <td>
                    <span className="pill pill--warn">{STEP_LABELS[r.step] || `Стъпка ${r.step}`}</span>
                  </td>
                  <td style={{ fontSize: 12.5 }}>
                    {items.length === 0
                      ? "—"
                      : items.map((it, i) => (
                          <div key={i}>
                            {it.name} ({it.size}) × {it.qty}
                          </div>
                        ))}
                  </td>
                  <td>{r.totalBgn ? formatBgn(r.totalBgn) : "—"}</td>
                  <td>
                    <form action={deleteAbandonedCheckoutAction}>
                      <input type="hidden" name="id" value={r.id} />
                      <button type="submit" className="btn btn--ghost btn--sm">✕</button>
                    </form>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="muted">Все още няма изоставени поръчки.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
