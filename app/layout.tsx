import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Open AI Finder", description: "Find the best open AI you can actually run." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
