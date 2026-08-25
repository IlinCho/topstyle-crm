import Link from "next/link";
import { db } from "@/lib/db";
import { formatEur, formatDateTime } from "@/lib/format";
import { statusLabel, statusPillClass, isQuickOrder } from "@/lib/order-status";
import { buildRepeatIndex, isRepeatInIndex } from "@/lib/repeat-customer";
import { getCustomerStatus, customerStatusLabel, customerStatusIcon, customerStatusPillClass } from "@/lib/customer-status";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [productCount, categoryCount, orderCount, quickOrderCount, lowStockCount, recentOrders, repeatIndex] = await Promise.all([
    db.product.count(),
    db.category.count(),
    db.order.count(),
    db.order.count({ where: { deliveryMethod: "quick_order" } }),
    db.productVariant.count({ where: { stock: { gt: 0, lte: 3 } } }),
    db.order.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { items: true, customer: true } }),
    buildRepeatIndex(),
  ]);

  return (
    <>
      <div className="admin-topbar">
        <h1 className="admin-h1">Табло</h1>
      </div>

      <div className="stat-grid">
        <div className="stat-box">
          <div className="stat-box__label">Продукти</div>
          <div className="stat-box__value">{productCount}</div>
        </div>
        <div className="stat-box">
          <div className="stat-box__label">Категории</div>
          <div className="stat-box__value">{categoryCount}</div>
        </div>
        <div className="stat-box">
          <div className="stat-box__label">Поръчки</div>
          <div className="stat-box__value">{orderCount}</div>
        </div>
        <div className="stat-box">
          <div className="stat-box__label">Ниска наличност</div>
          <div className="stat-box__value">{lowStockCount}</div>
        </div>
        <div className="stat-box">
          <div className="stat-box__label">Бързи поръчки</div>
          <div className="stat-box__value">{quickOrderCount}</div>
        </div>
      </div>

      <div className="card-box">
        <div className="flex-between" style={{ marginBottom: 14 }}>
          <strong>Последни поръчки</strong>
          <Link href="/admin/orders" className="muted">Виж всички →</Link>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>№</th><th>Дата</th><th>Клиент</th><th>Статус клиент</th><th>Тип</th><th>Артикули</th><th>Сума</th><th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((o) => {
              const custStatus = getCustomerStatus({
                isLegacy: o.isLegacy,
                isRepeat: isRepeatInIndex(repeatIndex, o.guestEmail, o.guestPhone),
                hasAccount: !!o.customer?.passwordHash,
              });
              return (
              <tr key={o.id}>
                <td><Link href={`/admin/orders/${o.id}`}>{o.orderNumber}</Link></td>
                <td className="muted">{formatDateTime(o.createdAt)}</td>
                <td>{o.guestName}</td>
                <td>
                  <span className={customerStatusPillClass(custStatus)}>
                    {customerStatusIcon(custStatus)}{customerStatusLabel(custStatus)}
                  </span>
                </td>
                <td>
                  {isQuickOrder(o.deliveryMethod) ? (
                    <span className="pill pill--warn">⚡ бърза</span>
                  ) : (
                    <span className="pill pill--muted">обикновена</span>
                  )}
                </td>
                <td>{o.items.length}</td>
                <td>{formatEur(o.totalEur)}</td>
                <td><span className={statusPillClass(o.status)}>{statusLabel(o.status)}</span></td>
              </tr>
              );
            })}
            {recentOrders.length === 0 && (
              <tr><td colSpan={8} className="muted">Все още няма поръчки.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card-box">
        <strong>Бързи действия</strong>
        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <Link href="/admin/products/new" className="btn btn--sm">+ Нов продукт</Link>
          <Link href="/admin/categories" className="btn btn--ghost btn--sm">Управление на категории</Link>
        </div>
      </div>
    </>
  );
}
