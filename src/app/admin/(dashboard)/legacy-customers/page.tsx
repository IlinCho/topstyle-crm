import { db } from "@/lib/db";
import { importLegacyCustomersAction, deleteAllLegacyCustomersAction, recalcLegacyOrdersAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function LegacyCustomersPage() {
  const count = await db.legacyCustomer.count();
  const legacyOrderCount = await db.order.count({ where: { isLegacy: true } });

  return (
    <>
      <div className="admin-topbar">
        <h1 className="admin-h1">Стари клиенти</h1>
      </div>

      <div className="card-box">
        <p style={{ marginTop: 0 }}>
          Списък с клиенти, които вече са пазарували от стария магазин (PrestaShop), преди този сайт.
          При всяка нова поръчка имейлът/телефонът на клиента се сравнява с този списък — ако съвпадне,
          поръчката се маркира като <strong>„Стар клиент"</strong> в Поръчки, иначе е <strong>„Нов клиент"</strong>.
        </p>
        <p className="muted" style={{ fontSize: 13 }}>
          В момента в списъка има <strong>{count}</strong> стари клиента. Общо <strong>{legacyOrderCount}</strong> поръчки
          в системата в момента са маркирани като от стари клиенти.
        </p>
      </div>

      <div className="card-box">
        <h3 style={{ marginTop: 0 }}>Добави стари клиенти (CSV)</h3>
        <p className="muted" style={{ fontSize: 12.5, marginTop: -6, marginBottom: 10 }}>
          Как да вземеш списъка: в стария PrestaShop админ панел отиди на Customers (Клиенти) → Export,
          или помоли хостинг доставчика за SQL export на таблицата <code>ps_customer</code>. После постави
          редовете тук — по един клиент на ред, стойностите разделени със запетая: <strong>имейл, телефон, име</strong>.
          Телефонът и името са по избор, но поне едно от имейл/телефон трябва да е попълнено на всеки ред.
        </p>
        <form action={importLegacyCustomersAction}>
          <div className="field">
            <textarea
              name="legacyCsv"
              rows={10}
              placeholder={"ivan@example.com, 0888123456, Иван Иванов\nmaria@example.com, , Мария Петрова\n, 0899112233, Георги Georgiev"}
            />
          </div>
          <button type="submit" className="btn btn--sm">Импортирай</button>
        </form>
      </div>

      <div className="card-box">
        <h3 style={{ marginTop: 0 }}>Преизчисли съществуващи поръчки</h3>
        <p className="muted" style={{ fontSize: 12.5, marginTop: -6, marginBottom: 10 }}>
          Поръчки, направени преди да добавиш даден стар клиент в списъка по-горе, не се преоценяват
          автоматично. Натисни бутона, за да провериш всички досегашни поръчки още веднъж спрямо
          текущия списък и да отбележиш съвпаденията като „Стар клиент".
        </p>
        <form action={recalcLegacyOrdersAction}>
          <button type="submit" className="btn btn--ghost btn--sm">Преизчисли поръчките</button>
        </form>
      </div>

      {count > 0 && (
        <div className="card-box">
          <h3 style={{ marginTop: 0 }}>Изчисти списъка</h3>
          <p className="muted" style={{ fontSize: 12.5, marginTop: -6, marginBottom: 10 }}>
            Изтрива целия списък със стари клиенти (не пипа поръчки или клиенти — само справочния списък по-горе).
          </p>
          <form action={deleteAllLegacyCustomersAction}>
            <button type="submit" className="btn btn--danger btn--sm">Изтрий целия списък</button>
          </form>
        </div>
      )}
    </>
  );
}
