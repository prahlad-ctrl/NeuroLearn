"use client";

import { useEffect, useRef } from "react";

export default function CustomCursor() {
    const dotRef = useRef<HTMLDivElement>(null);
    const ringRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const dot = dotRef.current;
        const ring = ringRef.current;
        if (!dot || !ring) return;

        let mouseX = 0;
        let mouseY = 0;
        let ringX = 0;
        let ringY = 0;

        const onMouseMove = (e: MouseEvent) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            dot.style.transform = `translate(${mouseX - 4}px, ${mouseY - 4}px)`;
        };

        const animate = () => {
            ringX += (mouseX - ringX) * 0.15;
            ringY += (mouseY - ringY) * 0.15;
            ring.style.transform = `translate(${ringX - 18}px, ${ringY - 18}px)`;
            requestAnimationFrame(animate);
        };

        const onMouseEnter = () => {
            dot.style.opacity = "1";
            ring.style.opacity = "1";
        };

        const onMouseLeave = () => {
            dot.style.opacity = "0";
            ring.style.opacity = "0";
        };

        const onHoverStart = () => {
            dot.classList.add("is-hovering");
            ring.classList.add("is-hovering");
        };

        const onHoverEnd = () => {
            dot.classList.remove("is-hovering");
            ring.classList.remove("is-hovering");
        };

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseenter", onMouseEnter);
        document.addEventListener("mouseleave", onMouseLeave);

        // Observe interactive elements
        const interactives = document.querySelectorAll("button, a, input, textarea, select, [role='button']");
        interactives.forEach((el) => {
            el.addEventListener("mouseenter", onHoverStart);
            el.addEventListener("mouseleave", onHoverEnd);
        });

        const observer = new MutationObserver(() => {
            const newInteractives = document.querySelectorAll("button, a, input, textarea, select, [role='button']");
            newInteractives.forEach((el) => {
                el.addEventListener("mouseenter", onHoverStart);
                el.addEventListener("mouseleave", onHoverEnd);
            });
        });
        observer.observe(document.body, { childList: true, subtree: true });

        requestAnimationFrame(animate);

        return () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseenter", onMouseEnter);
            document.removeEventListener("mouseleave", onMouseLeave);
            observer.disconnect();
        };
    }, []);

    // Hide custom cursor on touch devices
    if (typeof window !== "undefined" && "ontouchstart" in window) {
        return null;
    }

    return (
        <>
            <div ref={dotRef} className="cursor-dot hidden md:block" style={{ opacity: 0 }} />
            <div ref={ringRef} className="cursor-ring hidden md:block" style={{ opacity: 0 }} />
        </>
    );
}
