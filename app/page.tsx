'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';

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

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [results, setResults] = useState<PriceData[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = event.target?.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      const productList = jsonData.map((row: any) => ({
        name: row['Product Name'] || row['Product'] || row['Name'] || '',
        sku: row['SKU'] || row['sku'] || '',
        category: row['Category'] || row['category'] || ''
      }));

      setProducts(productList);
    };
    reader.readAsBinaryString(file);
  };

  const handleScrape = async () => {
    if (products.length === 0) {
      alert('Please upload a product file first');
      return;
    }

    setLoading(true);
    setResults([]);

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      setProgress(`Scraping ${i + 1}/${products.length}: ${product.name}`);

      try {
        const response = await fetch('/api/scrape', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ product }),
        });

        if (response.ok) {
          const data = await response.json();
          setResults(prev => [...prev, data]);
        }
      } catch (error) {
        console.error(`Error scraping ${product.name}:`, error);
      }

      // Delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    setLoading(false);
    setProgress('Scraping complete!');
  };

  const exportToExcel = () => {
    const exportData: any[] = [];

    results.forEach(result => {
      // Main product row
      const mainRow: any = {
        'Product': result.product,
        'SSP UK': result.ssp_uk || 'N/A',
        'SSP EU': result.ssp_eu || 'N/A',
        'Type': 'Main Product'
      };

      result.sources.forEach((source, idx) => {
        mainRow[`Source ${idx + 1} Name`] = source.name;
        mainRow[`Source ${idx + 1} URL`] = source.url;
        mainRow[`Source ${idx + 1} Price`] = `${source.price} ${source.currency}`;
      });

      exportData.push(mainRow);

      // Competitor rows
      result.competitors.forEach(competitor => {
        const compRow: any = {
          'Product': result.product,
          'SSP UK': '',
          'SSP EU': '',
          'Type': 'Competitor',
          'Competitor Brand': competitor.brand,
          'Competitor Product': competitor.product
        };

        competitor.sources.forEach((source, idx) => {
          compRow[`Source ${idx + 1} Name`] = source.name;
          compRow[`Source ${idx + 1} URL`] = source.url;
          compRow[`Source ${idx + 1} Price`] = `${source.price} ${source.currency}`;
        });

        exportData.push(compRow);
      });
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Price Data');
    XLSX.writeFile(wb, 'blackstar_price_data.xlsx');
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-800">Blackstar Price Scraper</h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">Upload Product List</h2>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {products.length > 0 && (
            <p className="mt-4 text-green-600">Loaded {products.length} products</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <button
            onClick={handleScrape}
            disabled={loading || products.length === 0}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Scraping...' : 'Start Scraping'}
          </button>

          {loading && (
            <div className="mt-4 text-gray-600">
              <p>{progress}</p>
            </div>
          )}

          {results.length > 0 && !loading && (
            <button
              onClick={exportToExcel}
              className="ml-4 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700"
            >
              Export to Excel
            </button>
          )}
        </div>

        {results.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-700">Results</h2>
            <div className="space-y-6">
              {results.map((result, idx) => (
                <div key={idx} className="border-b pb-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{result.product}</h3>

                  <div className="mb-4">
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">SSP UK:</span> {result.ssp_uk || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">SSP EU:</span> {result.ssp_eu || 'N/A'}
                    </p>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-700 mb-2">Street Prices:</h4>
                    {result.sources.map((source, sidx) => (
                      <div key={sidx} className="ml-4 mb-2">
                        <p className="text-sm">
                          <span className="font-medium">{source.name}:</span>{' '}
                          <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {source.url}
                          </a>
                          {' - '}<span className="font-semibold">{source.price} {source.currency}</span>
                        </p>
                      </div>
                    ))}
                  </div>

                  {result.competitors.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">Competitors:</h4>
                      {result.competitors.map((comp, cidx) => (
                        <div key={cidx} className="ml-4 mb-3 bg-gray-50 p-3 rounded">
                          <p className="font-medium text-gray-800">
                            {comp.brand} - {comp.product}
                          </p>
                          {comp.sources.map((source, sidx) => (
                            <div key={sidx} className="ml-4 mt-1">
                              <p className="text-sm">
                                <span className="font-medium">{source.name}:</span>{' '}
                                <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                  {source.url}
                                </a>
                                {' - '}<span className="font-semibold">{source.price} {source.currency}</span>
                              </p>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
