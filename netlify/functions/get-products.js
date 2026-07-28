const fetch = require('node-fetch');

const AIRTABLE_BASE = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_KEY  = process.env.AIRTABLE_API_KEY;
const AIRTABLE_URL  = `https://api.airtable.com/v0/${AIRTABLE_BASE}`;

async function getDigitalProducts() {
  const filter = encodeURIComponent(`AND({Active}=TRUE(), {Type}="digital", {Product ID}!="ebook-main")`);
  const url = `${AIRTABLE_URL}/Products?filterByFormula=${filter}&sort[0][field]=Order&sort[0][direction]=asc`;

  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${AIRTABLE_KEY}` }
  });

  const data = await res.json();
  if (!data.records) return [];

  return data.records.map(r => ({
    id:          r.fields['Product ID'] || r.id,
    name:        r.fields['Name']       || '',
    description: r.fields['Description']|| '',
    price:       r.fields['Price']      || 0,
    image:       r.fields['Image URL']  || null,
    type:        'digital'
  }));
}

async function getPrintifyProducts() {
  const shopId = process.env.PRINTIFY_SHOP_ID;
  const apiKey = process.env.PRINTIFY_API_KEY;

  if (!shopId || !apiKey) return [];

  const res = await fetch(
    `https://api.printify.com/v1/shops/${shopId}/products.json?limit=20`,
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'User-Agent': 'PinkpillRx-Shop/1.0'
      }
    }
  );

  if (!res.ok) {
    console.error('Printify fetch error:', res.status);
    return [];
  }

  const data = await res.json();
  const products = data.data || [];

  return products
    .filter(p => p.visible)
    .map(p => {
      const image = p.images?.find(i => i.is_default)?.src || p.images?.[0]?.src || null;
      const variants = (p.variants || [])
        .filter(v => v.is_enabled)
        .map(v => ({
          id:    v.id,
          price: v.price,
          options: {
            size:  v.options?.find(o => o.name === 'size')?.value  || null,
            color: v.options?.find(o => o.name === 'color')?.value || null
          }
        }));

      return {
        id:          `printify-${p.id}`,
        printifyId:  p.id,
        name:        p.title,
        description: (p.description || '').replace(/<[^>]*>/g, '').slice(0, 120) + '...',
        image,
        variants,
        type: 'physical'
      };
    });
}

exports.handler = async (event) => {
  const type = event.queryStringParameters?.type || 'digital';

  try {
    let products = [];

    if (type === 'digital') {
      products = await getDigitalProducts();
    } else if (type === 'physical') {
      products = await getPrintifyProducts();
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=300'
      },
      body: JSON.stringify(products)
    };

  } catch (err) {
    console.error('get-products error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
