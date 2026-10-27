import toast from "react-hot-toast";

const sessionNoticeKey = "cocreate-session-expired";
let sessionEnding = false;

export function reportLoadError(error, fallback, id) {
  const message = error?.response?.data?.message || fallback;
  if (
    !sessionEnding &&
    error?.code !== "ERR_CANCELED" &&
    error?.name !== "AbortError"
  ) {
    toast.error(message, { id });
  }
  return message;
}

export function queueSessionExpiredNotice() {
  sessionEnding = true;
  try {
    window.sessionStorage.setItem(sessionNoticeKey, "1");
  } catch {
    toast.error("Your session has expired. Please sign in again.", {
      id: "session-expired",
    });
  }
}

export function showSessionExpiredNotice() {
  try {
    if (!window.sessionStorage.getItem(sessionNoticeKey)) return;
    window.sessionStorage.removeItem(sessionNoticeKey);
    sessionEnding = false;
    toast.error("Your session has expired. Please sign in again.", {
      id: "session-expired",
    });
  } catch {
    // Storage may be unavailable in a restricted browser session.
  }
}
