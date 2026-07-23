export default function Footer() {
  const phone = process.env.NEXT_PUBLIC_STORE_PHONE || "0877 968 927";
  return (
    <footer className="site-footer">
      <div className="container">
        <p>
          <strong>TopStyle.bg</strong> — мъжка мода. Тел: {phone}
        </p>
        <p>© {new Date().getFullYear()} TopStyle.bg. Всички права запазени.</p>
      </div>
    </footer>
  );
}
