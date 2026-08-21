import Link from "next/link";
import { db } from "@/lib/db";
import { formatEur } from "@/lib/format";
import { statusLabel, statusPillClass, isQuickOrder } from "@/lib/order-status";
import { buildRepeatIndex, isRepeatInIndex } from "@/lib/repeat-customer";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await db.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true, customer: true },
  });
  const repeatIndex = await buildRepeatIndex();

  return (
    <>
      <div className="admin-topbar">
        <h1 className="admin-h1">Поръчки ({orders.length})</h1>
      </div>

      <div className="card-box">
        <table className="admin-table">
          <thead>
            <tr>
              <th>№</th><th>Дата</th><th>Клиент</th><th>История</th><th>Повторен</th><th>Акаунт</th><th>Тип</th><th>Град</th><th>Артикули</th><th>Сума</th><th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td><Link href={`/admin/orders/${o.id}`}>{o.orderNumber}</Link></td>
                <td className="muted">{new Date(o.createdAt).toLocaleDateString("bg-BG")}</td>
                <td>{o.guestName}</td>
                <td>
                  {o.isLegacy ? (
                    <span className="pill pill--info">🕐 Стар</span>
                  ) : (
                    <span className="pill pill--ok">✨ Нов</span>
                  )}
                </td>
                <td>
                  {isRepeatInIndex(repeatIndex, o.guestEmail, o.guestPhone) ? (
                    <span className="pill pill--info">🔁 Повторен</span>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
                <td>
                  {o.customer?.passwordHash ? (
                    <span className="pill pill--ok">Регистриран</span>
                  ) : (
                    <span className="pill pill--muted">Гост</span>
                  )}
                </td>
                <td>
                  {isQuickOrder(o.deliveryMethod) ? (
                    <span className="pill pill--warn">⚡ бърза</span>
                  ) : (
                    <span className="pill pill--muted">обикновена</span>
                  )}
                </td>
                <td>{o.city || (isQuickOrder(o.deliveryMethod) ? "— обади се за адрес" : "")}</td>
                <td>{o.items.length}</td>
                <td>{formatEur(o.totalEur)}</td>
                <td><span className={statusPillClass(o.status)}>{statusLabel(o.status)}</span></td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan={11} className="muted">Все още няма поръчки.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
