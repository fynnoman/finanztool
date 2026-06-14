import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { ReactElement } from "react";

// ── Types coming from our data layer ──
export type PdfDoc = {
  kind: "QUOTE" | "INVOICE";
  // Document
  number: string;
  date: Date;
  dueDate?: Date | null;
  validUntil?: Date | null;
  title: string;            // e.g. "Rechnung" or "Angebot" or "Abschlagsrechnung"
  notes?: string;
  // Company
  business: {
    name: string;
    address: string;
    email: string;
    phone: string;
    taxId: string;
    taxNumber: string;
    iban: string;
    bic: string;
    bankName: string;
    logoDataUrl?: string | null;
    footer: string;
  };
  // Customer
  customer: {
    name: string;
    company: string;
    address: string;
    taxId: string;
  };
  // Items
  items: { details: string; quantity: number; unitPrice: number }[];
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  // For Schluss-Rechnung: previous Abschläge that were deducted
  abschlaege?: { number: string; amount: number }[];
};

const eur = (n: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n);
const fmt = (d: Date | null | undefined) =>
  d ? new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

const s = StyleSheet.create({
  page: { padding: 48, fontFamily: "Helvetica", fontSize: 9, color: "#1A2230" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 28 },
  brand: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { width: 44, height: 44 },
  brandName: { fontSize: 14, fontWeight: 700, color: "#0B0F14" },
  brandSub: { fontSize: 8, color: "#5A6675", marginTop: 2 },
  meta: { textAlign: "right", fontSize: 8, color: "#5A6675", lineHeight: 1.6 },
  addressBlock: { flexDirection: "row", justifyContent: "space-between", marginBottom: 26 },
  addressCol: { width: "48%" },
  small: { fontSize: 8, color: "#8E97A4", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
  addressText: { fontSize: 9.5, lineHeight: 1.55, color: "#1A2230" },
  title: { fontSize: 22, fontWeight: 700, color: "#0B0F14", marginBottom: 4, marginTop: 6 },
  subtitle: { fontSize: 9, color: "#5A6675", marginBottom: 16 },
  detailRow: { flexDirection: "row", marginBottom: 16, justifyContent: "space-between" },
  detailCell: { width: "30%" },
  detailLabel: { fontSize: 7.5, color: "#8E97A4", textTransform: "uppercase", letterSpacing: 1 },
  detailValue: { fontSize: 9.5, marginTop: 2 },
  table: { marginTop: 8, borderTop: "1pt solid #E6EAF0" },
  tableHeader: { flexDirection: "row", paddingVertical: 8, fontSize: 8, color: "#8E97A4", textTransform: "uppercase", letterSpacing: 1, borderBottom: "1pt solid #E6EAF0" },
  tableRow: { flexDirection: "row", paddingVertical: 8, borderBottom: "0.5pt solid #E6EAF0" },
  col1: { width: "55%", paddingRight: 8 },
  col2: { width: "10%", textAlign: "right" },
  col3: { width: "17%", textAlign: "right" },
  col4: { width: "18%", textAlign: "right" },
  totals: { marginTop: 12, alignSelf: "flex-end", width: "45%" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  totalLabel: { color: "#5A6675" },
  totalValue: { color: "#1A2230" },
  grandRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, marginTop: 4, borderTop: "1pt solid #1A2230" },
  grandLabel: { fontSize: 10, fontWeight: 700 },
  grandValue: { fontSize: 12, fontWeight: 700 },
  notes: { marginTop: 28, padding: 12, backgroundColor: "#F4F6F9", fontSize: 9, lineHeight: 1.5, color: "#5A6675" },
  bank: { marginTop: 24, fontSize: 8.5, color: "#5A6675", lineHeight: 1.55 },
  footer: { position: "absolute", bottom: 28, left: 48, right: 48, textAlign: "center", fontSize: 7.5, color: "#8E97A4", borderTop: "0.5pt solid #E6EAF0", paddingTop: 8 },
});

export function InvoicePdfDocument(props: PdfDoc): ReactElement {
  const isInvoice = props.kind === "INVOICE";
  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.brand}>
            {props.business.logoDataUrl && <Image src={props.business.logoDataUrl} style={s.logo} />}
            <View>
              <Text style={s.brandName}>{props.business.name}</Text>
              <Text style={s.brandSub}>{props.business.address.split("\n")[0] || ""}</Text>
            </View>
          </View>
          <View style={s.meta}>
            <Text>{props.business.email}</Text>
            <Text>{props.business.phone}</Text>
            {props.business.taxId && <Text>USt-ID: {props.business.taxId}</Text>}
            {props.business.taxNumber && <Text>St-Nr: {props.business.taxNumber}</Text>}
          </View>
        </View>

        {/* Addresses */}
        <View style={s.addressBlock}>
          <View style={s.addressCol}>
            <Text style={s.small}>Empfänger</Text>
            <Text style={s.addressText}>{props.customer.name}</Text>
            {props.customer.company ? <Text style={s.addressText}>{props.customer.company}</Text> : null}
            {props.customer.address.split("\n").map((line, i) => (
              <Text key={i} style={s.addressText}>{line}</Text>
            ))}
            {props.customer.taxId ? <Text style={s.addressText}>USt-ID: {props.customer.taxId}</Text> : null}
          </View>
          <View style={s.addressCol}>
            <Text style={s.small}>Absender</Text>
            <Text style={s.addressText}>{props.business.name}</Text>
            {props.business.address.split("\n").map((line, i) => (
              <Text key={i} style={s.addressText}>{line}</Text>
            ))}
          </View>
        </View>

        {/* Title + metadata */}
        <Text style={s.title}>{props.title} {props.number}</Text>
        <Text style={s.subtitle}>
          {isInvoice ? `Rechnungsdatum: ${fmt(props.date)}` : `Angebotsdatum: ${fmt(props.date)}`}
        </Text>

        <View style={s.detailRow}>
          <View style={s.detailCell}>
            <Text style={s.detailLabel}>Datum</Text>
            <Text style={s.detailValue}>{fmt(props.date)}</Text>
          </View>
          {isInvoice ? (
            <View style={s.detailCell}>
              <Text style={s.detailLabel}>Fällig am</Text>
              <Text style={s.detailValue}>{fmt(props.dueDate)}</Text>
            </View>
          ) : (
            <View style={s.detailCell}>
              <Text style={s.detailLabel}>Gültig bis</Text>
              <Text style={s.detailValue}>{fmt(props.validUntil)}</Text>
            </View>
          )}
          <View style={s.detailCell}>
            <Text style={s.detailLabel}>{isInvoice ? "Rechnung Nr." : "Angebot Nr."}</Text>
            <Text style={s.detailValue}>{props.number}</Text>
          </View>
        </View>

        {/* Items table */}
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={s.col1}>Leistung</Text>
            <Text style={s.col2}>Menge</Text>
            <Text style={s.col3}>Einzel</Text>
            <Text style={s.col4}>Summe</Text>
          </View>
          {props.items.map((it, i) => (
            <View key={i} style={s.tableRow}>
              <Text style={s.col1}>{it.details}</Text>
              <Text style={s.col2}>{it.quantity}</Text>
              <Text style={s.col3}>{eur(it.unitPrice)}</Text>
              <Text style={s.col4}>{eur(it.quantity * it.unitPrice)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={s.totals}>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Netto</Text>
            <Text style={s.totalValue}>{eur(props.subtotal)}</Text>
          </View>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>MwSt. {props.vatRate}%</Text>
            <Text style={s.totalValue}>{eur(props.vatAmount)}</Text>
          </View>
          {props.abschlaege?.map((a, i) => (
            <View key={i} style={s.totalRow}>
              <Text style={s.totalLabel}>./. Abschlag {a.number}</Text>
              <Text style={s.totalValue}>-{eur(a.amount)}</Text>
            </View>
          ))}
          <View style={s.grandRow}>
            <Text style={s.grandLabel}>{isInvoice ? "Zahlbetrag" : "Gesamt"}</Text>
            <Text style={s.grandValue}>{eur(props.total)}</Text>
          </View>
        </View>

        {/* Notes */}
        {props.notes ? (
          <View style={s.notes}>
            <Text>{props.notes}</Text>
          </View>
        ) : null}

        {/* Bank details for invoices */}
        {isInvoice && (props.business.iban || props.business.bankName) ? (
          <View style={s.bank}>
            <Text>Bankverbindung: {props.business.bankName}</Text>
            <Text>IBAN: {props.business.iban}{props.business.bic ? `  ·  BIC: ${props.business.bic}` : ""}</Text>
            {props.dueDate ? <Text>Bitte überweisen Sie den Zahlbetrag bis zum {fmt(props.dueDate)} unter Angabe der Rechnungsnummer.</Text> : null}
          </View>
        ) : null}

        <Text style={s.footer} fixed>
          {props.business.footer} · {props.business.name}
        </Text>
      </Page>
    </Document>
  );
}
