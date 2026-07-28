import Link from "next/link";
import { getSession } from "@/lib/auth";
import { logoutAction } from "../actions";

// Every admin page reads from the database (products, orders, sessions) -
// never prerender the admin section at build time.
export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">TopStyle Admin</div>
        <Link href="/admin">Табло</Link>
        <Link href="/admin/products">Продукти</Link>
        <Link href="/admin/categories">Категории</Link>
        <Link href="/admin/orders">Поръчки</Link>
        <Link href="/admin/stock-alerts">Известия за наличност</Link>
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
