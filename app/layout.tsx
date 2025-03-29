import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'test',
  description: 'Created with next',
  generator: 'test',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
