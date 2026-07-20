"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  invitationTimings,
  type InvitationState,
} from "./invitation-types";

type ActivePointer = {
  id: number;
  startY: number;
  currentY: number;
  startedAt: number;
};

const SWIPE_DISTANCE = 55;
const SWIPE_VELOCITY = 0.45;
const MAX_DRAG_PREVIEW = 70;

export function useEnvelopeInteraction() {
  const [state, setState] = useState<InvitationState>("closed");
  const [dragProgress, setDragProgress] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const pointerRef = useRef<ActivePointer | null>(null);
  const hasOpenedRef = useRef(false);
  const suppressClickRef = useRef(false);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const forceReducedMotion =
      process.env.NODE_ENV === "development" &&
      new URLSearchParams(window.location.search).get(
        "debugReducedMotion",
      ) === "1";
    const updatePreference = () =>
      setPrefersReducedMotion(forceReducedMotion || mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);

    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    const debugState = new URLSearchParams(window.location.search).get(
      "debugInvitation",
    );
    const debugStateMap: Record<string, InvitationState> = {
      closed: "closed",
      "flap-open": "opening-flap",
      "card-raised": "raising-card",
      opened: "opened",
    };
    const nextState = debugState ? debugStateMap[debugState] : undefined;

    if (!nextState) return;

    hasOpenedRef.current = nextState !== "closed";
    const debugTimer = window.setTimeout(() => setState(nextState), 0);

    return () => window.clearTimeout(debugTimer);
  }, []);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const startOpening = useCallback(() => {
    if (hasOpenedRef.current || state !== "closed") return;

    hasOpenedRef.current = true;
    pointerRef.current = null;
    setDragProgress(0);
    clearTimers();

    if (prefersReducedMotion) {
      setState("opened");
      return;
    }

    setState("releasing-seal");
    timersRef.current = [
      window.setTimeout(
        () => setState("opening-flap"),
        invitationTimings.seal,
      ),
      window.setTimeout(
        () => setState("raising-card"),
        invitationTimings.flapComplete,
      ),
      window.setTimeout(
        () => setState("opened"),
        invitationTimings.total,
      ),
    ];
  }, [clearTimers, prefersReducedMotion, state]);

  const openInvitation = useCallback(
    (event: ReactMouseEvent<HTMLButtonElement>) => {
      if (event.detail > 0 && suppressClickRef.current) {
        suppressClickRef.current = false;
        return;
      }

      startOpening();
    },
    [startOpening],
  );

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (state !== "closed") return;

      pointerRef.current = {
        id: event.pointerId,
        startY: event.clientY,
        currentY: event.clientY,
        startedAt: performance.now(),
      };
      suppressClickRef.current = false;
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [state],
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      const pointer = pointerRef.current;
      if (!pointer || pointer.id !== event.pointerId || state !== "closed") {
        return;
      }

      pointer.currentY = event.clientY;
      const distance = Math.max(0, pointer.startY - event.clientY);
      if (Math.abs(pointer.startY - event.clientY) > 6) {
        suppressClickRef.current = true;
      }
      setDragProgress(Math.min(distance / MAX_DRAG_PREVIEW, 1));
    },
    [state],
  );

  const finishPointer = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>, cancelled = false) => {
      const pointer = pointerRef.current;
      if (!pointer || pointer.id !== event.pointerId) return;

      const distance = pointer.startY - pointer.currentY;
      const elapsed = Math.max(performance.now() - pointer.startedAt, 1);
      const velocity = distance / elapsed;
      pointerRef.current = null;

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      if (
        !cancelled &&
        (distance >= SWIPE_DISTANCE || velocity >= SWIPE_VELOCITY)
      ) {
        startOpening();
        return;
      }

      if (cancelled) suppressClickRef.current = false;
      setDragProgress(0);
    },
    [startOpening],
  );

  return {
    state,
    dragProgress,
    prefersReducedMotion,
    openInvitation,
    pointerHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: (event: ReactPointerEvent<HTMLButtonElement>) =>
        finishPointer(event),
      onPointerCancel: (event: ReactPointerEvent<HTMLButtonElement>) =>
        finishPointer(event, true),
    },
  };
}
