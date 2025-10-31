import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Auth App",
  description: "Authentication and Dashboard Application",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-900 text-gray-100 flex items-center justify-center min-h-screen">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    
    </html>
  );
}