"use client";
import { useState } from "react";
import { ModalOverlay, Modal, Dialog } from "react-aria-components";
import AuthInitializer from "@/components/auth/AuthInitializer";
import DashboardRouteGuard from "@/components/auth/DashboardRouteGuard";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";

export default function DashboardLayout({ children }) {
  const [expanded, setExpanded] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <AuthInitializer>
      <div className="flex min-h-screen">
        <aside
          className={`hidden shrink-0 border-r border-card-border bg-card-background md:block ${expanded ? "w-[280px]" : "w-20"}`}
        >
          <Sidebar
            isSidebarOpen={expanded}
            toggleSidebar={() => setExpanded((value) => !value)}
          />
        </aside>
        <div className="min-w-0 flex-1 pb-6">
          <Header
            onMenuClick={() =>
              window.matchMedia("(min-width: 768px)").matches
                ? setExpanded((value) => !value)
                : setMobileOpen(true)
            }
          />
          <DashboardRouteGuard>{children}</DashboardRouteGuard>
        </div>
        <ModalOverlay
          isOpen={mobileOpen}
          onOpenChange={setMobileOpen}
          isDismissable
          className="fixed inset-0 z-50 bg-black/40 md:hidden"
        >
          <Modal className="h-full w-[280px] max-w-[90vw] bg-card-background">
            <Dialog
              aria-label="Sidebar navigation"
              className="h-full outline-none"
            >
              <Sidebar
                isSidebarOpen
                isMobileSheet
                toggleSidebar={() => setMobileOpen(false)}
                onItemClick={() => setMobileOpen(false)}
              />
            </Dialog>
          </Modal>
        </ModalOverlay>
      </div>
    </AuthInitializer>
  );
}
