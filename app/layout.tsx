import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { CartProvider } from '@/components/cart-provider'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { getStoreSettings } from '@/lib/store-settings'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'MỘC Studio — Thời trang tối giản từ chất liệu tự nhiên',
    template: '%s | MỘC Studio',
  },
  description:
    'MỘC Studio — thời trang nam nữ tối giản, chất liệu linen, lụa, cotton tự nhiên. Miễn phí giao hàng cho đơn từ 1.000.000₫.',
  generator: 'v0.app',
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#f6f2ec',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const settings = await getStoreSettings()
  return (
    <html lang="vi">
      <body className="antialiased">
        <CartProvider>
          <div className="flex min-h-dvh flex-col">
            <SiteHeader freeShippingThreshold={settings.freeShippingThreshold} returnDays={settings.returnDays} />
            <main className="flex-1">{children}</main>
            <SiteFooter tagline={settings.tagline} storeAddress={settings.storeAddress} hotline={settings.hotline} />
          </div>
        </CartProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
