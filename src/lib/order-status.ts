// Shared status -> label/pill-color mapping, used by the admin dashboard,
// orders list, and order detail page - kept in one place so the three views
// never drift out of sync with each other.

export const STATUS_LABELS: Record<string, string> = {
  pending: "Нова",
  confirmed: "Потвърдена",
  shipped: "Изпратена",
  delivered: "Доставена",
  cancelled: "Отказана",
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] || status;
}

export function statusPillClass(status: string): string {
  switch (status) {
    case "pending":
      return "pill pill--warn";
    case "confirmed":
    case "shipped":
      return "pill pill--info";
    case "delivered":
      return "pill pill--ok";
    case "cancelled":
      return "pill pill--muted";
    default:
      return "pill pill--warn";
  }
}

export function isQuickOrder(deliveryMethod: string): boolean {
  return deliveryMethod === "quick_order";
}
