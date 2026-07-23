import Link from "next/link";
import { db } from "@/lib/db";
import { formatBgn } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [productCount, categoryCount, orderCount, lowStockCount, recentOrders] = await Promise.all([
    db.product.count(),
    db.category.count(),
    db.order.count(),
    db.productVariant.count({ where: { stock: { gt: 0, lte: 3 } } }),
    db.order.findMany({ orderBy: { createdAt: "desc" }, take: 6, include: { items: true } }),
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
      </div>

      <div className="card-box">
        <div className="flex-between" style={{ marginBottom: 14 }}>
          <strong>Последни поръчки</strong>
          <Link href="/admin/orders" className="muted">Виж всички →</Link>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>№</th><th>Клиент</th><th>Артикули</th><th>Сума</th><th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((o) => (
              <tr key={o.id}>
                <td><Link href={`/admin/orders/${o.id}`}>{o.orderNumber}</Link></td>
                <td>{o.guestName}</td>
                <td>{o.items.length}</td>
                <td>{formatBgn(o.totalBgn)}</td>
                <td><span className="pill pill--warn">{o.status}</span></td>
              </tr>
            ))}
            {recentOrders.length === 0 && (
              <tr><td colSpan={5} className="muted">Все още няма поръчки.</td></tr>
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
