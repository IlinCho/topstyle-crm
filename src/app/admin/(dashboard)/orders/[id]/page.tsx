import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatBgn, formatEur } from "@/lib/format";
import { updateOrderStatusAction } from "../../../actions";
import { STATUS_LABELS, statusLabel, statusPillClass, isQuickOrder } from "@/lib/order-status";

const STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

const DELIVERY_LABELS: Record<string, string> = {
  econt_office: "Еконт — до офис",
  speedy_address: "Спиди — до адрес",
  quick_order: "Бърза поръчка — липсва адрес, обади се на клиента",
};

export default async function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const order = await db.order.findUnique({
    where: { id: params.id },
    include: { items: true, customer: true },
  });
  if (!order) notFound();

  return (
    <>
      <div className="admin-topbar">
        <h1 className="admin-h1">
          Поръчка {order.orderNumber}{" "}
          {isQuickOrder(order.deliveryMethod) ? (
            <span className="pill pill--warn" style={{ marginLeft: 8 }}>⚡ бърза поръчка</span>
          ) : (
            <span className="pill pill--muted" style={{ marginLeft: 8 }}>обикновена</span>
          )}{" "}
          <span className={statusPillClass(order.status)} style={{ marginLeft: 4 }}>{statusLabel(order.status)}</span>
        </h1>
      </div>

      <div className="card-box">
        <div className="form-grid">
          <div>
            <p className="opt-label" style={{ marginTop: 0 }}>Клиент</p>
            <p>{order.guestName}<br />{order.guestPhone}<br />{order.guestEmail}</p>
            <p>{order.address}, {order.city}</p>
            {order.deliveryMethod && (
              <p className={isQuickOrder(order.deliveryMethod) ? "error-text" : "muted"}>
                {isQuickOrder(order.deliveryMethod) ? "⚠ " : ""}
                Доставка: {DELIVERY_LABELS[order.deliveryMethod] || order.deliveryMethod}
                {order.officeName ? ` (${order.officeName})` : ""}
              </p>
            )}
          </div>
          <div>
            <p className="opt-label" style={{ marginTop: 0 }}>Статус</p>
            <form action={updateOrderStatusAction} style={{ display: "flex", gap: 10 }}>
              <input type="hidden" name="id" value={order.id} />
              <select name="status" defaultValue={order.status} style={{ padding: 9, border: "1px solid #d7d7d7", borderRadius: 4 }}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
              <button className="btn btn--sm" type="submit">Обнови</button>
            </form>
          </div>
        </div>
      </div>

      <div className="card-box">
        <table className="admin-table">
          <thead>
            <tr><th>Продукт</th><th>Размер</th><th>Цвят</th><th>Бр.</th><th>Цена</th></tr>
          </thead>
          <tbody>
            {order.items.map((i) => (
              <tr key={i.id}>
                <td>{i.productName}</td>
                <td>{i.size}</td>
                <td>{i.color}</td>
                <td>{i.qty}</td>
                <td>{formatBgn(i.priceBgn * i.qty)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="cart-totals">
          <table>
            <tbody>
              <tr><td>Общо (EUR)</td><td>{formatEur(order.totalEur)}</td></tr>
              <tr><td>Общо (BGN)</td><td>{formatBgn(order.totalBgn)}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
