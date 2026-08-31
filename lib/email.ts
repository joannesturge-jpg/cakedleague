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
  const safeLeagueName = escapeHtml(leagueName);
  const leagueUrl = `${APP_URL}/leagues/${leagueId}`;
  await send(to, `You created ${leagueName}!`, leagueCreatedHtml(safeLeagueName, leagueUrl), "League created confirmation");
}

// Exported straight from the Resend Template editor, with the league name
// and invite link filled in where the static export said "a league" / linked
// to the generic dashboard.
function leagueCreatedHtml(safeLeagueName: string, leagueUrl: string) {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html dir="ltr" lang="en"><head><meta content="width=device-width" name="viewport"/><meta content="text/html; charset=UTF-8" http-equiv="Content-Type"/><meta name="x-apple-disable-message-reformatting"/><meta content="IE=edge" http-equiv="X-UA-Compatible"/><meta name="x-apple-disable-message-reformatting"/><meta content="telephone=no,address=no,email=no,date=no,url=no" name="format-detection"/><title>You successfully created ${safeLeagueName}</title><style>@media (prefers-color-scheme: dark){li::marker{color:#c4c4c4}}</style></head><body dir="ltr" lang="en"><div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0" data-skip-in-text="true">You successfully created ${safeLeagueName}</div><table border="0" width="100%" cellPadding="0" cellSpacing="0" role="presentation" align="center"><tbody><tr><td dir="ltr" lang="en" style="font-family:-apple-system, BlinkMacSystemFont, &#x27;Segoe UI&#x27;, &#x27;Roboto&#x27;, &#x27;Oxygen&#x27;, &#x27;Ubuntu&#x27;, &#x27;Cantarell&#x27;, &#x27;Fira Sans&#x27;, &#x27;Droid Sans&#x27;, &#x27;Helvetica Neue&#x27;, sans-serif;font-size:1em;min-height:100%;line-height:155%"><table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="max-width:600px;align:center;width:100%;border-radius:0px;line-height:155%"><tbody><tr style="width:100%"><td style="padding-top:0px;padding-right:0px;padding-bottom:0px;padding-left:0px"><table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation"><tbody style="width:100%"><tr style="width:100%"><td align="left" data-id="__react-email-column"><img alt="The Caked Leagues logo is displayed in white text on a dark purple background." src="https://resend-attachments.s3.amazonaws.com/b5f14108-30d6-49bb-a028-902f40ab49d0" style="display:block;outline:none;border:none;text-decoration:none;max-width:100%;border-radius:8px;height:auto" width="100%"/></td></tr></tbody></table><p style="margin:0;padding:0;font-size:1em;padding-top:0.5em;padding-bottom:0.5em"><br/></p><p style="margin:0;padding:0;font-size:1em;padding-top:0.5em;padding-bottom:0.5em"><strong>Woo hooo! You created ${safeLeagueName}!</strong></p><p style="margin:0;padding:0;font-size:1em;padding-top:0.5em;padding-bottom:0.5em">You can now <a href="${leagueUrl}" rel="noopener noreferrer nofollow" style="color:#0670DB;text-decoration-line:none;text-decoration:underline" target="_blank"><u>invite your friends to join you!</u></a></p><p style="margin:0;padding:0;font-size:1em;padding-top:0.5em;padding-bottom:0.5em">How exciting...the fun is just beginning. </p><p style="margin:0;padding:0;font-size:1em;padding-top:0.5em;padding-bottom:0.5em"><strong>Joanne</strong></p><p style="margin:0;padding:0;font-size:1em;padding-top:0.5em;padding-bottom:0.5em"><br/></p></td></tr></tbody></table></td></tr></tbody></table></body></html>`;
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
    `Picks due tomorrow: ${leagueName}`,
    emailShell(
      `${firstName}, picks are due tomorrow`,
      `<p>Your picks for <strong>${escapeHtml(leagueName)}</strong> are due ${escapeHtml(dueLabel)}. Get them in before the deadline.</p>`,
      "Submit picks",
      `${APP_URL}/leagues/${leagueId}`
    ),
    "Picks due reminder"
  );
}
