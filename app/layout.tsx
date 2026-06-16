import type { Metadata } from "next";
import { ThemeProvider } from "../lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "Admin Portal",
  description: "College assessment administration"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
