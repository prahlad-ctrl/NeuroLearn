"use client";

import { motion } from "framer-motion";

export default function AnimatedBackground() {
    return (
        <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
            {/* Dot grid */}
            <div className="absolute inset-0 bg-dot-pattern bg-dot opacity-30" />

            {/* Floating gradient orbs */}
            <motion.div
                className="absolute -top-[200px] left-[15%] h-[500px] w-[500px] rounded-full float-slow"
                style={{
                    background: "radial-gradient(circle, rgba(124, 58, 237, 0.08) 0%, transparent 70%)",
                }}
                animate={{
                    x: [0, 30, -20, 0],
                    y: [0, -20, 10, 0],
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />

            <motion.div
                className="absolute top-[30%] -right-[150px] h-[400px] w-[400px] rounded-full"
                style={{
                    background: "radial-gradient(circle, rgba(6, 182, 212, 0.06) 0%, transparent 70%)",
                }}
                animate={{
                    x: [0, -25, 15, 0],
                    y: [0, 15, -25, 0],
                }}
                transition={{
                    duration: 18,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />

            <motion.div
                className="absolute -bottom-[200px] left-[40%] h-[450px] w-[450px] rounded-full"
                style={{
                    background: "radial-gradient(circle, rgba(124, 58, 237, 0.05) 0%, transparent 70%)",
                }}
                animate={{
                    x: [0, 20, -30, 0],
                    y: [0, -15, 20, 0],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />

            <motion.div
                className="absolute top-[60%] -left-[100px] h-[350px] w-[350px] rounded-full"
                style={{
                    background: "radial-gradient(circle, rgba(236, 72, 153, 0.04) 0%, transparent 70%)",
                }}
                animate={{
                    x: [0, 15, -10, 0],
                    y: [0, -20, 15, 0],
                }}
                transition={{
                    duration: 22,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />

            {/* Noise texture */}
            <div
                className="absolute inset-0 opacity-[0.012]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
                }}
            />

            {/* Top gradient line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-primary/20 to-transparent" />
        </div>
    );
}
