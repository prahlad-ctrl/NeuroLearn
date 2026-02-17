"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { generateLesson } from "@/lib/api";
import DifficultyBadge from "@/components/DifficultyBadge";

interface LessonPageProps {
  sessionId: string;
  subject: string;
  level: string;
  onNext: () => void;
}

export default function LessonPage({ sessionId, subject, level, onNext }: LessonPageProps) {
  const [lesson, setLesson] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await generateLesson(sessionId);
        setLesson(res.lesson);
      } catch {
        setError("Failed to generate lesson. Check backend connection.");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [sessionId, level]);

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-5 py-24">
        <div className="relative">
          <div className="loading-spinner h-8 w-8" />
          <div className="absolute inset-0 rounded-full bg-accent-primary/10 animate-ping" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-text-primary">Crafting your lesson</p>
          <p className="mt-1 text-xs text-text-dim">Personalizing content for {level} level...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-primary/10 shadow-glow-sm">
            <svg className="h-4.5 w-4.5 text-accent-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">{subject}</h2>
            <p className="text-xs text-text-secondary">Personalized lesson content</p>
          </div>
        </div>
        <DifficultyBadge level={level} size="md" />
      </div>

      {error && (
        <div className="mb-5 flex items-center gap-2 rounded-lg border border-status-error/20 bg-status-error/[0.06] px-4 py-2.5">
          <svg className="h-4 w-4 text-status-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p className="text-xs text-status-error">{error}</p>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative overflow-hidden rounded-xl border border-border-primary bg-bg-card"
      >
        {/* Gradient top accent */}
        <div className="h-px bg-gradient-to-r from-transparent via-accent-primary/50 to-transparent" />

        <div className="p-6 sm:p-8">
          <div className="prose prose-invert prose-sm max-w-none">
            {lesson.split("\n").map((line, i) => {
              if (line.startsWith("###")) {
                return (
                  <h3 key={i} className="mt-5 mb-2 flex items-center gap-2 text-base font-semibold text-text-primary">
                    <span className="inline-block h-1 w-1 rounded-full bg-accent-secondary" />
                    {line.replace(/^###\s*/, "")}
                  </h3>
                );
              }
              if (line.startsWith("##")) {
                return (
                  <h2 key={i} className="mt-6 mb-2 border-b border-border-primary/40 pb-2 text-lg font-bold text-text-primary">
                    {line.replace(/^##\s*/, "")}
                  </h2>
                );
              }
              if (line.startsWith("#")) {
                return (
                  <h1 key={i} className="mt-6 mb-3 text-xl font-bold gradient-text">
                    {line.replace(/^#\s*/, "")}
                  </h1>
                );
              }
              if (line.startsWith("- ") || line.startsWith("* ")) {
                return (
                  <li key={i} className="ml-4 text-text-secondary list-none flex items-start gap-2 mb-1">
                    <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-accent-primary/60" />
                    <span>{line.replace(/^[-*]\s*/, "")}</span>
                  </li>
                );
              }
              if (line.trim() === "") {
                return <div key={i} className="h-3" />;
              }
              // Bold & inline code
              let formatted = line.replace(
                /\*\*(.*?)\*\*/g,
                '<strong class="text-text-primary font-semibold">$1</strong>'
              );
              formatted = formatted.replace(
                /`(.*?)`/g,
                '<code class="rounded bg-white/[0.04] px-1.5 py-0.5 text-xs font-mono text-accent-secondary">$1</code>'
              );
              return (
                <p
                  key={i}
                  className="mb-1.5 text-sm leading-relaxed text-text-secondary"
                  dangerouslySetInnerHTML={{ __html: formatted }}
                />
              );
            })}
          </div>
        </div>
      </motion.div>

      <div className="mt-8 flex justify-end">
        <button onClick={onNext} className="btn-primary flex items-center gap-2">
          Practice Exercises
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </button>
      </div>
    </div>
  );
}
