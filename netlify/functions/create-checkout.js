// netlify/functions/create-checkout.js
// Creates a Stripe Checkout session for digital or physical products.

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { items, mode } = JSON.parse(event.body);

    if (!items || items.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No items provided.' }) };
    }

    const hasPhysical = items.some(i => i.type === 'physical');

    const lineItems = items.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          ...(item.image ? { images: [item.image] } : {}),
          metadata: {
            product_id: item.id,
            product_type: item.type,
            printify_product_id: item.printifyProductId || '',
            variant_id: item.variantId || '',
            variant_label: item.variantLabel || ''
          }
        },
        unit_amount: item.price
      },
      quantity: item.quantity || 1
    }));

    const sessionConfig = {
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.URL}/cancel.html`,
      customer_creation: 'always',
      metadata: {
        product_id: items[0].id,
        product_type: items[0].type,
        printify_product_id: items[0].printifyProductId || '',
        variant_id: items[0].variantId || ''
      }
    };

    if (hasPhysical) {
      sessionConfig.shipping_address_collection = {
        allowed_countries: ['US', 'CA', 'GB', 'AU', 'NZ', 'IE']
      };
      sessionConfig.shipping_options = [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: 0, currency: 'usd' },
            display_name: 'Standard Shipping',
            delivery_estimate: {
              minimum: { unit: 'business_day', value: 5 },
              maximum: { unit: 'business_day', value: 12 }
            }
          }
        }
      ];
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: session.url })
    };

  } catch (err) {
    console.error('Checkout error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
