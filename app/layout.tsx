import type React from "react"
import type { Metadata } from "next"
import { Cormorant_Garamond, Manrope } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
})

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  metadataBase: new URL("https://web-harmonium.vercel.app"),
  title: "Web Harmonium | Digital Indian Classical Instrument",
  description:
    "Play a refined digital harmonium experience in your browser with keyboard and MIDI support.",
  openGraph: {
    title: "Web Harmonium",
    description: "Digital Indian classical harmonium with keyboard and MIDI support.",
    siteName: "Web Harmonium",
    url: "https://web-harmonium.vercel.app/",
    images: [
      {
        url: "/favicon.png",
        width: 512,
        height: 512,
        alt: "Web Harmonium",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Web Harmonium",
    description: "Digital Indian classical harmonium with keyboard and MIDI support.",
    images: ["/favicon.png"],
    creator: "@mr_akbari_",
  },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta
          name="google-site-verification"
          content="M71tdDiU-O499RIu-uqiDLBLkJAVh67t9e107tz2UVk"
        />
        <meta name="msvalidate.01" content="231D77D496F630213E38C67872F5028B" />
      </head>
      <body className={`${manrope.variable} ${cormorant.variable} font-sans`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="relative min-h-screen">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  )
}
