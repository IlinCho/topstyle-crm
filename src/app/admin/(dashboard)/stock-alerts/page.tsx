import { db } from "@/lib/db";
import { markStockAlertNotifiedAction, deleteStockAlertAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function StockAlertsPage() {
  const alerts = await db.stockAlert.findMany({
    orderBy: { createdAt: "desc" },
    include: { product: true },
  });

  // Grouping by product+size surfaces real demand at a glance - e.g. "M size
  // of this t-shirt has 6 people waiting" is a much stronger restock signal
  // than a flat list of emails.
  const grouped = new Map<string, { productName: string; size: string; color: string; count: number }>();
  for (const a of alerts) {
    const key = `${a.productId}::${a.size}::${a.color}`;
    const existing = grouped.get(key);
    if (existing) existing.count += 1;
    else grouped.set(key, { productName: a.product.name, size: a.size, color: a.color, count: 1 });
  }
  const groups = Array.from(grouped.values()).sort((a, b) => b.count - a.count);

  return (
    <>
      <div className="admin-topbar">
        <h1 className="admin-h1">Известия за наличност ({alerts.length})</h1>
      </div>

      <p className="muted" style={{ marginTop: -6, marginBottom: 16, fontSize: 13 }}>
        Клиенти, поискали да бъдат уведомени, когато конкретен размер/цвят се появи отново в наличност.
        Реален сигнал за търсене — използвай го, за да решиш кое да презаредиш първо.
      </p>

      {groups.length > 0 && (
        <div className="card-box">
          <strong>Най-търсени за ресток</strong>
          <table className="admin-table" style={{ marginTop: 10 }}>
            <thead>
              <tr><th>Продукт</th><th>Размер</th><th>Цвят</th><th>Чакащи клиенти</th></tr>
            </thead>
            <tbody>
              {groups.map((g, i) => (
                <tr key={i}>
                  <td>{g.productName}</td>
                  <td>{g.size}</td>
                  <td>{g.color || "—"}</td>
                  <td><span className="pill pill--warn">{g.count}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="card-box">
        <strong>Всички заявки</strong>
        <table className="admin-table" style={{ marginTop: 10 }}>
          <thead>
            <tr><th>Дата</th><th>Продукт</th><th>Размер</th><th>Цвят</th><th>Имейл</th><th>Статус</th><th></th></tr>
          </thead>
          <tbody>
            {alerts.map((a) => (
              <tr key={a.id}>
                <td className="muted">{new Date(a.createdAt).toLocaleDateString("bg-BG")}</td>
                <td>{a.product.name}</td>
                <td>{a.size}</td>
                <td>{a.color || "—"}</td>
                <td>{a.email}</td>
                <td>
                  <span className={`pill ${a.notified ? "pill--ok" : "pill--warn"}`}>
                    {a.notified ? "уведомен" : "чака"}
                  </span>
                </td>
                <td style={{ display: "flex", gap: 6 }}>
                  {!a.notified && (
                    <form action={markStockAlertNotifiedAction}>
                      <input type="hidden" name="id" value={a.id} />
                      <button type="submit" className="btn btn--ghost btn--sm">Маркирай уведомен</button>
                    </form>
                  )}
                  <form action={deleteStockAlertAction}>
                    <input type="hidden" name="id" value={a.id} />
                    <button type="submit" className="btn btn--ghost btn--sm">✕</button>
                  </form>
                </td>
              </tr>
            ))}
            {alerts.length === 0 && (
              <tr><td colSpan={7} className="muted">Все още няма заявки.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
