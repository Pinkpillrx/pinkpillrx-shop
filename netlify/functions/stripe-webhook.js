const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Resend } = require('resend');
const { v4: uuidv4 } = require('uuid');
const fetch = require('node-fetch');

const resend = new Resend(process.env.RESEND_API_KEY);

const AIRTABLE_BASE = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_KEY  = process.env.AIRTABLE_API_KEY;
const AIRTABLE_URL  = `https://api.airtable.com/v0/${AIRTABLE_BASE}`;

async function airtableRequest(path, method = 'GET', body = null) {
  const opts = {
    method,
    headers: {
      'Authorization': `Bearer ${AIRTABLE_KEY}`,
      'Content-Type': 'application/json'
    }
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${AIRTABLE_URL}${path}`, opts);
  return res.json();
}

async function createOrder(fields) {
  return airtableRequest('/Orders', 'POST', { fields });
}

async function getProductDownloadURL(productId) {
  const encoded = encodeURIComponent(`{Product ID}="${productId}"`);
  const data = await airtableRequest(`/Products?filterByFormula=${encoded}`);
  if (data.records && data.records.length > 0) {
    return data.records[0].fields['Download URL'];
  }
  return null;
}

function buildDownloadEmail({ productName, downloadUrl }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Your download is ready</title>
</head>
<body style="margin:0;padding:0;background:#F9F5F4;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9F5F4;padding:40px 0">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid rgba(0,0,0,0.07);max-width:580px;width:100%">
        <tr>
          <td style="height:5px;background:linear-gradient(to right,#6BBFB8 50%,#E8939A 50%)"></td>
        </tr>
        <tr>
          <td style="padding:36px 40px 24px;text-align:center;border-bottom:1px solid rgba(0,0,0,0.06)">
            <div style="font-family:Georgia,serif;font-size:1.6rem;font-weight:900;color:#1A1A1A;">
              Pinkpill<sup style="font-size:0.9rem;color:#D4616A">Rx</sup>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px">
            <h1 style="font-family:Georgia,serif;font-size:1.9rem;font-weight:900;color:#1A1A1A;margin:0 0 12px">
              Your download is ready.
            </h1>
            <p style="font-size:1rem;color:#6B6568;line-height:1.7;margin:0 0 28px">
              Thanks for your purchase of <strong style="color:#1A1A1A">${productName}</strong>.
              Your file is one click away.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px">
              <tr>
                <td style="background:#D4616A;border-radius:100px;text-align:center">
                  <a href="${downloadUrl}" style="display:inline-block;padding:16px 40px;font-size:1rem;font-weight:700;color:#FFFFFF;text-decoration:none;">
                    Download Now
                  </a>
                </td>
              </tr>
            </table>
            <table cellpadding="0" cellspacing="0" width="100%" style="background:#F9F5F4;border-radius:10px;border:1px solid rgba(0,0,0,0.06)">
              <tr>
                <td style="padding:18px 22px">
                  <p style="font-size:0.875rem;color:#6B6568;line-height:1.6;margin:0">
                    <strong style="color:#1A1A1A">Save the PDF</strong> after downloading. Your link is good for multiple downloads so keep this email somewhere safe. If you have any trouble email <a href="mailto:pinkpillrx@gmail.com" style="color:#D4616A">pinkpillrx@gmail.com</a>.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid rgba(0,0,0,0.06);text-align:center">
            <p style="font-size:0.8rem;color:#C0B8BC;margin:0">
              PinkpillRx &bull; <a href="https://instagram.com/pinkpillrx" style="color:#C0B8BC">@pinkpillrx</a> &bull; <a href="https://tiktok.com/@kators88" style="color:#C0B8BC">@kators88</a>
            </p>
            <p style="font-size:0.75rem;color:#C0B8BC;margin:8px 0 0">Stay educated. Take the PinkPill.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildConfirmationEmail({ productName }) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background:#F9F5F4;padding:40px 24px;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid rgba(0,0,0,0.07);max-width:560px;width:100%">
        <tr><td style="height:5px;background:linear-gradient(to right,#6BBFB8 50%,#E8939A 50%)"></td></tr>
        <tr>
          <td style="padding:36px 40px">
            <div style="font-family:Georgia,serif;font-size:1.5rem;font-weight:900;color:#1A1A1A;margin-bottom:24px">
              Pinkpill<sup style="font-size:0.85rem;color:#D4616A">Rx</sup>
            </div>
            <h1 style="font-family:Georgia,serif;font-size:1.75rem;font-weight:900;color:#1A1A1A;margin:0 0 12px">Order confirmed.</h1>
            <p style="font-size:1rem;color:#6B6568;line-height:1.7;margin:0 0 20px">
              Your order for <strong style="color:#1A1A1A">${productName}</strong> is confirmed and being prepared for shipment. You will receive a shipping confirmation once it is on its way.
            </p>
            <p style="font-size:0.9rem;color:#6B6568;">Questions? Email <a href="mailto:pinkpillrx@gmail.com" style="color:#D4616A">pinkpillrx@gmail.com</a>.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 40px 24px;border-top:1px solid rgba(0,0,0,0.06);text-align:center">
            <p style="font-size:0.78rem;color:#C0B8BC;margin:0">PinkpillRx &bull; Stay educated. Take the PinkPill.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function createPrintifyOrder(session, items) {
  const shopId = process.env.PRINTIFY_SHOP_ID;
  const apiKey = process.env.PRINTIFY_API_KEY;
  if (!shopId || !apiKey) return null;

  const shipping = session.shipping_details;
  const nameParts = (shipping?.name || '').split(' ');
  const firstName = nameParts[0] || '';
  const lastName  = nameParts.slice(1).join(' ') || '';

  const lineItems = items
    .filter(i => i.type === 'physical')
    .map(i => ({
      product_id: i.printify_product_id,
      variant_id: parseInt(i.variant_id, 10),
      quantity: 1
    }));

  if (lineItems.length === 0) return null;

  const res = await fetch(`https://api.printify.com/v1/shops/${shopId}/orders.json`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      external_id: session.id,
      line_items: lineItems,
      shipping_method: 1,
      send_shipping_notification: true,
      address_to: {
        first_name: firstName,
        last_name: lastName,
        email: session.customer_details.email,
        address1: shipping?.address?.line1 || '',
        address2: shipping?.address?.line2 || '',
        city: shipping?.address?.city || '',
        state: shipping?.address?.state || '',
        zip: shipping?.address?.postal_code || '',
        country: shipping?.address?.country || 'US'
      }
    })
  });

  const data = await res.json();
  if (!res.ok) { console.error('Printify order error:', data); return null; }
  return data.id;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const sig = event.headers['stripe-signature'];
  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return { statusCode: 400,
