import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
})

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
})

export const metadata: Metadata = {
    title: "Onchain Agent",
    description:
        "AI assistant for EVM wallets across multiple chains. Check balances, send tokens, and manage on chain actions. Just chat.",
    icons: {
        icon: "/logo.png",
        apple: "/logo.png",
    },
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html
            lang="en"
            className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
        >
            <body className="min-h-full flex flex-col bg-background text-foreground">{children}</body>
        </html>
    )
}

