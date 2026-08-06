import { TRUST_CONFIG } from "@/lib/trust-config";

export default function DeliveryPage() {
  return (
    <div className="container">
      <h1 className="section-title" style={{ marginTop: 20 }}>Доставка и плащане</h1>
      <div className="card-box mt-24" style={{ maxWidth: 640 }}>
        <p>Доставяме до посочен адрес или до офис на куриер в цялата страна.</p>
        {TRUST_CONFIG.sameDayCutoffTime && (
          <p>Поръчки направени до {TRUST_CONFIG.sameDayCutoffTime} ч. се обработват и изпращат същия ден.</p>
        )}
        <p>Плащане при доставка (наложен платеж) — плащате в брой на куриера при получаване.</p>
        <p>Можеш да прегледаш и пробваш продукта преди да платиш.</p>
      </div>
    </div>
  );
}
