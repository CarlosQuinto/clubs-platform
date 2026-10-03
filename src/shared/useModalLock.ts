import { useEffect, useRef } from "react";

let lockCount = 0;
let savedScrollY = 0;
let savedBody = {
  overflow: "",
  position: "",
  top: "",
  left: "",
  right: "",
  width: "",
};
let savedHtmlOverflow = "";

function applyLock() {
  if (lockCount === 0) {
    savedScrollY = window.scrollY;
    savedHtmlOverflow = document.documentElement.style.overflow;
    savedBody = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      right: document.body.style.right,
      width: document.body.style.width,
    };
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${savedScrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
  }
  lockCount += 1;
}

function releaseLock() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount > 0) return;
  document.documentElement.style.overflow = savedHtmlOverflow;
  document.body.style.overflow = savedBody.overflow;
  document.body.style.position = savedBody.position;
  document.body.style.top = savedBody.top;
  document.body.style.left = savedBody.left;
  document.body.style.right = savedBody.right;
  document.body.style.width = savedBody.width;
  window.scrollTo(0, savedScrollY);
}

/** Cierra con ESC y bloquea el scroll del fondo mientras el modal está abierto. */
export function useModalLock(onClose?: (() => void) | null) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!onClose) return;
    applyLock();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      onCloseRef.current?.();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      releaseLock();
    };
  }, [!!onClose]);
}
