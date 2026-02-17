"use client";

import { motion } from "framer-motion";

interface QuestionCardProps {
  index: number;
  question: string;
  questionType?: string; // mcq | true_false | short | qa
  options?: string[];
  expectedPoints?: string[];
  userAnswer: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  correctAnswer?: string;
  showResult?: boolean;
}

export default function QuestionCard({
  index,
  question,
  questionType = "short",
  options,
  expectedPoints,
  userAnswer,
  onChange,
  disabled = false,
  correctAnswer,
  showResult = false,
}: QuestionCardProps) {
  const normalize = (s: string) => s.trim().toLowerCase();

  const isCorrect = (() => {
    if (!showResult || correctAnswer === undefined) return null;
    if (questionType === "true_false") {
      const u = normalize(userAnswer);
      const e = normalize(String(correctAnswer));
      const truthy = ["true", "1", "yes"];
      const falsy = ["false", "0", "no"];
      return (truthy.includes(u) && truthy.includes(e)) || (falsy.includes(u) && falsy.includes(e));
    }
    if (questionType === "qa") return null; // not auto-graded visually
    return normalize(userAnswer) === normalize(correctAnswer);
  })();

  // ---- Shared outer card ----
  const borderClass = showResult
    ? isCorrect === true
      ? "border-status-success/30 bg-status-success/[0.04]"
      : isCorrect === false
        ? "border-status-error/30 bg-status-error/[0.04]"
        : "border-border-primary bg-bg-card"
    : "border-border-primary bg-bg-card hover:border-accent-primary/20 hover:bg-bg-elevated hover:shadow-glow-sm";

  const badge = showResult ? (
    isCorrect === true ? (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ) : isCorrect === false ? (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    ) : (
      <span>{String(index + 1).padStart(2, "0")}</span>
    )
  ) : (
    <span>{String(index + 1).padStart(2, "0")}</span>
  );

  const badgeColor = showResult
    ? isCorrect === true
      ? "bg-status-success/15 text-status-success"
      : isCorrect === false
        ? "bg-status-error/15 text-status-error"
        : "bg-accent-primary/10 text-accent-secondary"
    : "bg-accent-primary/10 text-accent-secondary";

  // ---- Render input area by type ----
  const renderInput = () => {
    if (questionType === "mcq" && options && options.length > 0) {
      return (
        <div className="space-y-2">
          {options.map((opt, i) => {
            const selected = userAnswer === opt;
            const isRightOption = showResult && correctAnswer !== undefined && normalize(opt) === normalize(correctAnswer);
            let optClass =
              "flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-2.5 text-sm transition-all";
            if (showResult) {
              if (isRightOption)
                optClass += " border-status-success/40 bg-status-success/10 text-status-success";
              else if (selected && !isCorrect)
                optClass += " border-status-error/40 bg-status-error/10 text-status-error";
              else optClass += " border-border-primary bg-bg-input text-text-secondary opacity-60";
            } else {
              optClass += selected
                ? " border-accent-primary/50 bg-accent-primary/10 text-text-primary"
                : " border-border-primary bg-bg-input text-text-secondary hover:border-accent-primary/30";
            }
            return (
              <button
                key={i}
                type="button"
                disabled={disabled}
                onClick={() => onChange(opt)}
                className={optClass + " disabled:cursor-not-allowed"}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
                    selected ? "border-accent-primary bg-accent-primary text-white" : "border-border-primary"
                  }`}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                <span>{opt}</span>
              </button>
            );
          })}
        </div>
      );
    }

    if (questionType === "true_false") {
      return (
        <div className="flex gap-3">
          {["True", "False"].map((val) => {
            const selected = normalize(userAnswer) === normalize(val);
            const isRight =
              showResult &&
              correctAnswer !== undefined &&
              normalize(val) === normalize(String(correctAnswer));
            let cls =
              "flex-1 rounded-lg border py-2.5 text-sm font-medium text-center transition-all cursor-pointer";
            if (showResult) {
              if (isRight.valueOf()) cls += " border-status-success/40 bg-status-success/10 text-status-success";
              else if (selected && !isCorrect)
                cls += " border-status-error/40 bg-status-error/10 text-status-error";
              else cls += " border-border-primary bg-bg-input text-text-secondary opacity-60";
            } else {
              cls += selected
                ? " border-accent-primary/50 bg-accent-primary/10 text-text-primary"
                : " border-border-primary bg-bg-input text-text-secondary hover:border-accent-primary/30";
            }
            return (
              <button
                key={val}
                type="button"
                disabled={disabled}
                onClick={() => onChange(val)}
                className={cls + " disabled:cursor-not-allowed"}
              >
                {val}
              </button>
            );
          })}
        </div>
      );
    }

    if (questionType === "qa") {
      return (
        <>
          <textarea
            value={userAnswer}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder="Write your answer..."
            rows={4}
            className="w-full rounded-lg border border-border-primary bg-bg-input px-4 py-2.5 text-sm text-text-primary placeholder:text-text-dim transition-all duration-200 focus:border-accent-primary/50 focus:outline-none focus:ring-2 focus:ring-accent-primary/10 focus:bg-bg-secondary disabled:opacity-50 disabled:cursor-not-allowed resize-none"
          />
          {showResult && expectedPoints && expectedPoints.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 rounded-lg bg-accent-primary/[0.06] px-3 py-2"
            >
              <p className="text-xs font-medium text-accent-secondary mb-1">Key points expected:</p>
              <ul className="list-disc list-inside space-y-0.5">
                {expectedPoints.map((pt, i) => (
                  <li key={i} className="text-xs text-text-secondary">{pt}</li>
                ))}
              </ul>
            </motion.div>
          )}
        </>
      );
    }

    // default: short answer
    return (
      <input
        type="text"
        value={userAnswer}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Type your answer..."
        className="w-full rounded-lg border border-border-primary bg-bg-input px-4 py-2.5 text-sm text-text-primary placeholder:text-text-dim transition-all duration-200 focus:border-accent-primary/50 focus:outline-none focus:ring-2 focus:ring-accent-primary/10 focus:bg-bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
      />
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`group relative overflow-hidden rounded-xl border p-5 transition-all duration-300 ${borderClass}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-primary/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

      <div className="mb-4 flex items-start gap-3.5">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${badgeColor}`}>
          {badge}
        </span>
        <div className="flex-1">
          <p className="pt-0.5 text-sm leading-relaxed text-text-primary">{question}</p>
          {questionType && questionType !== "short" && (
            <span className="mt-1 inline-block rounded bg-bg-elevated px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-text-dim">
              {questionType === "true_false" ? "True / False" : questionType.toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {renderInput()}

      {showResult && correctAnswer && isCorrect === false && questionType !== "qa" && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 flex items-center gap-2 rounded-lg bg-status-error/[0.06] px-3 py-2"
        >
          <svg className="h-3.5 w-3.5 shrink-0 text-status-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-text-secondary">
            Correct: <span className="font-medium text-text-primary">{correctAnswer}</span>
          </p>
        </motion.div>
      )}

      {showResult && isCorrect === true && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 flex items-center gap-2 rounded-lg bg-status-success/[0.06] px-3 py-2"
        >
          <svg className="h-3.5 w-3.5 shrink-0 text-status-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-xs text-status-success font-medium">Correct</p>
        </motion.div>
      )}
    </motion.div>
  );
}
