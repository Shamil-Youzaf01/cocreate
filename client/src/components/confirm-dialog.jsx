"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { Dialog, Heading, Modal, ModalOverlay } from "react-aria-components";
import { AlertTriangle, CheckCircle2, Wallet, X } from "lucide-react";

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [request, setRequest] = useState(null);
  const resolver = useRef(null);
  const descriptionId = useId();

  const confirm = useCallback((options) => {
    if (resolver.current) return Promise.resolve(false);
    return new Promise((resolve) => {
      resolver.current = resolve;
      setRequest(options);
    });
  }, []);

  const finish = useCallback((accepted) => {
    const resolve = resolver.current;
    resolver.current = null;
    setRequest(null);
    resolve?.(accepted);
  }, []);

  useEffect(
    () => () => {
      resolver.current?.(false);
    },
    [],
  );

  const danger = request?.variant === "danger";
  const Icon = danger
    ? AlertTriangle
    : request?.variant === "payment"
      ? Wallet
      : CheckCircle2;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ModalOverlay
        isOpen={Boolean(request)}
        onOpenChange={(open) => {
          if (!open) finish(false);
        }}
        className="fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm"
      >
        <Modal className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl outline-none">
          <Dialog
            role="alertdialog"
            aria-describedby={descriptionId}
            className="relative rounded-2xl border border-card-border bg-card-background p-6 shadow-2xl outline-none sm:p-7"
          >
            <button
              type="button"
              aria-label="Cancel and close dialog"
              onClick={() => finish(false)}
              className="absolute right-4 top-4 rounded-lg p-2 text-text-tertiary hover:bg-background-gray-primary focus-visible:outline-2 focus-visible:outline-brand-500"
            >
              <X size={18} />
            </button>
            <div
              className={`mb-5 flex size-12 items-center justify-center rounded-2xl ${danger ? "bg-red-50 text-red-500" : request?.variant === "payment" ? "bg-green-50 text-green-600" : "bg-brand-50 text-brand-500"}`}
            >
              <Icon aria-hidden="true" size={24} strokeWidth={1.8} />
            </div>
            <Heading
              slot="title"
              className="pr-5 text-xl font-semibold tracking-tight text-text-primary"
            >
              {request?.title}
            </Heading>
            <p
              id={descriptionId}
              className="mt-2 text-sm leading-6 text-text-secondary"
            >
              {request?.description}
            </p>
            {request?.details && (
              <dl className="mt-5 space-y-3 rounded-xl border border-card-border bg-background-gray-primary/50 p-4">
                {request.details.map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex justify-between gap-4 text-sm"
                  >
                    <dt className="text-text-tertiary">{label}</dt>
                    <dd className="break-words text-right font-medium text-text-primary">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
            <div className="mt-6 flex flex-col-reverse gap-3 border-t border-card-border pt-5 sm:flex-row sm:justify-end">
              <button
                autoFocus
                type="button"
                onClick={() => finish(false)}
                className="rounded-xl border border-card-border px-4 py-2.5 text-sm font-medium text-text-primary transition hover:bg-background-gray-primary focus-visible:outline-2 focus-visible:outline-brand-500"
              >
                {request?.cancelLabel || "Cancel"}
              </button>
              <button
                type="button"
                onClick={() => finish(true)}
                className={`rounded-xl px-4 py-2.5 text-sm font-medium text-white transition focus-visible:outline-2 focus-visible:outline-offset-2 ${danger ? "bg-red-500 hover:bg-red-600 focus-visible:outline-red-500" : "bg-brand-500 hover:bg-brand-600 focus-visible:outline-brand-500"}`}
              >
                {request?.confirmLabel || "Confirm"}
              </button>
            </div>
          </Dialog>
        </Modal>
      </ModalOverlay>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const confirm = useContext(ConfirmContext);
  if (!confirm)
    throw new Error("useConfirm must be used within ConfirmProvider");
  return confirm;
}
