# Blackstar Price Scraper - Deployment Complete

## 🚀 Live URL
**https://agentic-20de9077.vercel.app**

## 📋 Features

### Main Functionality
- **Upload Product List**: Upload an Excel file (.xlsx, .xls, or .csv) containing Blackstar products
- **Automatic Price Scraping**: Scrapes street prices from multiple sources (Thomann DE, Thomann UK)
- **SSP Pricing**: Displays Suggested Selling Price (SSP) for UK and EU markets
- **Competitor Analysis**: Automatically finds and prices competitor products (Boss, Fender, Marshall, Orange, etc.)
- **Export to Excel**: Download all scraped data in structured Excel format

### Data Sources
- Thomann DE (EUR pricing)
- Thomann UK (GBP pricing)

### Competitor Brands
- Boss (Katana series)
- Fender (Mustang, Champion series)
- Marshall (MG series)
- Orange (Crush series)
- Ibanez (Tube Screamer)
- MXR (Distortion pedals)

## 📊 Excel File Format

Your Excel file should contain these columns:
- **Product Name** (required): e.g., "Blackstar ID Core 10 V4"
- **SKU** (optional): Product SKU code
- **Category** (optional): Product category

Example:
```
Product Name                    | SKU          | Category
Blackstar ID Core 10 V4         | IDCORE10V4   | Amplifier
Blackstar ID Core 20 V4         | IDCORE20V4   | Amplifier
Blackstar HT-1R MkII            | HT1RMKII     | Amplifier
```

## 🎯 How to Use

1. **Visit**: https://agentic-20de9077.vercel.app
2. **Upload**: Click "Choose File" and select your Excel file with Blackstar products
3. **Scrape**: Click "Start Scraping" to begin collecting price data
4. **Wait**: The system will process each product (about 2-3 seconds per product)
5. **Export**: Click "Export to Excel" to download the complete price data

## 📦 Output Data Format

For each product, you'll receive:
- **Product Name**: Original Blackstar product
- **SSP UK**: Suggested Selling Price in GBP
- **SSP EU**: Suggested Selling Price in EUR
- **Source Prices**: Street prices from Thomann DE and UK with URLs
- **Competitor Products**: Similar products from competitor brands with their prices

Example output:
```
Product: Blackstar ID Core 10 V4
SSP UK: 139.99 GBP
SSP EU: 199 EUR

Street Prices:
- Thomann DE: 128 EUR (https://www.thomann.de/...)
- Thomann UK: 115 GBP (https://www.thomann.co.uk/...)

Competitors:
- Boss Katana Mini
  - Thomann DE: 109 EUR
  - Thomann UK: 98 GBP
```

## 🔧 Technical Details

### Stack
- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Scraping**: Axios + Cheerio
- **Excel Processing**: xlsx library

### API Endpoint
- `POST /api/scrape`: Scrapes price data for a single product

### Rate Limiting
- 2-second delay between product requests to avoid overwhelming sources

## 🛠️ Local Development

```bash
npm install
npm run dev
```

Visit http://localhost:3000

## 📝 Notes

- SSP prices are based on reference data and should be verified with official Blackstar pricing
- Competitor matching is automatic based on product category detection
- Web scraping may occasionally fail due to website changes or rate limiting
- The tool includes retry logic and error handling for reliability
