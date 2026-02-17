import type { Metadata } from "next";
import "./globals.css";
import LenisProvider from "@/components/LenisProvider";

export const metadata: Metadata = {
  title: "NeuroLearn - Adaptive Learning Tutor",
  description: "An interactive adaptive learning tutor that personalizes lessons and exercises based on your skill level.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-bg-primary text-text-primary">
        <LenisProvider>
          {children}
        </LenisProvider>
      </body>
    </html>
  );
}
