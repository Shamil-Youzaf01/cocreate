import "./globals.css";
import ThemeProvider from "@/components/theme-provider";

export const metadata = {
  title: "COCREATE",
  description: "Campaign collaboration workspace",
  icons: {
    icon: "/brand/icon-inverted.png?v=2",
    shortcut: "/brand/icon.png?v=2",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background-gray-primary text-text-primary">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
