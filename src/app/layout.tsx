import { Plus_Jakarta_Sans } from 'next/font/google';
import type { Metadata } from 'next';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'MedFlow — Sistema Médico',
  description: 'Sistema de gestão para clínicas médicas',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={plusJakarta.variable}>
      <body className={plusJakarta.className} style={{ margin: 0, height: '100vh', overflow: 'hidden' }}>
        {children}
      </body>
    </html>
  );
}
