"use client";

import { useRef, useState } from "react";
import { BADGE_DEFS } from "@/lib/badges";

type Category = { id: string; name: string; depth?: number };
type Variant = { size: string; color: string; stock: number };

// Pre-filled for a brand-new product so the admin only has to type stock
// counts, not every size label by hand - they can still delete rows they
// don't carry. Jeans/trousers use EU waist numbers instead of letter sizes,
// so the category dropdown swaps between these two sets automatically (see
// handleCategoryChange below) - both lists are kept the same length (9) so
// swapping is a simple in-place value rewrite, no rows added/removed.
const DEFAULT_SIZES_LETTER = ["S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL", "6XL"];
const DEFAULT_SIZES_NUMERIC = ["44", "46", "48", "50", "52", "54", "56", "58", "60"];

function isPantsCategoryName(name?: string) {
  if (!name) return false;
  const n = name.toLowerCase();
  return n.includes("дънк") || n.includes("панталон");
}

function buildDefaultVariants(sizes: string[]): Variant[] {
  return sizes.map((size) => ({ size, color: "", stock: 0 }));
}

// Only safe to auto-swap sizes if nothing's been touched yet (all sizes
// still match one of the two known presets, no stock typed in) - otherwise
// we'd silently wipe out real data the admin already entered.
function matchesDefaultPreset(v: Variant[], sizes: string[]) {
  if (v.length !== sizes.length) return false;
  return v.every((row, i) => row.size === sizes[i] && row.stock === 0 && row.color === "");
}

export default function ProductForm({
  action,
  categories,
  initial,
  materialOptions = [],
  colorOptions = [],
}: {
  action: (formData: FormData) => void;
  categories: Category[];
  // Existing distinct material/color values across the catalog, offered as
  // <datalist> autocomplete so admins reuse "памук с еластант" instead of
  // typing near-duplicates ("Памук с еластант") that would fragment the
  // category-page filter facets into separate options.
  materialOptions?: string[];
  colorOptions?: string[];
  initial?: {
    id?: string;
    sku?: string;
    name?: string;
    categoryId?: string;
    priceEur?: number;
    priceBgn?: number;
    material?: string;
    color?: string;
    description?: string;
    images?: string[];
    sizeChartUrl?: string;
    sizeChartNote?: string;
    active?: boolean;
    badges?: string[];
    categoryRank?: number | null;
    variants?: Variant[];
  };
}) {
  const initialCategoryName = categories.find((c) => c.id === initial?.categoryId)?.name;
  const [variants, setVariants] = useState<Variant[]>(
    initial?.variants?.length
      ? initial.variants
      : buildDefaultVariants(isPantsCategoryName(initialCategoryName) ? DEFAULT_SIZES_NUMERIC : DEFAULT_SIZES_LETTER)
  );

  // Swaps the size column between letters and EU pants numbers when the
  // admin picks a category - only for a brand-new product, and only while
  // the rows are still untouched defaults, so it never clobbers real data.
  function handleCategoryChange(categoryId: string) {
    if (initial?.id) return;
    const name = categories.find((c) => c.id === categoryId)?.name;
    const targetSizes = isPantsCategoryName(name) ? DEFAULT_SIZES_NUMERIC : DEFAULT_SIZES_LETTER;
    setVariants((v) => {
      if (matchesDefaultPreset(v, DEFAULT_SIZES_LETTER) || matchesDefaultPreset(v, DEFAULT_SIZES_NUMERIC)) {
        return buildDefaultVariants(targetSizes);
      }
      return v;
    });
  }

  function addRow() {
    setVariants((v) => [...v, { size: "", color: "", stock: 0 }]);
  }
  function removeRow(idx: number) {
    setVariants((v) => v.filter((_, i) => i !== idx));
  }
  function updateRow(idx: number, field: keyof Variant, value: string) {
    setVariants((v) =>
      v.map((row, i) => (i === idx ? { ...row, [field]: field === "stock" ? Number(value) || 0 : value } : row))
    );
  }

  // Images: repeatable URL fields, same pattern as the variants table above.
  // The first row is always the "main" photo shown on cards/category pages -
  // order here = position in the DB. `preview` is a local object URL for a
  // just-picked file, shown as a thumbnail immediately (before the real
  // upload/save happens) so the admin can see which photo they attached
  // instead of just a filename in the file picker.
  type ImageRow = { url: string; preview: string | null };
  const [images, setImages] = useState<ImageRow[]>(
    initial?.images?.length ? initial.images.map((url) => ({ url, preview: null })) : [{ url: "", preview: null }]
  );
  function addImageRow() {
    setImages((imgs) => [...imgs, { url: "", preview: null }]);
  }
  function removeImageRow(idx: number) {
    setImages((imgs) => imgs.filter((_, i) => i !== idx));
  }
  function updateImageUrl(idx: number, value: string) {
    setImages((imgs) => imgs.map((row, i) => (i === idx ? { ...row, url: value } : row)));
  }
  function updateImageFile(idx: number, file: File | null) {
    setImages((imgs) =>
      imgs.map((row, i) => {
        if (i !== idx) return row;
        if (row.preview) URL.revokeObjectURL(row.preview);
        return { ...row, preview: file ? URL.createObjectURL(file) : null };
      })
    );
  }

  // Size chart: a single optional image shown to customers on the product
  // page inside the existing "Как да избера размер?" toggle. Same
  // url-or-file pattern as the photos above, just a single row.
  const [sizeChartUrl, setSizeChartUrl] = useState(initial?.sizeChartUrl || "");
  const [sizeChartPreview, setSizeChartPreview] = useState<string | null>(null);
  function updateSizeChartFile(file: File | null) {
    setSizeChartPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
  }

  // "Преглед" - a client-only mockup of the product page built from whatever
  // is currently typed into the form, WITHOUT saving anything. Inputs below
  // are uncontrolled (defaultValue), so this reads a snapshot straight from
  // the DOM via FormData at the moment the button is clicked, rather than
  // requiring every field to become a controlled input just for this.
  const formRef = useRef<HTMLFormElement>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSnapshot, setPreviewSnapshot] = useState({
    name: "",
    categoryId: "",
    priceEur: "",
    priceBgn: "",
    material: "",
    color: "",
    description: "",
    badges: [] as string[],
  });

  function openPreview() {
    if (!formRef.current) return;
    const fd = new FormData(formRef.current);
    setPreviewSnapshot({
      name: String(fd.get("name") || ""),
      categoryId: String(fd.get("categoryId") || ""),
      priceEur: String(fd.get("priceEur") || ""),
      priceBgn: String(fd.get("priceBgn") || ""),
      material: String(fd.get("material") || ""),
      color: String(fd.get("color") || ""),
      description: String(fd.get("description") || ""),
      badges: fd.getAll("badge") as string[],
    });
    setPreviewOpen(true);
  }

  const previewCategoryName = categories.find((c) => c.id === previewSnapshot.categoryId)?.name;
  const previewMainImage = images[0]?.preview || images[0]?.url || "";
  const previewSizes = variants.filter((v) => v.size.trim());

  return (
    <form ref={formRef} action={action}>
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      <datalist id="material-options">
        {materialOptions.map((m) => <option key={m} value={m} />)}
      </datalist>
      <datalist id="color-options">
        {colorOptions.map((c) => <option key={c} value={c} />)}
      </datalist>

      <div className="flex-between" style={{ marginBottom: 14 }}>
        <span className="muted" style={{ fontSize: 12.5 }}>Прегледай как ще изглежда в магазина, преди да запазиш</span>
        <button type="button" className="btn btn--ghost btn--sm" onClick={openPreview}>👁 Преглед на продукта</button>
      </div>

      {previewOpen && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={() => setPreviewOpen(false)}
        >
          <div
            className="card-box"
            style={{ maxWidth: 900, width: "100%", maxHeight: "90vh", overflowY: "auto", background: "#fff" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-between" style={{ marginBottom: 16 }}>
              <strong>Преглед — още не е запазено</strong>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setPreviewOpen(false)}>✕ Затвори</button>
            </div>
            <div className="pdp" style={{ margin: 0 }}>
              <div className="pdp__img-wrap">
                {previewMainImage ? (
                  <img src={previewMainImage} alt="" className="pdp__img" />
                ) : (
                  <div className="pdp__img" style={{ background: "#f2f2f2" }} />
                )}
              </div>
              <div>
                {previewSnapshot.badges.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    {previewSnapshot.badges.map((key) => {
                      const def = BADGE_DEFS.find((d) => d.key === key);
                      return def ? (
                        <span key={key} className={`badge ${def.className}`} style={{ marginRight: 6 }}>{def.label}</span>
                      ) : null;
                    })}
                  </div>
                )}
                {previewCategoryName && <p className="muted" style={{ fontSize: 12.5, margin: "0 0 4px" }}>{previewCategoryName}</p>}
                <h1 className="pdp__title">{previewSnapshot.name || "(без име)"}</h1>
                <p className="pdp__price">
                  {previewSnapshot.priceBgn ? `${previewSnapshot.priceBgn} лв.` : "—"}
                  {previewSnapshot.priceEur && <small>{previewSnapshot.priceEur} €</small>}
                </p>
                <div className="pdp__meta">
                  <div>Материя: {previewSnapshot.material || "—"}</div>
                  <div>Цвят: {previewSnapshot.color || "—"}</div>
                </div>
                {previewSizes.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <p className="opt-label">Размери</p>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {previewSizes.map((v, i) => (
                        <span key={i} className={`opt${v.stock <= 0 ? " disabled" : ""}`}>{v.size}</span>
                      ))}
                    </div>
                  </div>
                )}
                {previewSnapshot.description && (
                  <p style={{ marginTop: 16, fontSize: 13.5, lineHeight: 1.6 }}>{previewSnapshot.description}</p>
                )}
              </div>
            </div>
            <p className="muted" style={{ fontSize: 12, marginTop: 16 }}>
              Приблизителен преглед на текущо въведените данни — продуктът все още не е запазен. Затвори и натисни "Запази продукта", когато си готов.
            </p>
          </div>
        </div>
      )}

      <div className="card-box">
        <div className="form-grid">
          <div className="field">
            <label>Име на продукта</label>
            <input name="name" defaultValue={initial?.name} required />
          </div>
          <div className="field">
            <label>Категория</label>
            <select name="categoryId" defaultValue={initial?.categoryId} onChange={(e) => handleCategoryChange(e.target.value)} required>
              <option value="">Избери...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.depth ? "  ".repeat(c.depth) + "↳ " : ""}
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Цена (EUR)</label>
            <input name="priceEur" type="number" step="0.01" defaultValue={initial?.priceEur} required />
          </div>
          <div className="field">
            <label>Цена (BGN)</label>
            <input name="priceBgn" type="number" step="0.01" defaultValue={initial?.priceBgn} required />
          </div>
          <div className="field">
            <label>Цвят</label>
            <input name="color" defaultValue={initial?.color} list="color-options" />
          </div>
          <div className="field">
            <label>Материя (състав)</label>
            <input name="material" defaultValue={initial?.material} list="material-options" />
          </div>
          {!initial?.id && (
            <div className="field">
              <label>SKU / артикулен номер (по избор)</label>
              <input name="sku" placeholder="автоматично, ако е празно" />
            </div>
          )}
          <div className="field">
            <label>Позиция в категорията (1-8, по избор)</label>
            <input
              name="categoryRank"
              type="number"
              min={1}
              max={8}
              defaultValue={initial?.categoryRank ?? ""}
              placeholder="напр. 1 = първи в категорията"
            />
          </div>
        </div>
        <p className="muted" style={{ fontSize: 12.5, marginTop: -8, marginBottom: 12 }}>
          Продукти с позиция (1-8) излизат най-отпред в страницата на категорията си, в реда на
          позициите. Остави празно, за да се показва по обичайния ред (най-новите първи).
        </p>

        <div className="field">
          <label>Описание</label>
          <textarea name="description" defaultValue={initial?.description} />
        </div>

        {initial?.id && (
          <div className="field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <input type="checkbox" name="active" defaultChecked={initial?.active ?? true} id="active" style={{ width: "auto" }} />
            <label htmlFor="active" style={{ marginBottom: 0 }}>Активен (видим в магазина)</label>
          </div>
        )}
        <div className="field">
          <label>Баджове (показват се на продукта в магазина — маркирай ръчно, само за реални случаи)</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {BADGE_DEFS.map((b) => (
              <div key={b.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  name="badge"
                  value={b.key}
                  defaultChecked={initial?.badges?.includes(b.key) ?? false}
                  id={`badge_${b.key}`}
                  style={{ width: "auto" }}
                />
                <label htmlFor={`badge_${b.key}`} style={{ marginBottom: 0, fontWeight: 400 }}>{b.label}</label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card-box">
        <div className="flex-between" style={{ marginBottom: 10 }}>
          <strong>Снимки</strong>
          <button type="button" className="btn btn--ghost btn--sm" onClick={addImageRow}>+ Добави снимка</button>
        </div>
        <p className="muted" style={{ fontSize: 12.5, marginTop: -6, marginBottom: 10 }}>
          Качи файл от компютъра или постави линк (URL) към всяка снимка — ако избереш файл, той се
          качва и има предимство пред линка на същия ред. Първата е основната — тя се показва в
          списъка с продукти и в категориите; следващите се виждат на самата продуктова страница.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {images.map((row, idx) => {
            const thumbSrc = row.preview || row.url;
            return (
              <div key={idx} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <span className="muted" style={{ fontSize: 12, width: 60, flexShrink: 0 }}>
                  {idx === 0 ? "Основна" : `Снимка ${idx + 1}`}
                </span>
                {thumbSrc ? (
                  <img
                    src={thumbSrc}
                    alt=""
                    style={{ width: 44, height: 55, objectFit: "cover", borderRadius: 4, background: "#f2f2f2", flexShrink: 0 }}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = "hidden"; }}
                  />
                ) : (
                  <div style={{ width: 44, height: 55, borderRadius: 4, background: "#f2f2f2", flexShrink: 0 }} />
                )}
                <input
                  name="imageUrl"
                  value={row.url}
                  onChange={(e) => updateImageUrl(idx, e.target.value)}
                  placeholder="https://... (по избор, ако не качваш файл)"
                  style={{ flex: 1, minWidth: 160 }}
                />
                <input
                  type="file"
                  name="imageFile"
                  accept="image/*"
                  style={{ flex: 1, minWidth: 160, fontSize: 12.5 }}
                  onChange={(e) => updateImageFile(idx, e.target.files?.[0] || null)}
                />
                {images.length > 1 && (
                  <button type="button" className="btn btn--ghost btn--sm" onClick={() => removeImageRow(idx)}>✕</button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="card-box">
        <div className="flex-between" style={{ marginBottom: 10 }}>
          <strong>Таблица за размери</strong>
        </div>
        <p className="muted" style={{ fontSize: 12.5, marginTop: -6, marginBottom: 10 }}>
          По избор — снимка на таблица с мерки за този продукт. Показва се на клиента на
          продуктовата страница, при клик върху "Как да избера размер?". Ако не качиш нищо,
          там ще се показва общият текст със съвети.
        </p>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {(sizeChartPreview || sizeChartUrl) ? (
            <img
              src={sizeChartPreview || sizeChartUrl}
              alt=""
              style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 4, background: "#f2f2f2", flexShrink: 0 }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = "hidden"; }}
            />
          ) : (
            <div style={{ width: 60, height: 60, borderRadius: 4, background: "#f2f2f2", flexShrink: 0 }} />
          )}
          <input
            name="sizeChartUrl"
            value={sizeChartUrl}
            onChange={(e) => setSizeChartUrl(e.target.value)}
            placeholder="https://... (по избор, ако не качваш файл)"
            style={{ flex: 1, minWidth: 160 }}
          />
          <input
            type="file"
            name="sizeChartFile"
            accept="image/*"
            style={{ flex: 1, minWidth: 160, fontSize: 12.5 }}
            onChange={(e) => updateSizeChartFile(e.target.files?.[0] || null)}
          />
        </div>
        <div className="field" style={{ marginTop: 12 }}>
          <label>Текст с указания за размера (по избор)</label>
          <textarea
            name="sizeChartNote"
            defaultValue={initial?.sizeChartNote}
            placeholder="напр. Този модел пасва по-плътно — препоръчваме да вземете един размер по-голям."
            rows={3}
          />
          <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
            Показва се над таблицата за размери (ако има качена снимка), при клик върху
            "Как да избера размер?". Различен е за всеки продукт.
          </p>
        </div>
      </div>

      <div className="card-box">
        <div className="flex-between" style={{ marginBottom: 10 }}>
          <strong>Размери и наличност</strong>
          <button type="button" className="btn btn--ghost btn--sm" onClick={addRow}>+ Добави размер</button>
        </div>
        <p className="muted" style={{ fontSize: 12.5, marginTop: -6, marginBottom: 10 }}>
          Цветът се задава веднъж, горе в "Цвят" на продукта — всички размери тук го наследяват
          автоматично (в тази база всеки продукт е с един цвят; различните цветове на един и същ
          артикул се въвеждат като отделни продукти).
        </p>
        <table className="variant-table">
          <thead>
            <tr>
              <th style={{ textAlign: "left", fontSize: 11.5, textTransform: "uppercase", color: "#6b7280" }}>Размер</th>
              <th style={{ textAlign: "left", fontSize: 11.5, textTransform: "uppercase", color: "#6b7280" }}>Наличност</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {variants.map((v, idx) => (
              <tr key={idx}>
                <td>
                  <input name="variant_size" value={v.size} onChange={(e) => updateRow(idx, "size", e.target.value)} placeholder="S / M / 42..." />
                </td>
                <td>
                  <input name="variant_stock" type="number" min={0} value={v.stock} onChange={(e) => updateRow(idx, "stock", e.target.value)} />
                </td>
                <td>
                  <button type="button" className="btn btn--ghost btn--sm" onClick={() => removeRow(idx)}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button className="btn" type="submit">Запази продукта</button>
    </form>
  );
}
