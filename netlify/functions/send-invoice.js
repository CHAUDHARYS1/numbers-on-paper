const { Resend } = require('resend')

const resend = new Resend(process.env.RESEND_API_KEY)

function fmt(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0)
}

function buildEmailHtml({ invoice, senderName, senderEmail, message }) {
  const { invoice_number, issue_date, due_date, bill_to = {}, bill_from = {}, line_items = [], subtotal, discount_amount, tax_amount, total, show_discount, show_tax, notes, show_notes } = invoice

  const rows = line_items.map(item => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#0f172a;">${item.item || '—'}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#475569;">${item.description || ''}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#475569;text-align:right;">${item.hours || '—'}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#0f172a;text-align:right;font-family:monospace;">${fmt(item.amount)}</td>
    </tr>
  `).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Invoice ${invoice_number}</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="background:#1d4ed8;padding:32px 40px;">
          <p style="margin:0;font-size:13px;color:#bfdbfe;letter-spacing:0.05em;text-transform:uppercase;">Invoice from</p>
          <h1 style="margin:4px 0 0;font-size:24px;font-weight:700;color:#ffffff;">${bill_from.business || senderName}</h1>
        </td></tr>

        <!-- Invoice meta -->
        <tr><td style="padding:32px 40px 0;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="50%">
                <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;">Invoice number</p>
                <p style="margin:0;font-size:20px;font-weight:700;color:#1d4ed8;font-family:monospace;">${invoice_number}</p>
              </td>
              <td width="50%" style="text-align:right;">
                <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;">Due date</p>
                <p style="margin:0;font-size:16px;font-weight:600;color:#0f172a;">${due_date || 'Upon receipt'}</p>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Bill to -->
        <tr><td style="padding:24px 40px 0;">
          <p style="margin:0 0 8px;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;">Bill to</p>
          <p style="margin:0;font-size:15px;font-weight:600;color:#0f172a;">${bill_to.name || '—'}</p>
          ${bill_to.organization ? `<p style="margin:2px 0 0;font-size:14px;color:#475569;">${bill_to.organization}</p>` : ''}
          ${bill_to.contact_name ? `<p style="margin:2px 0 0;font-size:13px;color:#64748b;">Attn: ${bill_to.contact_name}${bill_to.contact_title ? `, ${bill_to.contact_title}` : ''}</p>` : ''}
        </td></tr>

        ${message ? `
        <!-- Personal message -->
        <tr><td style="padding:24px 40px 0;">
          <div style="background:#eff6ff;border-left:3px solid #1d4ed8;padding:14px 16px;border-radius:0 6px 6px 0;">
            <p style="margin:0;font-size:14px;color:#1e3a8a;line-height:1.6;">${message.replace(/\n/g, '<br>')}</p>
          </div>
        </td></tr>` : ''}

        <!-- Line items -->
        <tr><td style="padding:32px 40px 0;">
          <p style="margin:0 0 12px;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;">Invoice detail</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
            <thead>
              <tr style="background:#f8fafc;">
                <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.04em;border-bottom:1px solid #e2e8f0;">Item</th>
                <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.04em;border-bottom:1px solid #e2e8f0;">Description</th>
                <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.04em;border-bottom:1px solid #e2e8f0;">Hrs</th>
                <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.04em;border-bottom:1px solid #e2e8f0;">Amount</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </td></tr>

        <!-- Totals -->
        <tr><td style="padding:16px 40px 0;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="text-align:right;padding:4px 0;">
              <span style="font-size:13px;color:#475569;">Subtotal</span>
              <span style="font-size:13px;color:#0f172a;font-family:monospace;margin-left:32px;">${fmt(subtotal)}</span>
            </td></tr>
            ${show_discount && discount_amount > 0 ? `<tr><td style="text-align:right;padding:4px 0;">
              <span style="font-size:13px;color:#475569;">Discount</span>
              <span style="font-size:13px;color:#0f172a;font-family:monospace;margin-left:32px;">-${fmt(discount_amount)}</span>
            </td></tr>` : ''}
            ${show_tax && tax_amount > 0 ? `<tr><td style="text-align:right;padding:4px 0;">
              <span style="font-size:13px;color:#475569;">Tax</span>
              <span style="font-size:13px;color:#0f172a;font-family:monospace;margin-left:32px;">${fmt(tax_amount)}</span>
            </td></tr>` : ''}
            <tr><td style="text-align:right;padding:12px 0 0;border-top:1px solid #e2e8f0;margin-top:8px;">
              <span style="font-size:16px;font-weight:700;color:#0f172a;">Grand total</span>
              <span style="font-size:18px;font-weight:700;color:#1d4ed8;font-family:monospace;margin-left:32px;">${fmt(total)}</span>
            </td></tr>
          </table>
        </td></tr>

        ${show_notes && notes ? `
        <!-- Notes -->
        <tr><td style="padding:24px 40px 0;">
          <p style="margin:0 0 8px;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;">Notes & terms</p>
          <p style="margin:0;font-size:13px;color:#475569;line-height:1.7;">${notes.replace(/\n/g, '<br>')}</p>
        </td></tr>` : ''}

        <!-- Footer -->
        <tr><td style="padding:32px 40px;border-top:1px solid #e2e8f0;margin-top:32px;">
          <p style="margin:0;font-size:13px;color:#94a3b8;text-align:center;">
            Questions? Reply to this email or contact <a href="mailto:${senderEmail}" style="color:#1d4ed8;">${senderEmail}</a>
          </p>
          <p style="margin:8px 0 0;font-size:11px;color:#cbd5e1;text-align:center;">Sent via Numbers on Paper</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  if (!process.env.RESEND_API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'RESEND_API_KEY is not configured.' }) }
  }

  let body
  try {
    body = JSON.parse(event.body)
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) }
  }

  const { invoice, to, senderName, senderEmail, message } = body

  if (!invoice || !to) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields: invoice, to' }) }
  }

  try {
    const { data, error } = await resend.emails.send({
      from:     `${senderName || 'Numbers on Paper'} <onboarding@resend.dev>`,
      reply_to: senderEmail,
      to:       [to],
      subject:  `Invoice ${invoice.invoice_number} from ${senderName || invoice.bill_from?.business || 'Numbers on Paper'}`,
      html:     buildEmailHtml({ invoice, senderName, senderEmail, message }),
    })

    if (error) {
      return { statusCode: 400, body: JSON.stringify({ error: error.message }) }
    }

    return { statusCode: 200, body: JSON.stringify({ success: true, id: data?.id }) }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
