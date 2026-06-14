const eur = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatEUR = (n: number | null | undefined): string => {
  if (n === null || n === undefined || Number.isNaN(n)) return eur.format(0);
  return eur.format(n);
};

export const round2 = (n: number): number => Math.round(n * 100) / 100;

export type LineItem = {
  quantity: number;
  unitPrice: number;
};

export const lineNet = (item: LineItem): number => round2(item.quantity * item.unitPrice);

export const totalsFromItems = (items: LineItem[], vatRate: number) => {
  const subtotal = round2(items.reduce((acc, i) => acc + lineNet(i), 0));
  const vatAmount = round2(subtotal * (vatRate / 100));
  const total = round2(subtotal + vatAmount);
  return { subtotal, vatAmount, total };
};
