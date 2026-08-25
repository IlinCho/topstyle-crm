import Link from "next/link";
import { db } from "@/lib/db";
import { formatEur, formatDateTime } from "@/lib/format";
import { normalizeEmail, normalizePhone } from "@/lib/legacy-customers";

export const dynamic = "force-dynamic";

// Two very different "customer" tables live in this system: `Customer` is
// everyone who has actually placed an order or registered on the NEW site
// (created even for guest checkouts - see the model comment in schema.prisma),
// while `LegacyCustomer` is the raw reference list imported from the old
// PrestaShop store (email/phone/name only, used purely for lookup at order
// time). This page lets the admin browse+search both, as two tabs, instead
// of only ever seeing a bare count on the "Стари клиенти" import page.
const PAGE_SIZE = 50;

function buildHref(base: Record<string, string>) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(base)) {
    if (v) params.set(k, v);
  }
  const qs = params.toString();
  return `/admin/customers${qs ? `?${qs}` : ""}`;
}

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: { tab?: string; q?: string; page?: string };
}) {
  const tab = searchParams.tab === "legacy" ? "legacy" : "registered";
  const q = (searchParams.q || "").trim();
  const page = Math.max(1, parseInt(searchParams.page || "1", 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const [registeredTotal, legacyTotal] = await Promise.all([
    db.customer.count(),
    db.legacyCustomer.count(),
  ]);

  // Built separately per model (even though the shape is identical) so each
  // stays typed against its own Prisma WhereInput rather than one shared
  // object trying to satisfy both.
  const qDigits = q.replace(/\D/g, "");
  const legacyWhere = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { email: { contains: q.toLowerCase() } },
          ...(qDigits ? [{ phone: { contains: qDigits } }] : []),
        ],
      }
    : {};
  const customerWhere = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { email: { contains: q.toLowerCase() } },
          ...(qDigits ? [{ phone: { contains: qDigits } }] : []),
        ],
      }
    : {};

  const Tabs = (
    <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
      <Link
        href={buildHref({ tab: "registered" })}
        className={`btn btn--sm ${tab === "registered" ? "" : "btn--ghost"}`}
      >
        Клиенти на новия сайт ({registeredTotal})
      </Link>
      <Link
        href={buildHref({ tab: "legacy" })}
        className={`btn btn--sm ${tab === "legacy" ? "" : "btn--ghost"}`}
      >
        Стари клиенти — импорт ({legacyTotal})
      </Link>
    </div>
  );

  const SearchForm = (
    <form className="card-box" style={{ display: "flex", gap: 12 }}>
      <input type="hidden" name="tab" value={tab} />
      <input
        name="q"
        placeholder="Търси по име, имейл или телефон..."
        defaultValue={q}
        style={{ flex: 1, padding: 9, border: "1px solid #d7d7d7", borderRadius: 4 }}
      />
      <button className="btn btn--sm" type="submit">Търси</button>
      {q && (
        <Link href={buildHref({ tab })} className="btn btn--ghost btn--sm">Изчисти</Link>
      )}
    </form>
  );

  function Pagination({ totalPages }: { totalPages: number }) {
    if (totalPages <= 1) return null;
    return (
      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 14 }}>
        <Link
          href={buildHref({ tab, q, page: String(Math.max(1, page - 1)) })}
          className="btn btn--ghost btn--sm"
          aria-disabled={page <= 1}
          style={page <= 1 ? { pointerEvents: "none", opacity: 0.4 } : undefined}
        >
          ← Предишна
        </Link>
        <span className="muted" style={{ alignSelf: "center", fontSize: 13 }}>
          Страница {page} от {totalPages}
        </span>
        <Link
          href={buildHref({ tab, q, page: String(Math.min(totalPages, page + 1)) })}
          className="btn btn--ghost btn--sm"
          aria-disabled={page >= totalPages}
          style={page >= totalPages ? { pointerEvents: "none", opacity: 0.4 } : undefined}
        >
          Следваща →
        </Link>
      </div>
    );
  }

  if (tab === "legacy") {
    const [rows, total] = await Promise.all([
      db.legacyCustomer.findMany({ where: legacyWhere, orderBy: { createdAt: "desc" }, skip, take: PAGE_SIZE }),
      db.legacyCustomer.count({ where: legacyWhere }),
    ]);
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    return (
      <>
        <div className="admin-topbar">
          <h1 className="admin-h1">Клиенти</h1>
        </div>
        {Tabs}
        <p className="muted" style={{ fontSize: 13, marginTop: -6, marginBottom: 14 }}>
          Справочен списък, импортиран от стария магазин — виж <Link href="/admin/legacy-customers">Стари клиенти</Link>{" "}
          за добавяне на нови редове или преизчисляване на поръчки.
        </p>
        {SearchForm}
        <div className="card-box">
          <table className="admin-table">
            <thead>
              <tr><th>Име</th><th>Имейл</th><th>Телефон</th><th>Добавен на</th></tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td>{c.name || <span className="muted">—</span>}</td>
                  <td>{c.email || <span className="muted">—</span>}</td>
                  <td>{c.phone || <span className="muted">—</span>}</td>
                  <td className="muted">{formatDateTime(c.createdAt)}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={4} className="muted">{q ? "Няма съвпадения." : "Списъкът е празен."}</td></tr>
              )}
            </tbody>
          </table>
          <Pagination totalPages={totalPages} />
        </div>
      </>
    );
  }

  const [rows, total] = await Promise.all([
    db.customer.findMany({
      where: customerWhere,
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
      include: { _count: { select: { orders: true } } },
    }),
    db.customer.count({ where: customerWhere }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const emails = rows.map((c) => normalizeEmail(c.email)).filter(Boolean);
  const phones = rows.map((c) => normalizePhone(c.phone)).filter(Boolean);
  const legacyMatches =
    emails.length || phones.length
      ? await db.legacyCustomer.findMany({
          where: {
            OR: [
              ...(emails.length ? [{ email: { in: emails } }] : []),
              ...(phones.length ? [{ phone: { in: phones } }] : []),
            ],
          },
          select: { email: true, phone: true },
        })
      : [];
  const legacyEmailSet = new Set(legacyMatches.map((m) => m.email).filter(Boolean));
  const legacyPhoneSet = new Set(legacyMatches.map((m) => m.phone).filter(Boolean));

  // Total spent per customer, in one grouped query instead of N+1.
  const orderSums = rows.length
    ? await db.order.groupBy({
        by: ["customerId"],
        where: { customerId: { in: rows.map((c) => c.id) } },
        _sum: { totalEur: true },
      })
    : [];
  const sumByCustomer = new Map(orderSums.map((s) => [s.customerId, s._sum.totalEur || 0]));

  return (
    <>
      <div className="admin-topbar">
        <h1 className="admin-h1">Клиенти</h1>
      </div>
      {Tabs}
      {SearchForm}
      <div className="card-box">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Име</th><th>Имейл</th><th>Телефон</th><th>Град</th><th>Тип</th><th>Стар клиент</th><th>Поръчки</th><th>Общо похарчено</th><th>Регистриран на</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => {
              const isLegacy = legacyEmailSet.has(normalizeEmail(c.email)) || legacyPhoneSet.has(normalizePhone(c.phone));
              return (
                <tr key={c.id}>
                  <td>{c.name || <span className="muted">—</span>}</td>
                  <td>{c.email}</td>
                  <td>{c.phone || <span className="muted">—</span>}</td>
                  <td>{c.city || <span className="muted">—</span>}</td>
                  <td>
                    {c.passwordHash ? (
                      <span className="pill pill--ok">Регистриран</span>
                    ) : (
                      <span className="pill pill--muted">Гост</span>
                    )}
                  </td>
                  <td>
                    {isLegacy ? (
                      <span className="pill pill--info">🕐 Стар</span>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td>{c._count.orders}</td>
                  <td>{formatEur(sumByCustomer.get(c.id) || 0)}</td>
                  <td className="muted">{formatDateTime(c.createdAt)}</td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan={9} className="muted">{q ? "Няма съвпадения." : "Все още няма клиенти."}</td></tr>
            )}
          </tbody>
        </table>
        <Pagination totalPages={totalPages} />
      </div>
    </>
  );
}
