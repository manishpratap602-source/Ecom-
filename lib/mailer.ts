import sgMail from '@sendgrid/mail'

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
}

export async function sendEmail({ to, subject, html, text }: { to: string | string[]; subject: string; html?: string; text?: string }) {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('SENDGRID_API_KEY not configured — skipping email')
    return
  }

  const msg = {
    to,
    from: process.env.EMAIL_FROM || 'no-reply@example.com',
    subject,
    text,
    html
  }

  try {
    await sgMail.send(msg as any)
  } catch (err) {
    console.error('sendEmail error', err)
  }
}
