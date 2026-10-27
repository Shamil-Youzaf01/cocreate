"use client";
import { MoonIcon, SunIcon } from "@/components/header/icons";
import { Button } from "@/components/tailgrids/core/button";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const dark = mounted && resolvedTheme === "dark";

  return (
    <Button
      iconOnly
      appearance="outline"
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      isDisabled={!mounted}
      onClick={() => setTheme(dark ? "light" : "dark")}
      className="size-10 rounded-lg border border-card-border bg-card-background text-icon-primary shadow-xs outline-none focus-visible:border-input-primary-focus-border focus-visible:ring-4 focus-visible:ring-input-primary-focus-border/20 [&>svg]:size-auto"
    >
      {dark ? <SunIcon /> : <MoonIcon />}
    </Button>
  );
}
