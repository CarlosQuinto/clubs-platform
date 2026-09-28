export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(value);

export const isPlayerPayment = (id: string): boolean => id.startsWith("pago-");
