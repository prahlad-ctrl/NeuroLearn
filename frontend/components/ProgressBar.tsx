"use client";

import { motion } from "framer-motion";

interface ProgressBarProps {
  value: number; // 0-100
  label?: string;
  size?: "sm" | "md" | "lg";
  showGlow?: boolean;
}

export default function ProgressBar({ value, label, size = "md", showGlow = false }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const height = size === "sm" ? "h-1" : size === "lg" ? "h-3.5" : "h-2";

  const color =
    clamped >= 75
      ? "from-emerald-500 to-emerald-400"
      : clamped >= 40
      ? "from-amber-500 to-amber-400"
      : "from-rose-500 to-rose-400";

  const glowColor =
    clamped >= 75
      ? "shadow-[0_0_12px_rgba(16,185,129,0.3)]"
      : clamped >= 40
      ? "shadow-[0_0_12px_rgba(245,158,11,0.3)]"
      : "shadow-[0_0_12px_rgba(239,68,68,0.3)]";

  return (
    <div className="w-full">
      {label && (
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-text-secondary">{label}</span>
          <span className="font-mono text-xs font-semibold text-text-primary">{clamped.toFixed(1)}%</span>
        </div>
      )}
      <div className={`relative w-full overflow-hidden rounded-full bg-bg-secondary/80 ${height}`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          className={`${height} rounded-full bg-gradient-to-r ${color} ${showGlow ? glowColor : ""}`}
        />
      </div>
    </div>
  );
}
