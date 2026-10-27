"use client";

import { useEffect, useRef } from "react";
import { useConfirm } from "@/components/confirm-dialog";

export default function useUnsavedChanges(dirty) {
  const confirm = useConfirm();
  const pending = useRef(false);

  useEffect(() => {
    if (!dirty) return;
    let active = true;
    let leaving = false;
    const ask = () =>
      confirm({
        title: "Discard unsaved changes?",
        description:
          "Your changes have not been saved. Leaving this page will discard them.",
        confirmLabel: "Discard changes",
        cancelLabel: "Keep editing",
        variant: "danger",
      });
    const beforeUnload = (event) => {
      if (leaving) return;
      event.preventDefault();
      event.returnValue = "";
    };
    const onClick = async (event) => {
      if (
        leaving ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const link = event.target.closest?.("a[href]");
      if (
        !link ||
        link.hasAttribute("download") ||
        (link.target && link.target !== "_self")
      )
        return;
      const url = new URL(link.href, window.location.href);
      if (!["http:", "https:"].includes(url.protocol)) return;
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search &&
        url.origin === window.location.origin
      )
        return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (pending.current) return;
      pending.current = true;
      const accepted = await ask();
      pending.current = false;
      if (!accepted || !active) return;
      leaving = true;
      // Replay the link so its own read-state, menu, and navigation handlers run.
      link.click();
    };
    // The Navigation API lets us cancel Back/Forward before the route changes.
    const onNavigate = async (event) => {
      if (
        leaving ||
        event.navigationType !== "traverse" ||
        !event.cancelable ||
        !event.canIntercept
      )
        return;
      event.preventDefault();
      if (pending.current) return;
      pending.current = true;
      const accepted = await ask();
      pending.current = false;
      if (!accepted || !active) return;
      leaving = true;
      window.navigation
        .traverseTo(event.destination.key)
        .finished.catch(() => {})
        .finally(() => {
          leaving = false;
        });
    };
    document.addEventListener("click", onClick, true);
    window.addEventListener("beforeunload", beforeUnload);
    window.navigation?.addEventListener("navigate", onNavigate);
    return () => {
      active = false;
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("beforeunload", beforeUnload);
      window.navigation?.removeEventListener("navigate", onNavigate);
    };
  }, [dirty, confirm]);
}
