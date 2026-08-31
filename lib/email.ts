import { Resend } from "resend";

const FROM = process.env.EMAIL_FROM ?? "Caked Leagues <onboarding@resend.dev>";

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`[dev] Password reset link for ${to}: ${resetUrl}`);
    return;
  }

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Reset your Caked Leagues password",
    html: `
      <p>We got a request to reset your Caked Leagues password.</p>
      <p><a href="${resetUrl}">Click here to choose a new password</a>. This link expires in 1 hour.</p>
      <p>If you didn't request this, you can ignore this email.</p>
    `,
  });
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export async function sendFeedbackEmail(text: string, from: { name: string; email: string } | null) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.FEEDBACK_EMAIL;
  const senderLine = from ? `${escapeHtml(from.name)} (${escapeHtml(from.email)})` : "someone not signed in";

  if (!apiKey || !to) {
    console.log(`[dev] Feedback from ${from ? `${from.name} (${from.email})` : "someone not signed in"}: ${text}`);
    return;
  }

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: FROM,
    to,
    replyTo: from?.email,
    subject: "New Caked Leagues feedback",
    html: `
      <p><strong>From:</strong> ${senderLine}</p>
      <p>${escapeHtml(text).replace(/\n/g, "<br>")}</p>
    `,
  });
}
