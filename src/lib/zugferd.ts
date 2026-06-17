/**
 * ZUGFeRD 2.x BASIC profile XML generator.
 *
 * Encodes the invoice as Cross-Industry-Invoice (CII) XML. In a follow-up
 * step we'd embed this into the PDF/A-3 as the attached file
 * `factur-x.xml` plus the right PDF/A metadata, so the result is a
 * compliant E-Rechnung (ZUGFeRD/Factur-X). For Phase 1 we generate
 * the XML and ship it as a side-by-side download — the embedding step
 * needs a pdf/a-3 writer (e.g. pdf-lib + custom metadata) and is
 * planned as the next iteration.
 *
 * Reference: https://www.ferd-net.de/standards/zugferd-2.3/index.html
 */

export type ZugferdInvoiceInput = {
  number: string;
  date: Date;
  dueDate?: Date | null;
  currency?: string; // default "EUR"
  buyer: {
    name: string;
    address: string;
    postcode?: string;
    city?: string;
    countryCode?: string; // ISO 3166-1 alpha-2
    taxId?: string;
  };
  seller: {
    name: string;
    address: string;
    postcode?: string;
    city?: string;
    countryCode?: string;
    taxId?: string;
    iban?: string;
    bic?: string;
  };
  items: { name: string; quantity: number; unitPrice: number }[];
  vatRate: number;
  subtotal: number;
  vatAmount: number;
  total: number;
  paymentTerms?: string;
};

const iso = (d: Date): string => {
  // Format "YYYYMMDD" required by UNCEFACT.
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
};

const esc = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const f = (n: number) => n.toFixed(2);

export function buildZugferdXml(inv: ZugferdInvoiceInput): string {
  const cur = inv.currency ?? "EUR";
  return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
                          xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
                          xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1p0:basic</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>${esc(inv.number)}</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">${iso(inv.date)}</udt:DateTimeString>
    </ram:IssueDateTime>
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
    ${inv.items
      .map(
        (it, i) => `
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument>
        <ram:LineID>${i + 1}</ram:LineID>
      </ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct>
        <ram:Name>${esc(it.name)}</ram:Name>
      </ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement>
        <ram:NetPriceProductTradePrice>
          <ram:ChargeAmount>${f(it.unitPrice)}</ram:ChargeAmount>
        </ram:NetPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery>
        <ram:BilledQuantity unitCode="C62">${it.quantity}</ram:BilledQuantity>
      </ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>S</ram:CategoryCode>
          <ram:RateApplicablePercent>${inv.vatRate}</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation>
          <ram:LineTotalAmount>${f(it.quantity * it.unitPrice)}</ram:LineTotalAmount>
        </ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>`
      )
      .join("")}
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>
        <ram:Name>${esc(inv.seller.name)}</ram:Name>
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>${esc(inv.seller.postcode ?? "")}</ram:PostcodeCode>
          <ram:LineOne>${esc(inv.seller.address)}</ram:LineOne>
          <ram:CityName>${esc(inv.seller.city ?? "")}</ram:CityName>
          <ram:CountryID>${esc(inv.seller.countryCode ?? "DE")}</ram:CountryID>
        </ram:PostalTradeAddress>
        ${inv.seller.taxId ? `<ram:SpecifiedTaxRegistration><ram:ID schemeID="VA">${esc(inv.seller.taxId)}</ram:ID></ram:SpecifiedTaxRegistration>` : ""}
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty>
        <ram:Name>${esc(inv.buyer.name)}</ram:Name>
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>${esc(inv.buyer.postcode ?? "")}</ram:PostcodeCode>
          <ram:LineOne>${esc(inv.buyer.address)}</ram:LineOne>
          <ram:CityName>${esc(inv.buyer.city ?? "")}</ram:CityName>
          <ram:CountryID>${esc(inv.buyer.countryCode ?? "DE")}</ram:CountryID>
        </ram:PostalTradeAddress>
        ${inv.buyer.taxId ? `<ram:SpecifiedTaxRegistration><ram:ID schemeID="VA">${esc(inv.buyer.taxId)}</ram:ID></ram:SpecifiedTaxRegistration>` : ""}
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeDelivery />
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>${cur}</ram:InvoiceCurrencyCode>
      ${inv.seller.iban ? `
      <ram:SpecifiedTradeSettlementPaymentMeans>
        <ram:TypeCode>58</ram:TypeCode>
        <ram:PayeePartyCreditorFinancialAccount>
          <ram:IBANID>${esc(inv.seller.iban)}</ram:IBANID>
        </ram:PayeePartyCreditorFinancialAccount>
        ${inv.seller.bic ? `<ram:PayeeSpecifiedCreditorFinancialInstitution><ram:BICID>${esc(inv.seller.bic)}</ram:BICID></ram:PayeeSpecifiedCreditorFinancialInstitution>` : ""}
      </ram:SpecifiedTradeSettlementPaymentMeans>` : ""}
      <ram:ApplicableTradeTax>
        <ram:CalculatedAmount currencyID="${cur}">${f(inv.vatAmount)}</ram:CalculatedAmount>
        <ram:TypeCode>VAT</ram:TypeCode>
        <ram:BasisAmount currencyID="${cur}">${f(inv.subtotal)}</ram:BasisAmount>
        <ram:CategoryCode>S</ram:CategoryCode>
        <ram:RateApplicablePercent>${inv.vatRate}</ram:RateApplicablePercent>
      </ram:ApplicableTradeTax>
      ${inv.dueDate ? `
      <ram:SpecifiedTradePaymentTerms>
        <ram:Description>${esc(inv.paymentTerms ?? `Zahlbar bis ${inv.dueDate.toLocaleDateString("de-DE")}`)}</ram:Description>
        <ram:DueDateDateTime>
          <udt:DateTimeString format="102">${iso(inv.dueDate)}</udt:DateTimeString>
        </ram:DueDateDateTime>
      </ram:SpecifiedTradePaymentTerms>` : ""}
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount currencyID="${cur}">${f(inv.subtotal)}</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount currencyID="${cur}">${f(inv.subtotal)}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="${cur}">${f(inv.vatAmount)}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount currencyID="${cur}">${f(inv.total)}</ram:GrandTotalAmount>
        <ram:DuePayableAmount currencyID="${cur}">${f(inv.total)}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;
}
