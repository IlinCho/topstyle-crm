import { db } from "@/lib/db";
import { categoryAndDescendantIds } from "@/lib/categories";
import { updateHomeTileAction } from "../../actions";

export const dynamic = "force-dynamic";

// Lets the admin manage the 3 homepage "Топ категории" tiles from one place:
// swap the photo (always displayed square via CSS - see .category-tile in
// globals.css - so any photo shape works, no manual cropping needed) and
// override the text shown on the tile without renaming the actual category
// (which would also change its menu label and URL).
export default async function AdminHomepagePage({
  searchParams,
}: {
  searchParams: { saved?: string };
}) {
  const categories = await db.category.findMany({ orderBy: { position: "asc" } });
  const topCategories = categories.filter((c) => !c.parentId).slice(0, 3);

  const sections = await Promise.all(
    topCategories.map(async (c) => {
      const categoryIds = categoryAndDescendantIds(c, categories);
      const firstProduct = await db.product.findFirst({
        where: { categoryId: { in: categoryIds }, active: true },
        include: { images: { orderBy: { position: "asc" }, take: 1 } },
        orderBy: { createdAt: "desc" },
      });
      const tileImage = c.imageUrl || firstProduct?.images[0]?.url || "";
      return { category: c, tileImage };
    })
  );

  return (
    <>
      <div className="admin-topbar">
        <h1 className="admin-h1">Начална страница</h1>
      </div>

      {searchParams.saved !== undefined && (
        <div className="card-box" style={{ background: "#e7f6ec", borderColor: "#bfe6cb" }}>
          Плочката е обновена.
        </div>
      )}

      {topCategories.length === 0 ? (
        <div className="card-box">
          <p className="muted" style={{ margin: 0 }}>
            Нямаш още основни категории — виж <a href="/admin/categories">Категории</a>.
          </p>
        </div>
      ) : (
        <>
          <div className="card-box">
            <h3 style={{ marginTop: 0 }}>Преглед — как изглежда в момента на сайта</h3>
            <div className="container" style={{ padding: 0 }}>
              <div className="category-tiles">
                {sections.map(({ category: c, tileImage }) => {
                  const tileTitle = c.homeTileTitle || c.name;
                  return (
                    <div key={c.id} className="category-tile">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={tileImage || "https://placehold.co/600x450/eeeeee/999999?text=TopStyle"}
                        alt={tileTitle}
                        className="category-tile__img"
                      />
                      <div className="category-tile__overlay">
                        <span className="category-tile__label">Категория</span>
                        <span className="category-tile__name">{tileTitle}</span>
                        <span className="category-tile__cta">Разгледай →</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="form-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
            {sections.map(({ category: c, tileImage }) => (
              <div key={c.id} className="card-box">
                <h3 style={{ marginTop: 0 }}>{c.name}</h3>
                <p className="muted" style={{ fontSize: 12, marginTop: -8 }}>
                  Реална категория (меню/URL) — не се променя тук.
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={tileImage || "https://placehold.co/600x450/eeeeee/999999?text=TopStyle"}
                  alt=""
                  style={{
                    width: 120,
                    aspectRatio: "1/1",
                    objectFit: "cover",
                    borderRadius: "var(--radius)",
                    display: "block",
                    marginBottom: 12,
                    background: "var(--bg-soft)",
                  }}
                />
                <form action={updateHomeTileAction} encType="multipart/form-data">
                  <input type="hidden" name="categoryId" value={c.id} />
                  <div className="field">
                    <label>Текст на плочката</label>
                    <input type="text" name="homeTileTitle" defaultValue={c.homeTileTitle} placeholder={c.name} />
                  </div>
                  <div className="field">
                    <label>Нова снимка (по избор — заменя текущата)</label>
                    <input type="file" name="tileImage" accept="image/*" />
                    <p className="muted" style={{ fontSize: 11.5, marginTop: 4 }}>
                      Показва се автоматично квадратна — качи каквато и снимка, тя ще се изреже центрирано.
                    </p>
                  </div>
                  <button type="submit" className="btn btn--sm">
                    Запази
                  </button>
                </form>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
