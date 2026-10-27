"use client";
import { ThemeProvider as NextThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";
import { useEffect } from "react";
import { showSessionExpiredNotice } from "@/lib/toast-feedback";
import { ConfirmProvider } from "@/components/confirm-dialog";

export default function ThemeProvider({ children }) {
  useEffect(() => {
    showSessionExpiredNotice();
  }, []);
  return (
    <NextThemeProvider
      attribute="data-theme"
      defaultTheme="system"
      enableSystem
    >
      <ConfirmProvider>{children}</ConfirmProvider>
      <Toaster position="top-center" />
    </NextThemeProvider>
  );
}
