import { db } from "@/lib/db";
import { formatBgn } from "@/lib/format";
import { deleteAbandonedCheckoutAction } from "../../actions";

const STEP_LABELS: Record<number, string> = { 1: "Лични данни", 2: "Доставка", 3: "Плащане" };

type SnapshotItem = { name: string; size: string; color: string; qty: number; priceBgn: number };

export default async function AbandonedCheckoutsPage() {
  const rows = await db.abandonedCheckout.findMany({ orderBy: { updatedAt: "desc" } });

  return (
    <div>
      <div className="admin-topbar">
        <h1 className="admin-h1">Изоставени поръчки</h1>
      </div>

      {rows.length === 0 ? (
        <p className="muted">Все още няма изоставени поръчки.</p>
      ) : (
        <div className="card-box" style={{ padding: 0 }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Последна активност</th>
                <th>Име</th>
                <th>Телефон</th>
                <th>Имейл</th>
                <th>Град</th>
                <th>Стъпка</th>
                <th>Артикули</th>
                <th>Общо</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                let items: SnapshotItem[] = [];
                try {
                  items = JSON.parse(r.itemsJson || "[]");
                } catch {}
                return (
                  <tr key={r.id}>
                    <td style={{ whiteSpace: "nowrap" }}>{new Date(r.updatedAt).toLocaleString("bg-BG")}</td>
                    <td>{r.name || <span className="muted">—</span>}</td>
                    <td>{r.phone || <span className="muted">—</span>}</td>
                    <td>{r.email || <span className="muted">—</span>}</td>
                    <td>{r.city || <span className="muted">—</span>}</td>
                    <td>
                      <span className="pill pill--info">{STEP_LABELS[r.step] || r.step}</span>
                    </td>
                    <td style={{ fontSize: 12.5 }}>
                      {items.length === 0 ? (
                        <span className="muted">празна количка</span>
                      ) : (
                        items.map((it, i) => (
                          <div key={i}>
                            {it.name} · {it.size} · × {it.qty}
                          </div>
                        ))
                      )}
                    </td>
                    <td style={{ fontWeight: 700 }}>{formatBgn(r.totalBgn)}</td>
                    <td>
                      <form action={deleteAbandonedCheckoutAction}>
                        <input type="hidden" name="id" value={r.id} />
                        <button className="btn btn--ghost btn--sm" type="submit">
                          Изтрий
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
