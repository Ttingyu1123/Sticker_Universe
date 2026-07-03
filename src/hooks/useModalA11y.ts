import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface ModalA11yOptions {
    isOpen: boolean;
    onClose?: () => void;
}

// ponytail: hand-rolled trap for existing custom modals; migrate to
// react-aria-components Dialog if modals get redesigned.
export function useModalA11y<T extends HTMLElement = HTMLDivElement>({ isOpen, onClose }: ModalA11yOptions) {
    const containerRef = useRef<T>(null);
    const restoreFocusRef = useRef<HTMLElement | null>(null);
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    useEffect(() => {
        if (!isOpen) return;

        const container = containerRef.current;
        if (!container) return;

        restoreFocusRef.current = document.activeElement as HTMLElement | null;

        const focusables = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
        if (focusables.length > 0) {
            focusables[0].focus();
        } else {
            container.setAttribute('tabindex', '-1');
            container.focus();
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.stopPropagation();
                onCloseRef.current?.();
                return;
            }

            if (event.key !== 'Tab') return;

            const items = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
                .filter((el) => el.offsetParent !== null);
            if (items.length === 0) {
                event.preventDefault();
                return;
            }

            const first = items[0];
            const last = items[items.length - 1];
            const active = document.activeElement;

            if (event.shiftKey && (active === first || !container.contains(active))) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && (active === last || !container.contains(active))) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown, true);
        return () => {
            document.removeEventListener('keydown', handleKeyDown, true);
            restoreFocusRef.current?.focus?.();
        };
    }, [isOpen]);

    return containerRef;
}
