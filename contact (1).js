// Vercel serverless function: POST /api/contact
// Sends contact-form messages to CONTACT_TO_EMAIL via Resend (https://resend.com).
// Required env vars: RESEND_API_KEY, CONTACT_TO_EMAIL. Optional: CONTACT_FROM_EMAIL.

const LIMITS = { name: 100, email: 200, message: 5000 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Light per-instance rate limit (5 messages / 10 min per IP). Resets on cold start.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}

const escapeHtml = (s) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Strip line breaks so nobody can inject extra headers through the subject line
const oneLine = (s) => s.replace(/[\r\n]+/g, " ");

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Use POST." });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body && typeof body === "object" ? body : {};

  // Bots fill in the hidden "website" field: pretend success, send nothing
  if (body.website) return res.status(200).json({ ok: true });

  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim();
  const message = String(body.message || "").trim();

  if (!name || name.length > LIMITS.name)
    return res.status(400).json({ ok: false, error: "Name is missing or too long." });
  if (!EMAIL_RE.test(email) || email.length > LIMITS.email)
    return res.status(400).json({ ok: false, error: "Email address is not valid." });
  if (message.length < 10 || message.length > LIMITS.message)
    return res.status(400).json({ ok: false, error: "Message must be 10 to 5000 characters." });

  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  if (rateLimited(ip))
    return res.status(429).json({ ok: false, error: "Too many messages. Try again in a few minutes." });

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL || "Website contact form <onboarding@resend.dev>";

  if (!apiKey || !to) {
    console.error("contact: RESEND_API_KEY or CONTACT_TO_EMAIL is not set");
    return res.status(500).json({ ok: false, error: "The form is not configured yet." });
  }

  const safeName = oneLine(name);
  const text = `New message from your website\n\nName: ${safeName}\nEmail: ${email}\n\n${message}\n`;
  const html = `
    <p><strong>New message from your website</strong></p>
    <p>Name: ${escapeHtml(safeName)}<br>Email: <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
    <p style="white-space:pre-wrap">${escapeHtml(message)}</p>`;

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject: `Website message from ${safeName}`.slice(0, 150),
        text,
        html,
      }),
    });

    if (!r.ok) {
      console.error("contact: Resend error", r.status, await r.text());
      return res.status(502).json({ ok: false, error: "The email service rejected the message." });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("contact: request failed", err);
    return res.status(502).json({ ok: false, error: "Could not reach the email service." });
  }
}
