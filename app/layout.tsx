import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DocuSign Template Generator",
  description: "Generate DocuSign templates with Fountain branding",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}





