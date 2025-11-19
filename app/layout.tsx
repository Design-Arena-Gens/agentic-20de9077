import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Blackstar Price Scraper',
  description: 'Scrape product prices and competitor data',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
