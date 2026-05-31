import { Resend } from 'resend'
import { buildEmailHtml } from '../../src/lib/emailTemplate.js'

const resend = new Resend(process.env.RESEND_API_KEY)

export const handler = async (event) => {
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
