import { getScarcity } from "@/lib/scarcity";

export default function ScarcityBadge({
  stock,
  style,
}: {
  stock: number;
  style?: React.CSSProperties;
}) {
  const s = getScarcity(stock);
  return (
    <p className={`scarcity-badge scarcity-badge--${s.tone}`} style={style}>
      <span aria-hidden>{s.icon}</span> {s.text}
    </p>
  );
}
