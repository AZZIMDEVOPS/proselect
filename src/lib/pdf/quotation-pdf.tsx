import "server-only";
import React from "react";
import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { quoteTotals, type QItem } from "@/lib/quote";
import { SITE } from "@/lib/site";

export interface QuotationPdfInput {
  reference: string;
  version: number;
  status: string;
  currency: string;
  issuedAt: string | null;
  validityUntil: string | null;
  rfqReference?: string | null;
  clientCompany: string;
  clientContact?: string | null;
  clientEmail?: string | null;
  clientPhone?: string | null;
  projectLocation?: string | null;
  items: QItem[];
  logisticsCharge: number;
  otherCharges: number;
  otherChargesLabel?: string | null;
  taxLabel?: string | null;
  taxRate: number;
  incoterm?: string | null;
  deliveryEstimate?: string | null;
  logisticsEstimate?: string | null;
  paymentTerms?: string | null;
  commercialTerms?: string | null;
}

const S = StyleSheet.create({
  page: { padding: 36, fontSize: 9.5, fontFamily: "Helvetica", color: "#2A2F36", backgroundColor: "#ffffff" },
  headerBand: { backgroundColor: "#00447B", padding: 18, borderRadius: 4, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brand: { color: "#ffffff", fontSize: 16, fontFamily: "Helvetica-Bold", letterSpacing: 2 },
  brandSub: { color: "#C4CCD4", fontSize: 7.5, marginTop: 3, letterSpacing: 1.2 },
  docTitle: { color: "#ffffff", fontSize: 13, fontFamily: "Helvetica-Bold", textAlign: "right" },
  docRef: { color: "#C9A227", fontSize: 9.5, marginTop: 3, textAlign: "right", fontFamily: "Helvetica-Bold" },
  accentBar: { height: 3, backgroundColor: "#C9A227", marginTop: 2, marginBottom: 16, borderRadius: 1 },
  metaGrid: { flexDirection: "row", justifyContent: "space-between", gap: 14, marginBottom: 16 },
  metaBox: { flex: 1, padding: 11, backgroundColor: "#E8EDF2", borderRadius: 4, borderLeftWidth: 3, borderLeftColor: "#00447B" },
  boxHeading: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#00447B", textTransform: "uppercase", letterSpacing: 1, marginBottom: 5 },
  lineBold: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#002545", marginBottom: 2 },
  line: { fontSize: 9, color: "#2A2F36", marginBottom: 1.5 },
  tableHeader: { flexDirection: "row", backgroundColor: "#00447B", color: "#ffffff", paddingVertical: 7, paddingHorizontal: 8, borderRadius: 2, fontFamily: "Helvetica-Bold", fontSize: 8.5 },
  tableRow: { flexDirection: "row", borderBottomWidth: 0.7, borderBottomColor: "#C4CCD4", paddingVertical: 7, paddingHorizontal: 8 },
  cIdx: { width: "6%" },
  cDesc: { width: "52%", paddingRight: 8 },
  cQty: { width: "10%", textAlign: "right" },
  cUnit: { width: "16%", textAlign: "right" },
  cAmt: { width: "16%", textAlign: "right", fontFamily: "Helvetica-Bold" },
  totalsWrap: { marginTop: 10, flexDirection: "row", justifyContent: "flex-end" },
  totalsBox: { width: 250, padding: 10, backgroundColor: "#E8EDF2", borderRadius: 4, borderWidth: 1, borderColor: "#C4CCD4" },
  totRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2.5 },
  totGrand: { flexDirection: "row", justifyContent: "space-between", paddingTop: 6, marginTop: 4, borderTopWidth: 1.2, borderTopColor: "#00447B" },
  totGrandText: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#00447B" },
  section: { marginTop: 14 },
  secTitle: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: "#00447B", textTransform: "uppercase", letterSpacing: 1, marginBottom: 5, borderBottomWidth: 0.7, borderBottomColor: "#C4CCD4", paddingBottom: 3 },
  kvRow: { flexDirection: "row", marginBottom: 3 },
  kvKey: { width: 120, color: "#6B7682", fontSize: 8.5, fontFamily: "Helvetica-Bold" },
  kvVal: { flex: 1, color: "#2A2F36", fontSize: 8.5 },
  notice: { marginTop: 14, padding: 9, backgroundColor: "#E8EDF2", borderRadius: 3, fontSize: 8, color: "#2A2F36", lineHeight: 1.4, borderLeftWidth: 2, borderLeftColor: "#C9A227" },
  footer: { position: "absolute", bottom: 20, left: 36, right: 36, borderTopWidth: 0.7, borderTopColor: "#C4CCD4", paddingTop: 6, flexDirection: "row", justifyContent: "space-between", fontSize: 7.5, color: "#6B7682" },
});

const fmtMoney = (n: number, ccy: string) =>
  `${ccy} ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (d?: string | null) =>
  d ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d)) : "—";

function QuotationPdfDoc({ q }: { q: QuotationPdfInput }) {
  const t = quoteTotals(q.items, q.logisticsCharge, q.otherCharges, q.taxRate);
  return (
    <Document
      title={`Quotation ${q.reference} v${q.version}`}
      author={SITE.name}
      subject={`Commercial Quotation ${q.reference}`}
    >
      <Page size="A4" style={S.page}>
        <View style={S.headerBand}>
          <View>
            <Text style={S.brand}>PROSELECT</Text>
            <Text style={S.brandSub}>FLEET &amp; INDUSTRIAL SOLUTIONS LIMITED · NAIROBI, KENYA</Text>
          </View>
          <View>
            <Text style={S.docTitle}>COMMERCIAL QUOTATION</Text>
            <Text style={S.docRef}>{q.reference} · Rev {q.version}{q.status === "draft" ? " (DRAFT)" : ""}</Text>
          </View>
        </View>
        <View style={S.accentBar} />

        <View style={S.metaGrid}>
          <View style={S.metaBox}>
            <Text style={S.boxHeading}>Prepared For</Text>
            <Text style={S.lineBold}>{q.clientCompany}</Text>
            {q.clientContact ? <Text style={S.line}>Attn: {q.clientContact}</Text> : null}
            {q.clientEmail ? <Text style={S.line}>{q.clientEmail}</Text> : null}
            {q.clientPhone ? <Text style={S.line}>{q.clientPhone}</Text> : null}
            {q.projectLocation ? <Text style={S.line}>Location: {q.projectLocation}</Text> : null}
          </View>
          <View style={S.metaBox}>
            <Text style={S.boxHeading}>Quotation Details</Text>
            <Text style={S.line}>Reference: {q.reference} (Version {q.version})</Text>
            {q.rfqReference ? <Text style={S.line}>RFQ Reference: {q.rfqReference}</Text> : null}
            <Text style={S.line}>Date Issued: {fmtDate(q.issuedAt)}</Text>
            <Text style={S.line}>Valid Until: {fmtDate(q.validityUntil)}</Text>
            <Text style={S.line}>Currency: {q.currency}{q.incoterm ? ` · Incoterm: ${q.incoterm}` : ""}</Text>
          </View>
        </View>

        <View style={S.tableHeader}>
          <Text style={S.cIdx}>#</Text>
          <Text style={S.cDesc}>Equipment / Description</Text>
          <Text style={S.cQty}>Qty</Text>
          <Text style={S.cUnit}>Unit Price</Text>
          <Text style={S.cAmt}>Line Total</Text>
        </View>
        {q.items.map((item, idx) => (
          <View key={idx} style={S.tableRow} wrap={false}>
            <Text style={S.cIdx}>{idx + 1}</Text>
            <Text style={S.cDesc}>{item.description}</Text>
            <Text style={S.cQty}>{item.quantity}</Text>
            <Text style={S.cUnit}>{fmtMoney(item.unit_price, q.currency)}</Text>
            <Text style={S.cAmt}>{fmtMoney(item.quantity * item.unit_price, q.currency)}</Text>
          </View>
        ))}

        <View style={S.totalsWrap} wrap={false}>
          <View style={S.totalsBox}>
            <View style={S.totRow}>
              <Text>Equipment Subtotal</Text>
              <Text>{fmtMoney(t.subtotal, q.currency)}</Text>
            </View>
            {t.logistics > 0 ? (
              <View style={S.totRow}>
                <Text>Logistics &amp; Shipping</Text>
                <Text>{fmtMoney(t.logistics, q.currency)}</Text>
              </View>
            ) : null}
            {t.other > 0 ? (
              <View style={S.totRow}>
                <Text>{q.otherChargesLabel || "Other Disclosed Charges"}</Text>
                <Text>{fmtMoney(t.other, q.currency)}</Text>
              </View>
            ) : null}
            {q.taxRate > 0 ? (
              <View style={S.totRow}>
                <Text>{q.taxLabel || "Tax"} ({q.taxRate}%)</Text>
                <Text>{fmtMoney(t.tax, q.currency)}</Text>
              </View>
            ) : null}
            <View style={S.totGrand}>
              <Text style={S.totGrandText}>TOTAL ({q.currency})</Text>
              <Text style={S.totGrandText}>{fmtMoney(t.total, q.currency)}</Text>
            </View>
          </View>
        </View>

        <View style={S.section} wrap={false}>
          <Text style={S.secTitle}>Delivery, Logistics &amp; Commercial Terms</Text>
          {q.incoterm ? <View style={S.kvRow}><Text style={S.kvKey}>Incoterm</Text><Text style={S.kvVal}>{q.incoterm}</Text></View> : null}
          {q.deliveryEstimate ? <View style={S.kvRow}><Text style={S.kvKey}>Delivery Estimate</Text><Text style={S.kvVal}>{q.deliveryEstimate}</Text></View> : null}
          {q.logisticsEstimate ? <View style={S.kvRow}><Text style={S.kvKey}>Logistics Arrangement</Text><Text style={S.kvVal}>{q.logisticsEstimate}</Text></View> : null}
          {q.paymentTerms ? <View style={S.kvRow}><Text style={S.kvKey}>Payment Terms</Text><Text style={S.kvVal}>{q.paymentTerms}</Text></View> : null}
          {q.commercialTerms ? <View style={S.kvRow}><Text style={S.kvKey}>Commercial Terms</Text><Text style={S.kvVal}>{q.commercialTerms}</Text></View> : null}
        </View>

        <View style={S.notice} wrap={false}>
          <Text>
            IMPORTANT COMMERCIAL NOTICE: This quotation is valid until the date stated above and is subject to manufacturer production scheduling at the time of contract execution. Recording acceptance in the Proselect Client Portal notifies our commercial team of your intent to proceed; binding contractual obligations arise only upon execution of a formal Sales Contract authorised in writing by Proselect Fleet &amp; Industrial Solutions Limited.
          </Text>
        </View>

        <View style={S.footer} fixed>
          <Text>{SITE.name} · {SITE.location}</Text>
          <Text>{SITE.email} · {SITE.domain}</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function renderQuotationPdf(input: QuotationPdfInput): Promise<Buffer> {
  return renderToBuffer(<QuotationPdfDoc q={input} />);
}
