import Link from "next/link";
import { db } from "@/lib/db";
import { formatBgn } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await db.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return (
    <>
      <div className="admin-topbar">
        <h1 className="admin-h1">Поръчки ({orders.length})</h1>
      </div>

      <div className="card-box">
        <table className="admin-table">
          <thead>
            <tr><th>№</th><th>Дата</th><th>Клиент</th><th>Град</th><th>Артикули</th><th>Сума</th><th>Статус</th></tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td><Link href={`/admin/orders/${o.id}`}>{o.orderNumber}</Link></td>
                <td className="muted">{new Date(o.createdAt).toLocaleDateString("bg-BG")}</td>
                <td>{o.guestName}</td>
                <td>{o.city}</td>
                <td>{o.items.length}</td>
                <td>{formatBgn(o.totalBgn)}</td>
                <td><span className="pill pill--warn">{o.status}</span></td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan={7} className="muted">Все още няма поръчки.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
