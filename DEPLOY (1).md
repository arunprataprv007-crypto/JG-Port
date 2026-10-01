# Deploy your website on Vercel (free), step by step

Your project folder contains:

```
index.html        the page
styles.css        all styling and animations
script.js         interactions + contact form logic
favicon.svg       browser tab icon
assets/jaya.jpg   your photo
api/contact.js    the BACKEND (serverless function that emails you form messages)
vercel.json       Vercel settings (security headers, caching)
package.json      project info
.env.example      the environment variables you will set on Vercel
```

Vercel has no drag-and-drop upload for folders, so you use **GitHub** (easiest, and
gives you automatic updates) or the **Vercel CLI**. Both are free.

---

## Part 1: Get a free email-sending key (needed for the contact form)

The form posts to `api/contact.js`, which sends the email through Resend (free tier).

1. Go to https://resend.com and sign up with the email address where you want to receive messages.
2. In the dashboard open **API Keys** and click **Create API Key**. Choose "Sending access".
3. Copy the key (starts with `re_`). You will only see it once.

Notes:
- With no domain set up, Resend lets you send from `onboarding@resend.dev`, but **only to the
  email you signed up with**. That is exactly what you need, so use the same email in step 1 and
  for `CONTACT_TO_EMAIL` below.
- Later, if you own a domain, you can verify it in Resend and set `CONTACT_FROM_EMAIL`.

---

## Part 2A: Deploy with GitHub (recommended)

1. **Create a GitHub account** at https://github.com if you do not have one.
2. Click **New repository**. Name it `jaya-portfolio`. Keep it Public or Private (both work). Create it.
3. On the empty repo page click **uploading an existing file**. Unzip the project on your
   computer, then drag **all the files and folders inside it** (including `api` and `assets`) into the page.
   Make sure `index.html` is at the top level of the repo, not inside an extra folder.
   Click **Commit changes**.
4. Go to https://vercel.com and click **Sign Up**, then **Continue with GitHub**. Choose the free **Hobby** plan.
5. Click **Add New... > Project**, find `jaya-portfolio` and click **Import**.
6. On the configuration screen:
   - **Framework Preset:** Other
   - **Build Command / Output Directory:** leave empty
   - Open **Environment Variables** and add:

     | Name | Value |
     |---|---|
     | `RESEND_API_KEY` | the `re_...` key from Part 1 |
     | `CONTACT_TO_EMAIL` | the email you signed up to Resend with |

7. Click **Deploy**. After about 30 seconds you get a live link like `https://jaya-portfolio.vercel.app`.
8. Open the link, send yourself a test message through the form, and check your inbox (and spam folder once).

**Updating later:** edit a file on GitHub (pencil icon) and commit. Vercel redeploys automatically.

---

## Part 2B: Deploy with the Vercel CLI (alternative)

1. Install Node.js (LTS) from https://nodejs.org.
2. Open a terminal inside the unzipped project folder and run:
   ```
   npm install -g vercel
   vercel login
   vercel
   ```
   Answer the prompts: set up and deploy? **Y**. Link to existing project? **N**. Accept the defaults.
3. Add the environment variables:
   ```
   vercel env add RESEND_API_KEY
   vercel env add CONTACT_TO_EMAIL
   ```
   Choose **Production** (and Preview/Development if you like) when asked, and paste each value.
4. Publish to production:
   ```
   vercel --prod
   ```

Preview locally first (optional): run `vercel dev` and open http://localhost:3000.
(Opening `index.html` by double-click works for the design, but the form needs `vercel dev` or the live site.)

---

## Part 3: Your own web address (optional)

- The free `*.vercel.app` address works forever on the free plan.
- To rename it: Project > **Settings > Domains** and edit the Vercel domain.
- To use a custom domain such as `jayagaur.com`, buy one from any registrar (this part is not free),
  then add it under **Settings > Domains** and follow the DNS instructions Vercel shows.

---

## Part 4: Things to personalise

- **Email address:** it appears in `index.html` (search for `jjaya.gaur@work-force.co.uk`) and in
  `script.js` (`FALLBACK_EMAIL`). It is currently your work address from your CV, so consider
  switching to a personal one on a public site.
- **Phone number:** deliberately left off, because public pages get scraped. Add it in the contact section if you want.
- **Download CV button:** save your CV as a PDF named `Jaya_Gaur_CV.pdf` inside `assets/`. The button only appears when that file exists. Check the PDF first: your Word file contains your phone number and an "INTERNAL - Vertage" footer you may not want public.
- **Photo:** replace `assets/jaya.jpg` with another square image of the same name.
- **Text and dates:** all content is plain HTML in `index.html`.
- **Share preview image:** add `<meta property="og:image" content="https://YOUR-URL/assets/jaya.jpg">` in `<head>` once you know your live URL.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Form says "did not send" | Check both environment variables exist in Vercel (Settings > Environment Variables), then **Redeploy** (Deployments > ... > Redeploy). Variables only apply to new deployments. |
| Resend returns an error in the logs | `onboarding@resend.dev` can only send to your own Resend sign-up email. Make `CONTACT_TO_EMAIL` match it. |
| 404 on the live site | `index.html` must be at the top of the repo, not in a sub-folder. |
| Fonts look different | Fonts load from Google Fonts, so they only appear when online. |
| Where are the logs? | Vercel > your project > **Logs** (or Deployments > Functions). |

## Privacy note

The contact form collects visitors' names and email addresses. Keep the line under the form, only
use details to reply, and add a short privacy notice if you plan to store or share them.
Vercel's Hobby plan is intended for personal, non-commercial use, which suits a personal CV site.
