import { getCurrentCustomer } from "@/lib/customer-auth";
import CheckoutForm from "@/components/CheckoutForm";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const customer = await getCurrentCustomer();

  return (
    <CheckoutForm
      initialCustomer={
        customer
          ? { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone }
          : null
      }
    />
  );
}
