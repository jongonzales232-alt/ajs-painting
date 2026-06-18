function fromAddress() {
  return process.env.EMAIL_FROM || "AJ's Painting <no-reply@example.com>";
}

async function sendWithResend(message) {
  if (!process.env.RESEND_API_KEY) return false;

  const attachments = (message.attachments || []).map((attachment) => ({
    filename: attachment.filename,
    content: Buffer.from(attachment.content).toString("base64")
  }));

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: fromAddress(),
      to: Array.isArray(message.to) ? message.to : [message.to],
      subject: message.subject,
      html: message.html,
      text: message.text,
      attachments
    })
  });

  if (!response.ok) {
    throw new Error(`Resend email failed: ${response.status}`);
  }
  return true;
}

export async function sendEmail(message) {
  if (!message.to) return { skipped: true };

  try {
    if (await sendWithResend(message)) return { sent: true, provider: "resend" };
  } catch (error) {
    console.error("Email delivery failed.", {
      to: message.to,
      subject: message.subject,
      error: error.message
    });
    return { sent: false, error: "Email delivery failed." };
  }

  console.log("Email skipped. Configure RESEND_API_KEY to send notifications.", {
    to: message.to,
    subject: message.subject
  });
  return { skipped: true };
}

export function ownerEmail() {
  return process.env.BUSINESS_OWNER_EMAIL || process.env.BUSINESS_EMAIL || "";
}
