"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generatePodcast, PodcastResponse, PodcastScriptEntry, AUDIO_BASE } from "@/lib/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Props {
  onBack: () => void;
}

type Phase = "input" | "loading" | "ready";

// ---------------------------------------------------------------------------
// Waveform bars (decorative animation)
// ---------------------------------------------------------------------------

function WaveformBars({ playing, count = 32 }: { playing: boolean; count?: number }) {
  return (
    <div className="flex items-end justify-center gap-[2px] h-10">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full bg-gradient-to-t from-accent-primary to-accent-cyan"
          animate={
            playing
              ? {
                  height: [6, 14 + Math.random() * 22, 6],
                  opacity: [0.5, 1, 0.5],
                }
              : { height: 6, opacity: 0.3 }
          }
          transition={
            playing
              ? {
                  duration: 0.5 + Math.random() * 0.6,
                  repeat: Infinity,
                  repeatType: "reverse",
                  delay: i * 0.03,
                }
              : { duration: 0.4 }
          }
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Audio player component
// ---------------------------------------------------------------------------

function AudioPlayer({
  src,
  label,
  compact = false,
}: {
  src: string;
  label?: string;
  compact?: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => {
      setCurrentTime(a.currentTime);
      setProgress(a.duration ? (a.currentTime / a.duration) * 100 : 0);
    };
    const onMeta = () => setDuration(a.duration);
    const onEnd = () => setPlaying(false);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("ended", onEnd);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("ended", onEnd);
    };
  }, [src]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
    } else {
      a.play().catch(() => {});
    }
    setPlaying(!playing);
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current;
    if (!a || !a.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    a.currentTime = pct * a.duration;
  };

  const fmt = (s: number) => {
    if (!s || !isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  if (compact) {
    return (
      <>
        <audio ref={audioRef} src={src} preload="metadata" />
        <button
          onClick={toggle}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border-primary bg-bg-elevated text-text-secondary transition-all hover:border-accent-primary/40 hover:text-accent-secondary hover:shadow-glow-sm"
          title={playing ? "Pause" : "Play"}
        >
          {playing ? (
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="h-3.5 w-3.5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      </>
    );
  }

  return (
    <div className="glass-card p-5">
      <audio ref={audioRef} src={src} preload="metadata" />

      {label && (
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent-primary/15">
            <svg className="h-3.5 w-3.5 text-accent-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
            </svg>
          </div>
          <span className="text-sm font-medium text-text-secondary">{label}</span>
        </div>
      )}

      {/* Waveform */}
      <WaveformBars playing={playing} />

      {/* Controls & progress */}
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={toggle}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-accent-primary text-white shadow-glow-sm transition-all hover:bg-accent-muted hover:shadow-glow-md active:scale-95"
        >
          {playing ? (
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="h-4 w-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <div className="flex flex-1 flex-col gap-1">
          <div
            className="group relative h-2 cursor-pointer rounded-full bg-border-primary"
            onClick={seek}
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-accent-primary to-accent-cyan transition-all"
              style={{ width: `${progress}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full border-2 border-accent-primary bg-white shadow-glow-sm opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `calc(${progress}% - 7px)` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-text-dim font-mono">
            <span>{fmt(currentTime)}</span>
            <span>{fmt(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Speaker avatar
// ---------------------------------------------------------------------------

function SpeakerAvatar({ speaker }: { speaker: string }) {
  const isHost = speaker === "host";
  return (
    <div
      className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
        isHost
          ? "bg-gradient-to-br from-accent-primary/30 to-accent-primary/10 text-accent-secondary ring-1 ring-accent-primary/20"
          : "bg-gradient-to-br from-accent-cyan/30 to-accent-cyan/10 text-accent-cyan ring-1 ring-accent-cyan/20"
      }`}
    >
      {isHost ? (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
        </svg>
      ) : (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
        </svg>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading state
// ---------------------------------------------------------------------------

const LOADING_TIPS = [
  "Crafting the perfect script…",
  "Choosing the best analogies…",
  "Tuning the host's voice…",
  "Synthesising expert commentary…",
  "Mixing the audio layers…",
  "Polishing the final cut…",
];

function PodcastLoading() {
  const [tipIdx, setTipIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTipIdx((i) => (i + 1) % LOADING_TIPS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-8 py-16"
    >
      {/* Animated podcast icon */}
      <div className="relative">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute -inset-6 rounded-full border border-dashed border-accent-primary/20"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          className="absolute -inset-12 rounded-full border border-dashed border-accent-cyan/10"
        />
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-primary/20 to-accent-cyan/10 shadow-glow-md"
        >
          <svg className="h-9 w-9 text-accent-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
          </svg>
        </motion.div>
      </div>

      {/* Loading spinner + text */}
      <div className="flex flex-col items-center gap-3">
        <div className="loading-spinner !h-6 !w-6" />
        <AnimatePresence mode="wait">
          <motion.p
            key={tipIdx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="text-sm text-text-muted"
          >
            {LOADING_TIPS[tipIdx]}
          </motion.p>
        </AnimatePresence>
        <p className="text-xs text-text-dim mt-2">This may take a few minutes — hang tight!</p>
      </div>

      {/* Decorative waveform */}
      <WaveformBars playing={true} count={48} />
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function PodcastPage({ onBack }: Props) {
  const [phase, setPhase] = useState<Phase>("input");
  const [topic, setTopic] = useState("");
  const [podcast, setPodcast] = useState<PodcastResponse | null>(null);
  const [error, setError] = useState("");
  const [activeSpeaker, setActiveSpeaker] = useState<number | null>(null);

  const generate = useCallback(async () => {
    if (!topic.trim()) return;
    setError("");
    setPhase("loading");
    try {
      const data = await generatePodcast(topic.trim());
      setPodcast(data);
      setPhase("ready");
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.detail || err?.message || "Failed to generate podcast");
      setPhase("input");
    }
  }, [topic]);

  const reset = () => {
    setPhase("input");
    setTopic("");
    setPodcast(null);
    setError("");
    setActiveSpeaker(null);
  };

  // ── Input phase ──
  if (phase === "input") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-2xl"
      >
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-primary/20 to-accent-cyan/10 shadow-glow-sm">
            <svg className="h-8 w-8 text-accent-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">
            Create a <span className="gradient-text">Podcast</span>
          </h1>
          <p className="mt-2 text-sm text-text-muted">
            Enter any topic and we&apos;ll generate an engaging two-speaker educational podcast with AI voices.
          </p>
        </div>

        {/* Speakers preview */}
        <div className="mb-8 grid grid-cols-2 gap-4">
          <div className="glass-card p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-accent-primary/30 to-accent-primary/10 ring-1 ring-accent-primary/20">
              <svg className="h-4.5 w-4.5 text-accent-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">Alex</p>
              <p className="text-xs text-text-dim">Host &middot; Curious &amp; Engaging</p>
            </div>
          </div>
          <div className="glass-card p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-accent-cyan/30 to-accent-cyan/10 ring-1 ring-accent-cyan/20">
              <svg className="h-4.5 w-4.5 text-accent-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">Dr. Sam</p>
              <p className="text-xs text-text-dim">Expert &middot; Insightful &amp; Clear</p>
            </div>
          </div>
        </div>

        {/* Topic input */}
        <div className="glass-card p-6">
          <label className="mb-2 block text-xs font-medium text-text-dim uppercase tracking-wider">
            Podcast Topic
          </label>
          <div className="relative">
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && generate()}
              placeholder="e.g. How neural networks learn, The history of the internet…"
              className="w-full rounded-xl border border-border-primary bg-bg-input px-4 py-3.5 pr-12 text-sm text-text-primary placeholder:text-text-dim/50 focus:border-accent-primary/50 focus:outline-none focus:ring-1 focus:ring-accent-primary/20 transition-all"
              autoFocus
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
            </div>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 text-xs text-status-error"
            >
              {error}
            </motion.p>
          )}

          <div className="mt-5 flex items-center gap-3">
            <button onClick={generate} disabled={!topic.trim()} className="btn-primary flex-1 flex items-center justify-center gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
              </svg>
              Generate Podcast
            </button>
            <button onClick={onBack} className="btn-secondary">
              Back
            </button>
          </div>
        </div>

        {/* Feature hints */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            { icon: "✨", label: "AI Script", desc: "Mistral-powered dialogue" },
            { icon: "🎤", label: "AI Voices", desc: "Orpheus TTS synthesis" },
            { icon: "🎧", label: "Full Episode", desc: "Stream or download" },
          ].map((f) => (
            <div key={f.label} className="rounded-lg border border-border-primary/50 bg-bg-card/50 p-3 text-center">
              <div className="text-lg mb-1">{f.icon}</div>
              <p className="text-xs font-medium text-text-secondary">{f.label}</p>
              <p className="text-[10px] text-text-dim">{f.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  // ── Loading phase ──
  if (phase === "loading") {
    return <PodcastLoading />;
  }

  // ── Ready phase ──
  if (!podcast) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto max-w-3xl"
    >
      {/* Podcast header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="mb-4 flex items-center gap-1.5 text-xs text-text-dim hover:text-text-secondary transition-colors"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back
        </button>

        <div className="glass-card overflow-hidden">
          {/* Gradient banner */}
          <div className="relative h-28 bg-gradient-to-br from-accent-primary/20 via-accent-primary/5 to-accent-cyan/15 overflow-hidden">
            <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-30" />
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-glass-bg to-transparent" />
            {/* Decorative circles */}
            <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-accent-primary/10 blur-2xl" />
            <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-accent-cyan/10 blur-2xl" />
          </div>

          <div className="relative -mt-8 px-6 pb-5">
            {/* Podcast icon */}
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-bg-card border border-border-primary shadow-elevated">
              <svg className="h-7 w-7 text-accent-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
            </div>

            <h1 className="text-xl font-bold text-text-primary tracking-tight">
              {podcast.topic}
            </h1>
            <div className="mt-1 flex items-center gap-3 text-xs text-text-dim">
              <span className="flex items-center gap-1">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
                Alex &amp; Dr. Sam
              </span>
              <span>{podcast.segments} exchanges</span>
              {podcast.has_audio && <span className="flex items-center gap-1 text-status-success"><span className="h-1.5 w-1.5 rounded-full bg-status-success" /> Audio ready</span>}
              {!podcast.has_audio && <span className="flex items-center gap-1 text-text-dim"><span className="h-1.5 w-1.5 rounded-full bg-text-dim" /> Text only</span>}
            </div>

            {/* Speakers */}
            <div className="mt-4 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <SpeakerAvatar speaker="host" />
                <div>
                  <p className="text-xs font-semibold text-text-primary">Alex</p>
                  <p className="text-[10px] text-text-dim">Host</p>
                </div>
              </div>
              <div className="h-6 w-px bg-border-primary" />
              <div className="flex items-center gap-2">
                <SpeakerAvatar speaker="guest" />
                <div>
                  <p className="text-xs font-semibold text-text-primary">Dr. Sam</p>
                  <p className="text-[10px] text-text-dim">Expert Guest</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full episode player */}
      {podcast.has_audio && podcast.full_audio_url && (
        <div className="mb-6">
          <AudioPlayer src={`${AUDIO_BASE}${podcast.full_audio_url}`} label="Full Episode" />
        </div>
      )}

      {/* Transcript */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent-primary/10">
            <svg className="h-3.5 w-3.5 text-accent-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
          </div>
          <h2 className="text-sm font-semibold text-text-secondary tracking-wide uppercase">Transcript</h2>
        </div>

        <div className="space-y-3">
          {podcast.script.map((entry: PodcastScriptEntry, idx: number) => {
            const isHost = entry.speaker === "host";
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: isHost ? -16 : 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.06 }}
                className={`flex gap-3 ${isHost ? "" : "flex-row-reverse"}`}
              >
                <SpeakerAvatar speaker={entry.speaker} />

                <div
                  className={`group relative max-w-[80%] rounded-2xl border px-4 py-3 transition-all ${
                    isHost
                      ? "rounded-tl-md border-accent-primary/10 bg-accent-primary/[0.04] hover:border-accent-primary/20"
                      : "rounded-tr-md border-accent-cyan/10 bg-accent-cyan/[0.04] hover:border-accent-cyan/20"
                  } ${activeSpeaker === idx ? (isHost ? "border-accent-primary/30 bg-accent-primary/[0.08]" : "border-accent-cyan/30 bg-accent-cyan/[0.08]") : ""}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isHost ? "text-accent-secondary" : "text-accent-cyan"}`}>
                      {entry.name || (isHost ? "Alex" : "Dr. Sam")}
                    </span>
                    {entry.emotion && entry.emotion !== "neutral" && (
                      <span className="text-[10px] text-text-dim italic">
                        {entry.emotion === "happy" ? "😊" : entry.emotion === "excited" ? "🤩" : entry.emotion === "thoughtful" ? "🤔" : ""}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-text-primary/90 leading-relaxed">
                    {entry.text}
                  </p>

                  {/* Segment play button */}
                  {entry.audio_url && (
                    <div className="absolute -bottom-1 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <AudioPlayer src={`${AUDIO_BASE}${entry.audio_url}`} compact />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pb-8">
        <button onClick={reset} className="btn-primary flex items-center gap-2">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Podcast
        </button>
        <button onClick={onBack} className="btn-secondary">
          Back
        </button>
      </div>
    </motion.div>
  );
}
