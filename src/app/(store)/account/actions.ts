"use server";

import { redirect } from "next/navigation";
import {
  createCustomerSession,
  clearCustomerSession,
  verifyCustomerCredentials,
  registerCustomer,
} from "@/lib/customer-auth";

function safeNext(next: string | null | undefined) {
  // Only allow redirecting to a relative in-site path - never an external URL.
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return "/account";
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const remember = formData.get("remember") === "on";
  const next = safeNext(String(formData.get("next") || ""));

  const customer = await verifyCustomerCredentials(email, password);
  if (!customer) {
    redirect(`/account/login?error=1&next=${encodeURIComponent(next)}`);
  }
  await createCustomerSession(customer.id, customer.email, remember);
  redirect(next);
}

export async function registerAction(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const phone = String(formData.get("phone") || "").trim();
  const next = safeNext(String(formData.get("next") || ""));

  if (!name || !email || password.length < 6) {
    redirect(`/account/register?error=1&next=${encodeURIComponent(next)}`);
  }

  const customer = await registerCustomer({ name, email, password, phone });
  if (!customer) {
    redirect(`/account/register?error=exists&next=${encodeURIComponent(next)}`);
  }
  await createCustomerSession(customer.id, customer.email, true);
  redirect(next);
}

export async function logoutAction() {
  clearCustomerSession();
  redirect("/");
}
