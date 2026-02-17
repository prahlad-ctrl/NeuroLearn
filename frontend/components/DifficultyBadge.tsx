"use client";

import { motion } from "framer-motion";

interface DifficultyBadgeProps {
  level: string;
  size?: "sm" | "md";
}

export default function DifficultyBadge({ level, size = "sm" }: DifficultyBadgeProps) {
  const config: Record<string, { bg: string; text: string; dot: string; glow: string }> = {
    Beginner: {
      bg: "bg-emerald-500/8 border-emerald-500/20",
      text: "text-emerald-400",
      dot: "bg-emerald-400",
      glow: "shadow-[0_0_8px_rgba(16,185,129,0.15)]",
    },
    Intermediate: {
      bg: "bg-amber-500/8 border-amber-500/20",
      text: "text-amber-400",
      dot: "bg-amber-400",
      glow: "shadow-[0_0_8px_rgba(245,158,11,0.15)]",
    },
    Advanced: {
      bg: "bg-violet-500/8 border-violet-500/20",
      text: "text-violet-400",
      dot: "bg-violet-400",
      glow: "shadow-[0_0_8px_rgba(139,92,246,0.15)]",
    },
    unknown: {
      bg: "bg-slate-500/8 border-slate-500/20",
      text: "text-slate-400",
      dot: "bg-slate-400",
      glow: "",
    },
  };

  const c = config[level] || config.unknown;
  const padding = size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm";

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center gap-2 rounded-full border font-medium ${c.bg} ${c.text} ${c.glow} ${padding}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot} animate-pulse`} />
      {level}
    </motion.span>
  );
}
