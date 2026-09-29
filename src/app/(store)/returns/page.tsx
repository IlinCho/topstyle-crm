import { TRUST_CONFIG } from "@/lib/trust-config";

export const metadata = { title: "Връщане и замяна — TopStyle.bg" };

export default function ReturnsPage() {
  return (
    <div className="container" style={{ padding: "30px 0 60px", maxWidth: 760 }}>
      <h1 className="section-title" style={{ marginTop: 0 }}>Връщане и замяна</h1>

      <div className="card-box">
        <p style={{ lineHeight: 1.7, marginTop: 0 }}>
          Разполагаш с {TRUST_CONFIG.returnWindowDays} дни от получаването на пратката, за да я
          върнеш или замениш, ако размерът не е този, или артикулът не отговаря на очакванията ти.
        </p>
        <p style={{ lineHeight: 1.7 }}>
          Артикулът трябва да е в оригиналното си състояние, с поставени етикети, неносен извън
          преглед за размер. За да заявиш връщане или замяна, се свържи с нас на телефона в
          контактите — ще ти обясним следващите стъпки.
        </p>
      </div>
    </div>
  );
}
