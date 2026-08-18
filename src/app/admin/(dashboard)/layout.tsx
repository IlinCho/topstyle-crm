import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { logoutAction } from "../actions";

// Every admin page reads from the database (products, orders, sessions) -
// never prerender the admin section at build time.
export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  // This layout wraps every page under admin/(dashboard) - without this
  // check, product/order/customer data was reachable by anyone who knew or
  // guessed the URL, with no login required at all.
  if (!session) {
    redirect("/admin/login");
  }

  // Notification bell count - "seen" is set to true the moment an admin
  // opens that specific order's detail page (see orders/[id]/page.tsx), so
  // this naturally drops to 0 as orders get looked at, same as any other
  // notification bell.
  const unseenOrderCount = await db.order.count({ where: { seenByAdmin: false } });
  const abandonedCount = await db.abandonedCheckout.count();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">TopStyle Admin</div>
        <Link href="/admin">Табло</Link>
        <Link href="/admin/products">Продукти</Link>
        <Link href="/admin/categories">Категории</Link>
        <Link href="/admin/orders" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          Поръчки
          {unseenOrderCount > 0 && (
            <span
              title={`${unseenOrderCount} нови поръчки`}
              style={{
                background: "#e5484d",
                color: "#fff",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 700,
                padding: "1px 7px",
                lineHeight: 1.5,
              }}
            >
              🔔 {unseenOrderCount}
            </span>
          )}
        </Link>
        <Link href="/admin/stock-alerts">Известия за наличност</Link>
        <Link href="/admin/legacy-customers">Стари клиенти</Link>
        <Link href="/admin/abandoned" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          Изоставени поръчки
          {abandonedCount > 0 && (
            <span
              title={`${abandonedCount} изоставени поръчки`}
              style={{
                background: "#f5a623",
                color: "#fff",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 700,
                padding: "1px 7px",
                lineHeight: 1.5,
              }}
            >
              {abandonedCount}
            </span>
          )}
        </Link>
        <Link href="/" target="_blank">↗ Виж магазина</Link>
        <form action={logoutAction} style={{ marginTop: 20, padding: "0 20px" }}>
          <button className="btn btn--sm" style={{ width: "100%", background: "#333", borderColor: "#333" }}>
            Изход ({session?.email})
          </button>
        </form>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
