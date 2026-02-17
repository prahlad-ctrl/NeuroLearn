"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { getDiagnosticQuestions, submitDiagnostic, Question, QuestionType } from "@/lib/api";
import QuestionCard from "@/components/QuestionCard";
import ProgressBar from "@/components/ProgressBar";
import DifficultyBadge from "@/components/DifficultyBadge";

interface QuizPageProps {
  sessionId: string;
  subject: string;
  onComplete: (level: string) => void;
}

export default function QuizPage({ sessionId, subject, onComplete }: QuizPageProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [questionType, setQuestionType] = useState<QuestionType>("mcq");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; level: string; correct: number; total: number } | null>(null);
  const [error, setError] = useState("");

  const fetchQuestions = async (qType: QuestionType) => {
    setLoading(true);
    setError("");
    try {
      const res = await getDiagnosticQuestions(sessionId, qType);
      setQuestions(res.questions);
      setAnswers(new Array(res.questions.length).fill(""));
      setStarted(true);
    } catch {
      setError("Failed to load diagnostic questions. Check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const payload = questions.map((q, i) => ({
        question: q.question,
        user_answer: answers[i],
        correct_answer: String(q.answer ?? ""),
        type: q.type || questionType,
      }));
      const res = await submitDiagnostic(sessionId, payload);
      setResult(res);
    } catch {
      setError("Failed to submit diagnostic.");
    } finally {
      setSubmitting(false);
    }
  };

  const filledCount = answers.filter((a) => a.trim().length > 0).length;

  // ── Question type selector ──
  if (!started && !loading) {
    const types: { value: QuestionType; label: string; desc: string; icon: string }[] = [
      { value: "mcq", label: "Multiple Choice", desc: "Pick the correct option from 4 choices", icon: "M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" },
      { value: "true_false", label: "True / False", desc: "Determine if statements are correct", icon: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
      { value: "short", label: "Short Answer", desc: "Type concise answers to test recall", icon: "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" },
      { value: "qa", label: "Open-ended", desc: "Write detailed explanatory responses", icon: "M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" },
      { value: "mixed", label: "Mixed", desc: "A combination of all question types", icon: "M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" },
    ];

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-xl space-y-6"
      >
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-primary/10 shadow-glow-sm">
            <svg className="h-7 w-7 text-accent-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-text-primary">Diagnostic Assessment</h2>
          <p className="mt-1 text-sm text-text-secondary">
            {subject} &middot; Choose question format
          </p>
          <p className="mt-2 text-xs text-text-dim">Select the type of questions for your assessment</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-status-error/20 bg-status-error/[0.06] px-4 py-2.5">
            <svg className="h-4 w-4 text-status-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <p className="text-xs text-status-error">{error}</p>
          </div>
        )}

        <div className="space-y-2">
          {types.map((t) => (
            <button
              key={t.value}
              onClick={() => setQuestionType(t.value)}
              className={`group w-full overflow-hidden rounded-xl border p-4 text-left transition-all ${
                questionType === t.value
                  ? "border-accent-primary/50 bg-accent-primary/[0.08]"
                  : "border-border-primary bg-bg-card hover:border-accent-primary/20 hover:bg-bg-elevated"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
                  questionType === t.value ? "bg-accent-primary/15 text-accent-secondary" : "bg-bg-elevated text-text-dim group-hover:text-text-secondary"
                }`}>
                  <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={t.icon} />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-primary">{t.label}</p>
                  <p className="mt-0.5 text-xs text-text-secondary">{t.desc}</p>
                </div>
                {questionType === t.value && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-primary"
                  >
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                )}
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={() => fetchQuestions(questionType)}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          Begin Assessment
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </button>
      </motion.div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-5 py-24">
        <div className="relative">
          <div className="loading-spinner h-8 w-8" />
          <div className="absolute inset-0 rounded-full bg-accent-primary/10 animate-ping" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-text-primary">Generating diagnostic quiz</p>
          <p className="mt-1 text-xs text-text-dim">Preparing questions for {subject}...</p>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="mx-auto max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-primary/10 shadow-glow-sm">
            <svg className="h-7 w-7 text-accent-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
            </svg>
          </div>
          <h2 className="mb-2 text-2xl font-bold text-text-primary">Assessment Complete</h2>
          <p className="mb-8 text-sm text-text-secondary">
            Your skill level has been determined for {subject}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-8 overflow-hidden rounded-xl border border-border-primary bg-bg-card"
        >
          {/* Level display */}
          <div className="border-b border-border-primary/50 bg-gradient-to-r from-accent-primary/[0.04] to-transparent p-6 text-center">
            <span className="text-xs font-medium uppercase tracking-widest text-text-dim">Your Level</span>
            <div className="mt-3 flex justify-center">
              <DifficultyBadge level={result.level} size="md" />
            </div>
          </div>

          {/* Score */}
          <div className="p-6">
            <ProgressBar value={result.score} label="Score" size="lg" showGlow />
            <div className="mt-4 flex items-center justify-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-text-primary">{result.correct}</p>
                <p className="text-xs text-text-dim">Correct</p>
              </div>
              <div className="h-8 w-px bg-border-primary" />
              <div className="text-center">
                <p className="text-2xl font-bold text-text-primary">{result.total}</p>
                <p className="text-xs text-text-dim">Total</p>
              </div>
              <div className="h-8 w-px bg-border-primary" />
              <div className="text-center">
                <p className="text-2xl font-bold text-accent-secondary">{result.score}%</p>
                <p className="text-xs text-text-dim">Score</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center"
        >
          <button onClick={() => onComplete(result.level)} className="btn-primary flex items-center gap-2">
            Continue to Lesson
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <div className="mb-1 flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent-primary/10">
            <svg className="h-3.5 w-3.5 text-accent-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-text-primary">Diagnostic Assessment</h2>
        </div>
        <p className="ml-8 text-sm text-text-secondary">
          Answer these questions to determine your starting level in {subject}
        </p>
      </div>

      <div className="mb-6">
        <ProgressBar value={(filledCount / questions.length) * 100} label={`${filledCount} of ${questions.length} answered`} size="sm" />
      </div>

      {error && (
        <div className="mb-5 flex items-center gap-2 rounded-lg border border-status-error/20 bg-status-error/[0.06] px-4 py-2.5">
          <svg className="h-4 w-4 text-status-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p className="text-xs text-status-error">{error}</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {questions.map((q, i) => (
          <QuestionCard
            key={i}
            index={i}
            question={q.question}
            questionType={q.type || "short"}
            options={q.options}
            expectedPoints={q.expected_points}
            userAnswer={answers[i]}
            onChange={(val) => {
              const updated = [...answers];
              updated[i] = val;
              setAnswers(updated);
            }}
          />
        ))}
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={submitting || filledCount === 0}
          className="btn-primary flex items-center gap-2"
        >
          {submitting ? (
            <>
              <span className="loading-spinner" />
              Evaluating...
            </>
          ) : (
            <>
              Submit Answers
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
