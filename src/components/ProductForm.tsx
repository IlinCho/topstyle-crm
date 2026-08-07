"use client";

import { useState } from "react";
import { BADGE_DEFS } from "@/lib/badges";

type Category = { id: string; name: string; depth?: number };
type Variant = { size: string; color: string; stock: number };

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
    active?: boolean;
    badges?: string[];
    categoryRank?: number | null;
    variants?: Variant[];
  };
}) {
  const [variants, setVariants] = useState<Variant[]>(
    initial?.variants?.length ? initial.variants : [{ size: "S", color: "", stock: 0 }]
  );

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
  // order here = position in the DB.
  const [images, setImages] = useState<string[]>(
    initial?.images?.length ? initial.images : [""]
  );
  function addImageRow() {
    setImages((imgs) => [...imgs, ""]);
  }
  function removeImageRow(idx: number) {
    setImages((imgs) => imgs.filter((_, i) => i !== idx));
  }
  function updateImageRow(idx: number, value: string) {
    setImages((imgs) => imgs.map((url, i) => (i === idx ? value : url)));
  }

  return (
    <form action={action}>
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      <datalist id="material-options">
        {materialOptions.map((m) => <option key={m} value={m} />)}
      </datalist>
      <datalist id="color-options">
        {colorOptions.map((c) => <option key={c} value={c} />)}
      </datalist>

      <div className="card-box">
        <div className="form-grid">
          <div className="field">
            <label>Име на продукта</label>
            <input name="name" defaultValue={initial?.name} required />
          </div>
          <div className="field">
            <label>Категория</label>
            <select name="categoryId" defaultValue={initial?.categoryId} required>
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
          Постави линк (URL) към всяка снимка. Първата е основната — тя се показва в списъка с
          продукти и в категориите; следващите се виждат на самата продуктова страница.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {images.map((url, idx) => (
            <div key={idx} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span className="muted" style={{ fontSize: 12, width: 60, flexShrink: 0 }}>
                {idx === 0 ? "Основна" : `Снимка ${idx + 1}`}
              </span>
              <input
                name="imageUrl"
                value={url}
                onChange={(e) => updateImageRow(idx, e.target.value)}
                placeholder="https://..."
                style={{ flex: 1 }}
              />
              {images.length > 1 && (
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => removeImageRow(idx)}>✕</button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="card-box">
        <div className="flex-between" style={{ marginBottom: 10 }}>
          <strong>Размери и наличност</strong>
          <button type="button" className="btn btn--ghost btn--sm" onClick={addRow}>+ Добави размер</button>
        </div>
        <table className="variant-table">
          <thead>
            <tr>
              <th style={{ textAlign: "left", fontSize: 11.5, textTransform: "uppercase", color: "#6b7280" }}>Размер</th>
              <th style={{ textAlign: "left", fontSize: 11.5, textTransform: "uppercase", color: "#6b7280" }}>Цвят (вариант)</th>
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
                  <input name="variant_color" value={v.color} onChange={(e) => updateRow(idx, "color", e.target.value)} placeholder="черен" list="color-options" />
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
