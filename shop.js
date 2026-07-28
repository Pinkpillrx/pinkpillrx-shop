# PinkpillRx Shop — Setup Guide

Complete setup from zero to live. Follow these steps in order.

---

## What You're Building

- Storefront hosted on Netlify
- Stripe Checkout for payments (credit, debit, Apple Pay)
- Airtable as your product and order database
- Resend for automated email delivery
- Printify for print-on-demand merch fulfillment
- Token-based secure PDF delivery

---

## Step 1 — Airtable Setup

Go to airtable.com → open your workspace → create a new Base called **PinkpillRx Shop**.

### Table 1: Products

Create these fields exactly:

| Field Name     | Field Type  | Notes                                      |
|----------------|-------------|--------------------------------------------|
| Product ID     | Single line | Unique ID. e.g. `ebook-main`, `guide-adhd` |
| Name           | Single line | Display name on the site                   |
| Type           | Single select | Options: `digital`, `physical`            |
| Price          | Number      | In cents. $14.99 = `1499`                  |
| Description    | Long text   | Short blurb shown on product card          |
| Image URL      | URL         | Optional product image                     |
| Download URL   | URL         | **PDF link goes here** (see Step 5)        |
| Active         | Checkbox    | Checked = visible on site                  |
| Order          | Number      | Controls display order (1, 2, 3...)        |

**Add your ebook row:**

| Field      | Value                                              |
|------------|----------------------------------------------------|
| Product ID | `ebook-main`                                       |
| Name       | How to Talk to Men Who Don't Get It                |
| Type       | digital                                            |
| Price      | `1499` (or whatever price you set in dollars × 100)|
| Description| A Guide for Women Who Are Tired of Explaining.     |
| Download URL| Your PDF link (see Step 5)                        |
| Active     | ✓ Checked                                          |
| Order      | 1                                                  |

### Table 2: Orders

Create these fields:

| Field Name      | Field Type  |
|-----------------|-------------|
| Order ID        | Single line |
| Customer Email  | Email       |
| Product Name    | Single line |
| Product ID      | Single line |
| Product Type    | Single line |
| Download Token  | Single line |
| Download Count  | Number      |
| Amount Paid     | Currency    |
| Created At      | Date/Time   |
| Fulfilled       | Checkbox    |

---

## Step 2 — Get Your Airtable Credentials

1. Go to **airtable.com/create/tokens**
2. Click **Create new token**
3. Name it: `PinkpillRx Shop`
4. Scopes: add `data.records:read` and `data.records:write`
5. Access: select your **PinkpillRx Shop** base
6. Click **Create token** and copy it — this is your `AIRTABLE_API_KEY`

Get your Base ID:
1. Open your base in Airtable
2. Look at the URL: `https://airtable.com/appXXXXXXXXXXXXXX/...`
3. The part that starts with `app` is your `AIRTABLE_BASE_ID`

---

## Step 3 — Resend Setup (Email Delivery)

1. Go to **resend.com** and create a free account
2. Go to **API Keys** → create a new key → copy it (`RESEND_API_KEY`)
3. Go to **Domains** → add your sending domain

**Important:** The emails send from `orders@pinkpillrx.org`. You need to either:
- Add `pinkpillrx.org` as a verified domain in Resend (recommended), OR
- Change the `from` address in `stripe-webhook.js` to your verified Resend domain

For the free plan, you can also use `onboarding@resend.dev` to test before verifying a domain.

---

## Step 4 — Stripe Setup

1. Log into your Stripe dashboard at **dashboard.stripe.com**
2. Make sure you're in **Test mode** first

**Get your API keys:**
1. Go to **Developers → API Keys**
2. Copy your **Publishable key** (starts with `pk_`) — not needed in env vars but good to have
3. Copy your **Secret key** (starts with `sk_`) — this is `STRIPE_SECRET_KEY`

**Set up the webhook:**
1. After you deploy to Netlify (Step 7), come back here
2. Go to **Developers → Webhooks → Add endpoint**
3. Endpoint URL: `https://YOUR-SITE.netlify.app/api/stripe-webhook`
4. Events to listen for: select **checkout.session.completed**
5. Click **Add endpoint**
6. Click the webhook → **Reveal signing secret** → copy it → `STRIPE_WEBHOOK_SECRET`

---

## Step 5 — Host Your PDF (Updatable)

The PDF URL lives in Airtable. To update the ebook later, upload the new PDF and update the URL — no code changes.

**Recommended: Google Drive**
1. Upload your PDF to Google Drive
2. Right-click → **Share** → change to "Anyone with the link can view"
3. Copy the share link. It looks like: `https://drive.google.com/file/d/FILE_ID/view`
4. Convert it to a direct download link:
   `https://drive.google.com/uc?export=download&id=FILE_ID`
5. Paste this URL into the **Download URL** field in your Airtable Products table

**To update the PDF later:**
1. Upload the new version to Google Drive
2. Get its new direct download link
3. Update the **Download URL** field in Airtable
4. Done — customers who click old download emails will get the new version automatically

---

## Step 6 — Printify Setup (Merch)

1. Log into **printify.com**
2. Go to **My stores** → your store → copy the shop ID from the URL
   (looks like a number, e.g. `12345678`) — this is `PRINTIFY_SHOP_ID`
3. Go to **Account → Connections → API** → generate an API token → `PRINTIFY_API_KEY`
4. Create your products in Printify and set them to **Published** (visible = true)
5. They'll appear automatically in the Merch section of the shop

---

## Step 7 — Deploy to Netlify

**Push to GitHub first:**
```bash
cd pinkpillrx-shop
git init
git add .
git commit -m "Initial shop build"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/pinkpillrx-shop.git
git push -u origin main
```

**Connect to Netlify:**
1. Go to **app.netlify.com** → **Add new site → Import an existing project**
2. Connect GitHub → select `pinkpillrx-shop`
3. Build settings: leave everything as default (netlify.toml handles it)
4. Click **Deploy site**

---

## Step 8 — Add Environment Variables in Netlify

After deploying:
1. Go to **Site settings → Environment variables → Add a variable**
2. Add all of these:

| Variable               | Where to get it                        |
|------------------------|----------------------------------------|
| `STRIPE_SECRET_KEY`    | Stripe → Developers → API Keys        |
| `STRIPE_WEBHOOK_SECRET`| Stripe → Webhooks → signing secret    |
| `AIRTABLE_API_KEY`     | Airtable → Personal access tokens     |
| `AIRTABLE_BASE_ID`     | Airtable URL (starts with `app`)      |
| `RESEND_API_KEY`       | Resend → API Keys                     |
| `PRINTIFY_API_KEY`     | Printify → Account → API              |
| `PRINTIFY_SHOP_ID`     | Printify → store URL                  |
| `URL`                  | Your Netlify URL (e.g. `https://your-site.netlify.app`) |

3. After adding all variables, go to **Deploys → Trigger deploy → Deploy site**

---

## Step 9 — Add Stripe Webhook

Now that your site is live:
1. Go back to Stripe → **Developers → Webhooks → Add endpoint**
2. URL: `https://YOUR-SITE.netlify.app/api/stripe-webhook`
3. Event: `checkout.session.completed`
4. Save → copy the **Signing secret** → add it as `STRIPE_WEBHOOK_SECRET` in Netlify
5. Redeploy

---

## Step 10 — Update the Ebook Price

The ebook price is set in two places. Update both:

1. **In `index.html`:** Find `$14.99` and change it (appears twice — in the hero and in the shop grid)
2. **In `index.html`:** Find `price:1499` (appears twice) and change to your price × 100
   (e.g. $19.99 = `1999`, $9.99 = `999`)
3. **In Airtable:** Update the `Price` field in the ebook row to match

---

## How to Add More Digital Products

1. In Airtable → Products table → add a new row
2. Fill in: Product ID, Name, Type (`digital`), Price (cents), Description, Download URL
3. Check the **Active** checkbox
4. The product appears on the site within 5 minutes (cached)
5. Upload the PDF anywhere (Google Drive, Dropbox) → paste the direct download link in **Download URL**

---

## How to Update the Ebook (or Any PDF)

1. Upload the new PDF to Google Drive
2. Get the direct download link
3. Go to Airtable → Products → find the product row → update **Download URL**
4. Done. All future downloads (including people who bought before) will get the new version

---

## How to View All Orders

Open Airtable → Orders table. Every purchase creates a row automatically with:
- Customer email
- What they bought
- How many times they've downloaded
- Whether it was fulfilled

---

## Test Before Going Live

1. Use Stripe test card: `4242 4242 4242 4242`, any future date, any CVV
2. Make a test purchase
3. Check your Airtable Orders table — a new row should appear
4. Check the customer email — a download link should arrive
5. Click the download link — it should redirect to the PDF

Once testing works, switch Stripe from **Test mode** to **Live mode** and update `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in Netlify with your live keys.

---

## Questions or Stuck?

Email pinkpillrx@gmail.com or reach out to whoever built this for you.
The key things to have ready before reaching out: your Netlify site URL, the specific step you're on, and any error messages you're seeing.
