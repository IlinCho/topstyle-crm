import { TRUST_CONFIG } from "@/lib/trust-config";

export default function ReturnsPage() {
  return (
    <div className="container">
      <h1 className="section-title" style={{ marginTop: 20 }}>Връщане и замяна</h1>
      <div className="card-box mt-24" style={{ maxWidth: 640 }}>
        <p>Имаш право на връщане или замяна до {TRUST_CONFIG.returnWindowDays} дни от получаването на поръчката.</p>
        <p>Продуктът трябва да е в оригиналното си състояние, с поставени етикети, неносен и неизпран.</p>
        <p>За да заявиш връщане или замяна, свържи се с нас на телефона в контактите.</p>
      </div>
    </div>
  );
}
