import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Personalized Learning Path Generator — Optimized Learning with Algorithms",
  description: "Generate optimized learning paths using A*, CSP, Hill Climbing, and Genetic Algorithms. Visualize every step of the algorithm in real-time with interactive graph exploration.",
  keywords: ["AI", "learning path", "algorithm visualization", "A*", "machine learning", "DSA", "DevOps"],
  icons: {
    icon: "/BrainLogo.png",
    shortcut: "/BrainLogo.png",
    apple: "/BrainLogo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" href="/BrainLogo.png" />
        <link rel="shortcut icon" href="/BrainLogo.png" />
        <link rel="apple-touch-icon" href="/BrainLogo.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
