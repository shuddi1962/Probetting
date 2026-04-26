// app/layout.tsx — Root layout with metadata
// Debug: trigger deploy to refresh cache
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pro Betting | Football Analytics & Prediction Platform',
  description: 'Real-time football predictions powered by API-Football, Sportmonks, xG data, and advanced Poisson modelling. 250+ betting markets with full reasoning.',
  keywords: 'football predictions, betting tips, xG, value bets, arbitrage, football analytics',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
