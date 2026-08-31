import { Resend } from "resend";

const FROM = process.env.EMAIL_FROM ?? "Caked Leagues <onboarding@resend.dev>";
const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

// Simple placeholder styling, swapped out once a designed template (built in
// Resend's Template editor) replaces this markup.
function emailShell(title: string, bodyHtml: string, ctaLabel: string, ctaUrl: string) {
  return `
    <div style="font-family: -apple-system, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #16181D;">
      <div style="font-size: 13px; font-weight: 700; letter-spacing: 0.08em; color: #7B2CF5; margin-bottom: 20px;">CAKED LEAGUES</div>
      <h1 style="font-size: 22px; margin: 0 0 14px; line-height: 1.3;">${title}</h1>
      <div style="font-size: 15px; line-height: 1.6; color: #3A3F47;">${bodyHtml}</div>
      <a href="${ctaUrl}" style="display: inline-block; margin-top: 24px; padding: 12px 22px; border-radius: 999px; background: #7B2CF5; color: #fff; text-decoration: none; font-weight: 700; font-size: 14px;">${ctaLabel}</a>
      <p style="font-size: 12px; color: #9aa0aa; margin-top: 36px;">Caked Leagues &mdash; draft anything.</p>
    </div>
  `;
}

async function send(to: string, subject: string, html: string, context: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[dev] ${context} to ${to}: ${subject}`);
    return;
  }
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({ from: FROM, to, subject, html });
  if (error) {
    console.error(`[email] ${context} to ${to} failed:`, error);
  }
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  await send(
    to,
    "Reset your Caked Leagues password",
    `
      <p>We got a request to reset your Caked Leagues password.</p>
      <p><a href="${resetUrl}">Click here to choose a new password</a>. This link expires in 1 hour.</p>
      <p>If you didn't request this, you can ignore this email.</p>
    `,
    "Password reset"
  );
}

export async function sendFeedbackEmail(text: string, from: { name: string; email: string } | null) {
  const to = process.env.FEEDBACK_EMAIL;
  const senderLine = from ? `${escapeHtml(from.name)} (${escapeHtml(from.email)})` : "someone not signed in";

  if (!to) {
    console.log(`[dev] Feedback from ${from ? `${from.name} (${from.email})` : "someone not signed in"}: ${text}`);
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[dev] Feedback from ${senderLine}: ${text}`);
    return;
  }
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: FROM,
    to,
    replyTo: from?.email,
    subject: "New Caked Leagues feedback",
    html: `
      <p><strong>From:</strong> ${senderLine}</p>
      <p>${escapeHtml(text).replace(/\n/g, "<br>")}</p>
    `,
  });
  if (error) {
    console.error(`[email] Feedback email to ${to} failed:`, error);
  }
}

export async function sendSignupConfirmationEmail(to: string, name: string) {
  const firstName = escapeHtml(name.split(" ")[0] || name);
  await send(
    to,
    "Welcome to Caked Leagues",
    emailShell(
      `Welcome, ${firstName}!`,
      `<p>Your account is ready. Start a league for your group chat's next obsession, or join one with an invite link.</p>`,
      "Go to my leagues",
      `${APP_URL}/dashboard`
    ),
    "Signup confirmation"
  );
}

export async function sendLeagueCreatedEmail(to: string, name: string, leagueName: string, leagueId: string) {
  const firstName = escapeHtml(name.split(" ")[0] || name);
  await send(
    to,
    `${leagueName} is live`,
    emailShell(
      `${firstName}, your league is live`,
      `<p><strong>${escapeHtml(leagueName)}</strong> is ready to go. Share the invite link from your league page to bring people in.</p>`,
      "View league",
      `${APP_URL}/leagues/${leagueId}`
    ),
    "League created confirmation"
  );
}

export async function sendLeagueJoinedEmail(to: string, name: string, leagueName: string, leagueId: string) {
  const firstName = escapeHtml(name.split(" ")[0] || name);
  await send(
    to,
    `You're in: ${leagueName}`,
    emailShell(
      `${firstName}, you're in`,
      `<p>You've joined <strong>${escapeHtml(leagueName)}</strong>. Head to the league page for the scoring rules and when picks are due.</p>`,
      "View league",
      `${APP_URL}/leagues/${leagueId}`
    ),
    "League joined confirmation"
  );
}

export async function sendPicksDueReminderEmail(
  to: string,
  name: string,
  leagueName: string,
  dueLabel: string,
  leagueId: string
) {
  const firstName = escapeHtml(name.split(" ")[0] || name);
  await send(
    to,
    `Picks due today: ${leagueName}`,
    emailShell(
      `${firstName}, picks are due today`,
      `<p>Your picks for <strong>${escapeHtml(leagueName)}</strong> are due ${escapeHtml(dueLabel)}. Get them in before the deadline.</p>`,
      "Submit picks",
      `${APP_URL}/leagues/${leagueId}`
    ),
    "Picks due reminder"
  );
}
