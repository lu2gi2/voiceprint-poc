import { useEffect, useRef } from 'react';

/**
 * Thin wrapper over the native <dialog> element so we keep its focus trap,
 * Escape handling and ::backdrop for free. Clicking the backdrop closes.
 */
export default function Dialog({ open, onClose, labelledBy, children }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    else if (!open && el.open) el.close();
  }, [open]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Fires for Escape too, so state stays in sync with the element.
    const onNativeClose = () => onClose();
    el.addEventListener('close', onNativeClose);
    return () => el.removeEventListener('close', onNativeClose);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      {open ? children : null}
    </dialog>
  );
}
