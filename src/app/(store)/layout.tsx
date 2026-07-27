import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Header reads categories from the database on every request - never
// prerender this layout (or any page under it) at build time.
export const dynamic = "force-dynamic";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="storefront">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
