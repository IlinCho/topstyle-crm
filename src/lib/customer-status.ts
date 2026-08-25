// Single, prioritized "customer status" label for an order - collapses the
// three separate signals (registered account, PrestaShop-migration legacy
// match, repeat-in-new-system match) into ONE field for compact display
// (e.g. the main admin dashboard's recent-orders table), where showing 3
// separate pills per row is too much. The full breakdown (all 3 signals as
// separate columns) still lives on the Orders list/detail pages - this is
// just a simplified summary.
//
// Priority: having an actual account is the most specific/actionable fact,
// so it wins even if the customer also happens to be old/new. Otherwise,
// "Стар клиент" covers BOTH kinds of "we've seen this person before" - a
// match against the imported PrestaShop customer list (old store), OR
// simply having placed an earlier order in this system since launch
// (repeat). "Нов клиент" is left only for someone who matches neither -
// genuinely first contact, no data on them anywhere.
export type CustomerStatus = "registered" | "old" | "new";

export function getCustomerStatus(params: {
  isLegacy: boolean;
  isRepeat: boolean;
  hasAccount: boolean;
}): CustomerStatus {
  if (params.hasAccount) return "registered";
  if (params.isLegacy || params.isRepeat) return "old";
  return "new";
}

export function customerStatusLabel(status: CustomerStatus): string {
  if (status === "registered") return "Регистриран";
  if (status === "old") return "Стар клиент";
  return "Нов клиент";
}

export function customerStatusIcon(status: CustomerStatus): string {
  if (status === "registered") return "";
  if (status === "old") return "🕐 ";
  return "✨ ";
}

export function customerStatusPillClass(status: CustomerStatus): string {
  if (status === "old") return "pill pill--info";
  return "pill pill--ok";
}
