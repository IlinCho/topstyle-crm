import { redirect } from "next/navigation";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { db } from "@/lib/db";
import { formatBgn } from "@/lib/format";
import { logoutAction } from "./actions";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  pending: "Изчаква обработка",
  confirmed: "Потвърдена",
  shipped: "Изпратена",
  delivered: "Доставена",
  cancelled: "Отказана",
};

export default async function AccountPage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/account/login?next=/account");

  const orders = await db.order.findMany({
    where: { customerId: customer.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="container" style={{ padding: "30px 0 60px" }}>
      <div className="admin-topbar">
        <h1 className="section-title" style={{ margin: 0 }}>Моят профил</h1>
        <form action={logoutAction}>
          <button className="btn btn--ghost btn--sm" type="submit">Изход</button>
        </form>
      </div>

      <div className="card-box">
        <p style={{ margin: 0 }}>
          <strong>{customer.name}</strong>
          <br />
          {customer.email}
          {customer.phone && <><br />{customer.phone}</>}
        </p>
      </div>

      <h2 className="section-title" style={{ marginTop: 30 }}>Поръчки</h2>
      {orders.length === 0 ? (
        <p className="muted">Все още нямаш направени поръчки.</p>
      ) : (
        <div className="card-box">
          <table className="admin-table">
            <thead>
              <tr><th>Номер</th><th>Дата</th><th>Статус</th><th>Сума</th></tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>{o.orderNumber}</td>
                  <td>{new Date(o.createdAt).toLocaleDateString("bg-BG")}</td>
                  <td>{STATUS_LABELS[o.status] || o.status}</td>
                  <td>{formatBgn(o.totalBgn)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
