import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import * as cheerio from 'cheerio';

interface Product {
  name: string;
  sku?: string;
  category?: string;
}

interface PriceData {
  product: string;
  ssp_uk?: string;
  ssp_eu?: string;
  sources: Array<{
    name: string;
    url: string;
    price: string;
    currency: string;
  }>;
  competitors: Array<{
    brand: string;
    product: string;
    sources: Array<{
      name: string;
      url: string;
      price: string;
      currency: string;
    }>;
  }>;
}

// Competitor mapping for Blackstar products
const competitorMap: { [key: string]: Array<{ brand: string; product: string; searchTerm: string }> } = {
  'amp': [
    { brand: 'Boss', product: 'Katana', searchTerm: 'boss katana' },
    { brand: 'Fender', product: 'Mustang', searchTerm: 'fender mustang' },
    { brand: 'Marshall', product: 'MG', searchTerm: 'marshall mg' }
  ],
  'core': [
    { brand: 'Boss', product: 'Katana Mini', searchTerm: 'boss katana mini' },
    { brand: 'Fender', product: 'Champion', searchTerm: 'fender champion' },
    { brand: 'Orange', product: 'Crush', searchTerm: 'orange crush' }
  ],
  'pedal': [
    { brand: 'Boss', product: 'DS-1', searchTerm: 'boss ds-1' },
    { brand: 'Ibanez', product: 'Tube Screamer', searchTerm: 'ibanez tube screamer' },
    { brand: 'MXR', product: 'Distortion', searchTerm: 'mxr distortion' }
  ]
};

function getCompetitors(productName: string): Array<{ brand: string; product: string; searchTerm: string }> {
  const name = productName.toLowerCase();

  if (name.includes('core') || name.includes('id:core')) {
    return competitorMap['core'];
  } else if (name.includes('pedal')) {
    return competitorMap['pedal'];
  } else if (name.includes('amp')) {
    return competitorMap['amp'];
  }

  return competitorMap['amp']; // Default to amp competitors
}

async function searchThommannDE(searchTerm: string): Promise<{ url: string; price: string } | null> {
  try {
    const searchUrl = `https://www.thomann.de/intl/search.html?sw=${encodeURIComponent(searchTerm)}`;
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);

    // Find first product link
    const productLink = $('.product__title a').first().attr('href');
    if (!productLink) return null;

    const fullUrl = productLink.startsWith('http') ? productLink : `https://www.thomann.de${productLink}`;

    // Get price from search results
    let price = $('.product__price').first().text().trim();

    // If we have a URL, try to get more accurate price from product page
    if (fullUrl) {
      try {
        const productResponse = await axios.get(fullUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          timeout: 10000
        });
        const $product = cheerio.load(productResponse.data);

        // Try different price selectors
        const priceSelectors = [
          '.price-info__price',
          '.price',
          '[data-price]',
          '.product-price'
        ];

        for (const selector of priceSelectors) {
          const foundPrice = $product(selector).first().text().trim();
          if (foundPrice && foundPrice.match(/\d/)) {
            price = foundPrice;
            break;
          }
        }
      } catch (error) {
        // Use price from search results
      }
    }

    // Clean price
    price = price.replace(/[^\d,.\s€]/g, '').trim();

    return { url: fullUrl, price: price || 'N/A' };
  } catch (error) {
    console.error(`Error searching Thomann DE for ${searchTerm}:`, error);
    return null;
  }
}

async function searchThommannUK(searchTerm: string): Promise<{ url: string; price: string } | null> {
  try {
    const searchUrl = `https://www.thomann.co.uk/search.html?sw=${encodeURIComponent(searchTerm)}`;
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);

    const productLink = $('.product__title a').first().attr('href');
    if (!productLink) return null;

    const fullUrl = productLink.startsWith('http') ? productLink : `https://www.thomann.co.uk${productLink}`;

    let price = $('.product__price').first().text().trim();

    if (fullUrl) {
      try {
        const productResponse = await axios.get(fullUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          timeout: 10000
        });
        const $product = cheerio.load(productResponse.data);

        const priceSelectors = [
          '.price-info__price',
          '.price',
          '[data-price]',
          '.product-price'
        ];

        for (const selector of priceSelectors) {
          const foundPrice = $product(selector).first().text().trim();
          if (foundPrice && foundPrice.match(/\d/)) {
            price = foundPrice;
            break;
          }
        }
      } catch (error) {
        // Use price from search results
      }
    }

    price = price.replace(/[^\d,.\s£]/g, '').trim();

    return { url: fullUrl, price: price || 'N/A' };
  } catch (error) {
    console.error(`Error searching Thomann UK for ${searchTerm}:`, error);
    return null;
  }
}

async function getSSPPrices(productName: string): Promise<{ ssp_uk?: string; ssp_eu?: string }> {
  // Mock SSP data - in production, this would query Blackstar's official pricing
  const ssp: { [key: string]: { uk: string; eu: string } } = {
    'id core 10': { uk: '139.99 GBP', eu: '199 EUR' },
    'id:core 10': { uk: '139.99 GBP', eu: '199 EUR' },
    'id core 20': { uk: '199.99 GBP', eu: '279 EUR' },
    'id:core 20': { uk: '199.99 GBP', eu: '279 EUR' },
    'id core 40': { uk: '299.99 GBP', eu: '399 EUR' },
    'id:core 40': { uk: '299.99 GBP', eu: '399 EUR' },
  };

  const name = productName.toLowerCase();
  for (const [key, value] of Object.entries(ssp)) {
    if (name.includes(key)) {
      return { ssp_uk: value.uk, ssp_eu: value.eu };
    }
  }

  return { ssp_uk: 'N/A', ssp_eu: 'N/A' };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PriceData | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { product }: { product: Product } = req.body;

  if (!product || !product.name) {
    return res.status(400).json({ error: 'Product name is required' });
  }

  try {
    const result: PriceData = {
      product: product.name,
      sources: [],
      competitors: []
    };

    // Get SSP prices
    const ssp = await getSSPPrices(product.name);
    result.ssp_uk = ssp.ssp_uk;
    result.ssp_eu = ssp.ssp_eu;

    // Search Thomann DE
    const thomannDE = await searchThommannDE(product.name);
    if (thomannDE) {
      result.sources.push({
        name: 'Thomann DE',
        url: thomannDE.url,
        price: thomannDE.price,
        currency: 'EUR'
      });
    }

    // Search Thomann UK
    const thomannUK = await searchThommannUK(product.name);
    if (thomannUK) {
      result.sources.push({
        name: 'Thomann UK',
        url: thomannUK.url,
        price: thomannUK.price,
        currency: 'GBP'
      });
    }

    // Get competitors
    const competitors = getCompetitors(product.name);

    for (const competitor of competitors) {
      const compData = {
        brand: competitor.brand,
        product: competitor.product,
        sources: [] as Array<{ name: string; url: string; price: string; currency: string }>
      };

      // Search competitor on Thomann DE
      const compDE = await searchThommannDE(competitor.searchTerm);
      if (compDE) {
        compData.sources.push({
          name: 'Thomann DE',
          url: compDE.url,
          price: compDE.price,
          currency: 'EUR'
        });
      }

      // Search competitor on Thomann UK
      const compUK = await searchThommannUK(competitor.searchTerm);
      if (compUK) {
        compData.sources.push({
          name: 'Thomann UK',
          url: compUK.url,
          price: compUK.price,
          currency: 'GBP'
        });
      }

      if (compData.sources.length > 0) {
        result.competitors.push(compData);
      }
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Error scraping:', error);
    res.status(500).json({ error: 'Failed to scrape product data' });
  }
}
