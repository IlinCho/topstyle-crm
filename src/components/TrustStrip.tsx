import { TRUST_CONFIG } from "@/lib/trust-config";

type Variant = "product" | "cart" | "checkout";

const ITEMS: Record<Variant, string[]> = {
  product: [
    "Плащане при доставка",
    "Прегледай преди да платиш",
    "Лесна замяна",
    `Връщане до ${TRUST_CONFIG.returnWindowDays} дни`,
  ],
  cart: [
    "Наложен платеж",
    "Лесна замяна и връщане",
    "Бърза доставка с Еконт / Спиди",
  ],
  checkout: [
    "Преглед и тест",
    "Лесна замяна",
    `Сигурно връщане до ${TRUST_CONFIG.returnWindowDays} дни`,
    "Доставка до 24 часа",
  ],
};

export default function TrustStrip({ variant = "product" }: { variant?: Variant }) {
  const items = ITEMS[variant];
  return (
    <ul className="trust-strip">
      {items.map((item) => (
        <li key={item}>
          <span className="trust-strip__check">✓</span>
          {item}
        </li>
      ))}
    </ul>
  );
}
