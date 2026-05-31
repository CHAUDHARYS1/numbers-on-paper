export function fmtCurrency(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0)
}

export function buildEmailHtml({ invoice, senderName, senderEmail, message }) {
  const {
    invoice_number, issue_date, due_date,
    bill_to = {}, bill_from = {},
    line_items = [],
    subtotal = 0, discount_amount = 0, tax_amount = 0, total = 0,
    show_discount, show_tax, show_notes, notes,
  } = invoice

  const brandBlue   = '#1d4ed8'
  const brandDark   = '#1e3a8a'
  const textPrimary = '#0f172a'
  const textMuted   = '#94a3b8'
  const textSecond  = '#475569'
  const border      = '#e2e8f0'
  const bgSubtle    = '#f8fafc'

  const rows = line_items.map(item => `
    <tr>
      <td style="padding:10px 14px;border-bottom:1px solid ${border};font-size:14px;color:${textPrimary};font-weight:500;">${item.item || '—'}</td>
      <td style="padding:10px 14px;border-bottom:1px solid ${border};font-size:13px;color:${textSecond};">${item.description || ''}</td>
      <td style="padding:10px 14px;border-bottom:1px solid ${border};font-size:13px;color:${textSecond};text-align:right;">${item.hours || '—'}</td>
      <td style="padding:10px 14px;border-bottom:1px solid ${border};font-size:14px;color:${textPrimary};text-align:right;font-family:monospace;font-weight:500;">${fmtCurrency(item.amount)}</td>
    </tr>
  `).join('')

  const totalRows = [
    `<tr><td style="text-align:right;padding:4px 0;font-size:13px;color:${textSecond};">Subtotal</td><td style="text-align:right;padding:4px 0 4px 32px;font-size:13px;font-family:monospace;color:${textPrimary};">${fmtCurrency(subtotal)}</td></tr>`,
    show_discount && discount_amount > 0 ? `<tr><td style="text-align:right;padding:4px 0;font-size:13px;color:${textSecond};">Discount</td><td style="text-align:right;padding:4px 0 4px 32px;font-size:13px;font-family:monospace;color:${textPrimary};">-${fmtCurrency(discount_amount)}</td></tr>` : '',
    show_tax && tax_amount > 0 ? `<tr><td style="text-align:right;padding:4px 0;font-size:13px;color:${textSecond};">Tax</td><td style="text-align:right;padding:4px 0 4px 32px;font-size:13px;font-family:monospace;color:${textPrimary};">${fmtCurrency(tax_amount)}</td></tr>` : '',
    `<tr><td colspan="2" style="padding:0;"><div style="height:1px;background:${border};margin:8px 0;"></div></td></tr>`,
    `<tr><td style="text-align:right;padding:4px 0;font-size:16px;font-weight:700;color:${textPrimary};">Grand total</td><td style="text-align:right;padding:4px 0 4px 32px;font-size:18px;font-weight:700;font-family:monospace;color:${brandBlue};">${fmtCurrency(total)}</td></tr>`,
  ].filter(Boolean).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Invoice ${invoice_number}</title>
</head>
<body style="margin:0;padding:0;background:${bgSubtle};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${bgSubtle};padding:40px 16px;">
  <tr><td align="center">
  <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;border:1px solid ${border};overflow:hidden;">

    <!-- ── Blue header ── -->
    <tr><td style="background:${brandBlue};padding:36px 40px;">
      <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#bfdbfe;letter-spacing:0.08em;text-transform:uppercase;">Invoice from</p>
      <h1 style="margin:0;font-size:26px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">${bill_from.business || senderName || 'Numbers on Paper'}</h1>
      ${bill_from.name ? `<p style="margin:6px 0 0;font-size:14px;color:#bfdbfe;">${bill_from.name}</p>` : ''}
    </td></tr>

    <!-- ── Invoice # + Due date ── -->
    <tr><td style="padding:28px 40px 0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td>
            <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:${textMuted};text-transform:uppercase;letter-spacing:0.06em;">Invoice number</p>
            <p style="margin:0;font-size:22px;font-weight:700;color:${brandBlue};font-family:'Courier New',monospace;">${invoice_number}</p>
            ${issue_date ? `<p style="margin:4px 0 0;font-size:12px;color:${textMuted};">Issued ${issue_date}</p>` : ''}
          </td>
          <td style="text-align:right;vertical-align:top;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:${textMuted};text-transform:uppercase;letter-spacing:0.06em;">Amount due</p>
            <p style="margin:0;font-size:22px;font-weight:700;color:${textPrimary};font-family:'Courier New',monospace;">${fmtCurrency(total)}</p>
            ${due_date ? `<p style="margin:4px 0 0;font-size:12px;color:${textMuted};">Due ${due_date}</p>` : ''}
          </td>
        </tr>
      </table>
    </td></tr>

    <!-- ── Divider ── -->
    <tr><td style="padding:24px 40px 0;"><div style="height:1px;background:${border};"></div></td></tr>

    <!-- ── Bill to ── -->
    <tr><td style="padding:24px 40px 0;">
      <p style="margin:0 0 10px;font-size:11px;font-weight:600;color:${textMuted};text-transform:uppercase;letter-spacing:0.06em;">Bill to</p>
      <p style="margin:0;font-size:16px;font-weight:600;color:${textPrimary};">${bill_to.name || '—'}</p>
      ${bill_to.organization ? `<p style="margin:2px 0 0;font-size:14px;color:${textSecond};">${bill_to.organization}</p>` : ''}
      ${bill_to.contact_name ? `<p style="margin:4px 0 0;font-size:13px;color:${textSecond};">Attn: ${bill_to.contact_name}${bill_to.contact_title ? `, ${bill_to.contact_title}` : ''}</p>` : ''}
      ${bill_to.address ? `<p style="margin:6px 0 0;font-size:13px;color:${textMuted};">${bill_to.address}${bill_to.city ? `, ${bill_to.city}` : ''}${bill_to.state ? `, ${bill_to.state}` : ''} ${bill_to.zip || ''}</p>` : ''}
    </td></tr>

    ${message ? `
    <!-- ── Personal message ── -->
    <tr><td style="padding:24px 40px 0;">
      <div style="background:#eff6ff;border-left:3px solid ${brandBlue};padding:14px 18px;border-radius:0 8px 8px 0;">
        <p style="margin:0;font-size:14px;color:${brandDark};line-height:1.7;">${message.replace(/\n/g, '<br>')}</p>
      </div>
    </td></tr>` : ''}

    <!-- ── Line items ── -->
    <tr><td style="padding:28px 40px 0;">
      <p style="margin:0 0 12px;font-size:11px;font-weight:600;color:${textMuted};text-transform:uppercase;letter-spacing:0.06em;">Invoice detail</p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${border};border-radius:8px;overflow:hidden;">
        <thead>
          <tr style="background:${bgSubtle};">
            <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:600;color:${textMuted};text-transform:uppercase;letter-spacing:0.04em;border-bottom:1px solid ${border};">Item</th>
            <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:600;color:${textMuted};text-transform:uppercase;letter-spacing:0.04em;border-bottom:1px solid ${border};">Description</th>
            <th style="padding:10px 14px;text-align:right;font-size:11px;font-weight:600;color:${textMuted};text-transform:uppercase;letter-spacing:0.04em;border-bottom:1px solid ${border};">Hrs</th>
            <th style="padding:10px 14px;text-align:right;font-size:11px;font-weight:600;color:${textMuted};text-transform:uppercase;letter-spacing:0.04em;border-bottom:1px solid ${border};">Amount</th>
          </tr>
        </thead>
        <tbody>${rows || `<tr><td colspan="4" style="padding:16px 14px;text-align:center;font-size:13px;color:${textMuted};">No line items</td></tr>`}</tbody>
      </table>
    </td></tr>

    <!-- ── Totals ── -->
    <tr><td style="padding:16px 40px 0;">
      <table style="margin-left:auto;" cellpadding="0" cellspacing="0" border="0">
        ${totalRows}
      </table>
    </td></tr>

    ${show_notes && notes ? `
    <!-- ── Notes ── -->
    <tr><td style="padding:24px 40px 0;">
      <div style="height:1px;background:${border};margin-bottom:20px;"></div>
      <p style="margin:0 0 8px;font-size:11px;font-weight:600;color:${textMuted};text-transform:uppercase;letter-spacing:0.06em;">Notes & terms</p>
      <p style="margin:0;font-size:13px;color:${textSecond};line-height:1.7;">${notes.replace(/\n/g, '<br>')}</p>
    </td></tr>` : ''}

    <!-- ── Footer ── -->
    <tr><td style="padding:32px 40px;margin-top:32px;border-top:1px solid ${border};">
      <p style="margin:0;font-size:13px;color:${textMuted};text-align:center;line-height:1.6;">
        Questions? ${senderEmail ? `Reply to this email or contact <a href="mailto:${senderEmail}" style="color:${brandBlue};text-decoration:none;">${senderEmail}</a>` : 'Reply to this email.'}
      </p>
      <p style="margin:10px 0 0;font-size:11px;color:#cbd5e1;text-align:center;">Sent via <strong style="color:${textMuted};">Numbers on Paper</strong></p>
    </td></tr>

  </table>
  </td></tr>
</table>
</body>
</html>`
}
