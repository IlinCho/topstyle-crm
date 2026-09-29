export const metadata = { title: "Доставка и плащане — TopStyle.bg" };

export default function DeliveryPaymentPage() {
  return (
    <div className="container" style={{ padding: "30px 0 60px", maxWidth: 760 }}>
      <h1 className="section-title" style={{ marginTop: 0 }}>Доставка и плащане</h1>

      <div className="card-box">
        <h2 style={{ marginTop: 0, fontSize: 16 }}>Доставка</h2>
        <p style={{ lineHeight: 1.7 }}>
          Изпращаме поръчките с куриер Еконт (до офис) или Спиди (до адрес), обикновено в рамките
          на 24 часа след потвърждение на поръчката. При получаване имаш възможност да прегледаш и
          тестваш артикула преди да платиш.
        </p>
      </div>

      <div className="card-box" style={{ marginTop: 16 }}>
        <h2 style={{ marginTop: 0, fontSize: 16 }}>Начини на плащане</h2>
        <p style={{ lineHeight: 1.7 }}>
          Наложен платеж (плащане в брой на куриера при получаване) или карта на ПОС терминала на
          куриера при доставка. Не се изисква плащане онлайн предварително.
        </p>
      </div>
    </div>
  );
}
