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
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Georgia',serif;background:#f5f0eb;padding:40px;color:#1a1a2e}
.invoice{max-width:800px;margin:auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08)}
.header{background:#1a1a2e;padding:32px 40px;display:flex;justify-content:space-between;align-items:center}
.header h1{color:#d4a574;font-size:28px;letter-spacing:1px}
.header .meta{color:#a0a0b8;font-size:12px;text-align:right;letter-spacing:1px}
.header .meta p{margin:4px 0}
.info{padding:32px 40px;display:flex;justify-content:space-between;border-bottom:1px solid #e8e0d8}
.info .block h3{color:#8a8078;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px}
.info .block p{font-size:14px;line-height:1.6;color:#4a4a4a}
table{width:100%;border-collapse:collapse;margin:0}
thead th{background:#faf8f5;padding:12px 20px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#8a8078;border-bottom:2px solid #e8e0d8}
tbody td{padding:14px 20px;border-bottom:1px solid #f0ebe4;font-size:14px}
tbody tr:last-child td{border-bottom:none}
.totals{padding:24px 40px;background:#faf8f5;border-top:2px solid #e8e0d8}
.totals .row{display:flex;justify-content:space-between;padding:6px 0;font-size:14px;color:#4a4a4a}
.totals .row.grand{font-size:20px;font-weight:700;color:#1a1a2e;padding-top:12px;border-top:1px solid #e8e0d8;margin-top:8px}
.footer{padding:24px 40px;text-align:center;font-size:11px;color:#b0a898;font-style:italic}
@media print{body{background:#fff;padding:0}.invoice{box-shadow:none;border-radius:0}.no-print{display:none!important}}
</style></head><body>
<div class="no-print" style="text-align:center;margin-bottom:16px"><button onclick="window.print()" style="background:#1a1a2e;color:#d4a574;border:none;padding:12px 32px;border-radius:6px;font-size:14px;cursor:pointer;font-family:Georgia,serif;letter-spacing:1px">PDF Olarak Kaydet / Yazdır</button></div>
<div class="invoice">
<div class="header"><div><h1>Can Antika</h1><p style="color:#a0a0b8;font-size:12px;letter-spacing:3px;margin-top:4px">EST. 1989 · İSTANBUL</p></div><div class="meta"><p>FATURA</p><p style="font-size:16px;color:#d4a574;font-weight:600">#${escapeHtml(invoice.invoiceNumber)}</p><p>${invoiceDate}</p></div></div>
<div class="info"><div class="block"><h3>Müşteri</h3><p>${escapeHtml(invoice.customerName)}</p></div><div class="block" style="text-align:right"><h3>Teslimat Adresi</h3><p>${escapeHtml(invoice.shippingAddressSummary)}</p></div></div>
<table><thead><tr><th>Ürün</th><th style="text-align:center">Adet</th><th style="text-align:right">Birim Fiyat</th><th style="text-align:right">Toplam</th></tr></thead><tbody>${itemRows}</tbody></table>
<div class="totals"><div class="row"><span>Ara Toplam</span><span>₺${invoice.subtotal.toLocaleString("tr-TR")}</span></div><div class="row"><span>Kargo</span><span>Ücretsiz</span></div><div class="row grand"><span>Genel Toplam</span><span>₺${invoice.totalAmount.toLocaleString("tr-TR")}</span></div></div>
<div class="footer">"Geçmişin izinde, geleceğe miras" · ${escapeHtml(store.address || "")} · ${escapeHtml(store.phone || "")}</div>
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
