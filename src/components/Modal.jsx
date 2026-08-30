import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const FOCUSABLE_ELEMENTS = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function Modal({ handleClose, show, children, ariaLabel = 'Dialog' }) {
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);
  const handleCloseRef = useRef(handleClose);
  handleCloseRef.current = handleClose;

  useEffect(() => {
    if (!show) return undefined;

    previousFocusRef.current = document.activeElement;
    const dialog = dialogRef.current;
    const focusableElements = () => [...(dialog?.querySelectorAll(FOCUSABLE_ELEMENTS) || [])];
    focusableElements()[0]?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleCloseRef.current?.();
        return;
      }

      if (event.key !== 'Tab') return;
      const elements = focusableElements();
      if (!elements.length) return;

      const firstElement = elements[0];
      const lastElement = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus?.();
    };
  }, [show]);

  if (!show) return null;

  return createPortal(
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) handleClose?.();
      }}
    >
      <section
        className="modal"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
      >
        {children}
        <button type="button" className="modal-close" onClick={handleClose} aria-label="Close dialog">×</button>
      </section>
    </div>,
    document.body
  );
}

export default Modal;
