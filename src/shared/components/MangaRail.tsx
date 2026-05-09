"use client";

import { type ReactNode, useRef } from "react";

const MOVE_THRESHOLD_PX = 10;

function isMouseLikePointer(e: PointerEvent | React.PointerEvent) {
  return e.pointerType === "mouse" || e.pointerType === "pen";
}

type MangaRailProps = {
  children: ReactNode;
  /** `id` del encabezado de sección (`aria-labelledby`). */
  labelledBy?: string;
};

export function MangaRail({ children, labelledBy }: MangaRailProps) {
  const ref = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const startScrollLeftRef = useRef(0);
  const draggedRef = useRef(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isMouseLikePointer(e) || e.button !== 0) return;
    const el = ref.current;
    if (!el) return;

    draggingRef.current = true;
    draggedRef.current = false;
    startXRef.current = e.clientX;
    startScrollLeftRef.current = el.scrollLeft;

    const onMove = (ev: PointerEvent) => {
      if (!draggingRef.current || !ref.current) return;
      const dx = ev.clientX - startXRef.current;
      if (Math.abs(dx) > MOVE_THRESHOLD_PX) {
        draggedRef.current = true;
      }
      ref.current.scrollLeft = startScrollLeftRef.current - dx;
    };

    const onEnd = () => {
      draggingRef.current = false;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onEnd);
      window.removeEventListener("pointercancel", onEnd);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onEnd);
    window.addEventListener("pointercancel", onEnd);
  };

  const handleClickCapture = (e: React.MouseEvent) => {
    if (draggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div className="manga-rail-outer">
      <div
        ref={ref}
        className="manga-rail"
        role="region"
        aria-labelledby={labelledBy}
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onClickCapture={handleClickCapture}
        onDragStart={(ev) => ev.preventDefault()}
        onKeyDown={(event) => {
          const el = ref.current;
          if (!el) return;
          const step = Math.round(el.clientWidth * 0.6);
          if (event.key === "ArrowRight") {
            event.preventDefault();
            el.scrollBy({ left: step, behavior: "smooth" });
          } else if (event.key === "ArrowLeft") {
            event.preventDefault();
            el.scrollBy({ left: -step, behavior: "smooth" });
          }
        }}
      >
        {children}
      </div>
    </div>
  );
}
