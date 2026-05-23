import { formatDateTR } from "@/lib/utils"

interface InvoiceItem {
    productTitle: string
    quantity: number
    unitPrice: number
    lineTotal: number
}

interface InvoiceData {
    invoiceNumber: string
    orderDate: string
    customerName: string
    shippingAddressSummary: string
    items: InvoiceItem[]
    subtotal: number
    shippingAmount?: number
    totalAmount: number
}

interface StoreInfo {
    address?: string
    phone?: string
}

export function generateInvoiceHtml(invoice: InvoiceData, store: StoreInfo): string {
    const invoiceDate = formatDateTR(invoice.orderDate)

    const itemRows = invoice.items
        .map(
            (item) =>
                `<tr><td>${escapeHtml(item.productTitle)}</td><td style="text-align:center">${item.quantity}</td><td style="text-align:right">₺${item.unitPrice.toLocaleString("tr-TR")}</td><td style="text-align:right">₺${item.lineTotal.toLocaleString("tr-TR")}</td></tr>`
        )
        .join("")

    return `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><title>Fatura #${escapeHtml(invoice.invoiceNumber)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#f9f6f0;padding:32px;color:#3d2b1f}
.invoice{max-width:800px;margin:auto;background:#fffdf8;border:1px solid #e8e1d5;border-radius:4px;overflow:hidden;box-shadow:0 8px 24px rgba(123,64,25,0.04)}
.header{padding:38px 40px 24px;text-align:center;border-bottom:1px solid #e8e1d5}
.header h1{margin:0;color:#7b4019;font-size:34px;font-weight:500;letter-spacing:6px;font-family:'Cinzel','Times New Roman',Times,serif;text-transform:uppercase}
.header .tagline{margin:10px 0 0;color:#8a7668;font-size:14px;letter-spacing:2px;font-family:'Cormorant Garamond','Times New Roman',Times,serif;font-style:italic}
.header .rule{margin:24px auto 0;width:40px;height:1px;background:#d2bf97}
.meta{display:flex;justify-content:space-between;gap:20px;padding:22px 40px;background:#f4efe6;border-bottom:1px solid #e8e1d5;color:#66554b;font-size:12px;letter-spacing:1px;text-transform:uppercase}
.meta strong{display:block;margin-top:6px;color:#7b4019;font-size:16px;font-family:'Cinzel','Times New Roman',Times,serif;letter-spacing:2px}
.info{padding:30px 40px;display:flex;justify-content:space-between;gap:28px;border-bottom:1px solid #e8e1d5}
.info .block{flex:1}
.info .block h3{color:#8a7668;font-size:11px;text-transform:uppercase;letter-spacing:3px;margin-bottom:8px}
.info .block p{font-size:14px;line-height:1.6;color:#504137}
table{width:100%;border-collapse:collapse;margin:0}
thead th{background:#f9f6f0;padding:13px 20px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#8a7668;border-bottom:1px solid #d2bf97}
tbody td{padding:15px 20px;border-bottom:1px solid #eee6d9;font-size:14px;color:#3d2b1f}
tbody tr:last-child td{border-bottom:none}
.totals{padding:24px 40px;background:#f4efe6;border-top:1px solid #e8e1d5}
.totals .row{display:flex;justify-content:space-between;padding:7px 0;font-size:14px;color:#504137}
.totals .row.grand{font-size:20px;font-weight:700;color:#7b4019;padding-top:14px;border-top:1px solid #d2bf97;margin-top:8px;font-family:'Cormorant Garamond','Times New Roman',Times,serif}
.footer{padding:24px 40px;text-align:center;font-size:13px;line-height:1.5;color:#66554b;background:#f4efe6;border-top:1px solid #e8e1d5;font-family:'Cormorant Garamond','Times New Roman',Times,serif;font-style:italic}
.print-action{text-align:center;margin-bottom:18px}
.print-action button{display:inline-block;background:#7b4019;color:#fffdf8;border:none;padding:14px 32px;border-radius:2px;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;cursor:pointer;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif}
@media print{body{background:#fff;padding:0}.invoice{box-shadow:none;border-radius:0}.no-print{display:none!important}}
</style></head><body>
<div class="no-print print-action"><button onclick="window.print()">PDF Olarak Kaydet / Yazdır</button></div>
<div class="invoice">
<div class="header"><h1>CAN ANTİKA</h1><p class="tagline">Geçmişin İzi, Geleceğin Mirası</p><div class="rule"></div></div>
<div class="meta"><div><span>Belge Türü</span><strong>FATURA</strong></div><div style="text-align:center"><span>Fatura No</span><strong>#${escapeHtml(invoice.invoiceNumber)}</strong></div><div style="text-align:right"><span>Tarih</span><strong>${invoiceDate}</strong></div></div>
<div class="info"><div class="block"><h3>Müşteri</h3><p>${escapeHtml(invoice.customerName)}</p></div><div class="block" style="text-align:right"><h3>Teslimat Adresi</h3><p>${escapeHtml(invoice.shippingAddressSummary)}</p></div></div>
<table><thead><tr><th>Ürün</th><th style="text-align:center">Adet</th><th style="text-align:right">Birim Fiyat</th><th style="text-align:right">Toplam</th></tr></thead><tbody>${itemRows}</tbody></table>
<div class="totals"><div class="row"><span>Ara Toplam</span><span>₺${invoice.subtotal.toLocaleString("tr-TR")}</span></div><div class="row"><span>Kargo</span><span>${(invoice.shippingAmount ?? 0) > 0 ? `₺${(invoice.shippingAmount ?? 0).toLocaleString("tr-TR")}` : "Ücretsiz"}</span></div><div class="row grand"><span>Genel Toplam</span><span>₺${invoice.totalAmount.toLocaleString("tr-TR")}</span></div></div>
<div class="footer">${escapeHtml(store.address || "")}<br>${escapeHtml(store.phone || "")}</div>
</div></body></html>`
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
}
