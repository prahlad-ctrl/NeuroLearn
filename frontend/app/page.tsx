"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import ThemeToggle from "@/components/ThemeToggle";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen bg-bg-primary overflow-hidden">
      {/* Background effects */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-[var(--grid-opacity)]" />
        <div className="absolute -top-[300px] left-1/2 -translate-x-1/2 h-[600px] w-[600px] rounded-full bg-gradient-radial from-accent-primary/[0.07] to-transparent" />
        <div className="absolute -bottom-[200px] -left-[200px] h-[500px] w-[500px] rounded-full bg-gradient-radial from-accent-cyan/[0.04] to-transparent" />
        <div className="absolute -bottom-[200px] -right-[200px] h-[500px] w-[500px] rounded-full bg-gradient-radial from-accent-primary/[0.04] to-transparent" />
        <div className="absolute inset-0" style={{ opacity: "var(--noise-opacity)", backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")" }} />
      </div>

      <nav className="fixed w-full z-50 top-0 start-0 border-b border-white/10 bg-bg-primary/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center space-x-3 rtl:space-x-reverse group">
             <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-primary/10 transition-all duration-300 group-hover:bg-accent-primary/20 group-hover:shadow-glow-sm group-hover:scale-110">
              <svg className="h-6 w-6 text-accent-secondary transition-transform duration-300 group-hover:rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
              </svg>
            </div>
            <span className="self-center text-2xl font-bold whitespace-nowrap bg-gradient-text animate-text-shimmer bg-clip-text text-transparent">NeuroLearn</span>
          </Link>
          <div className="flex md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse gap-4">
            <Link href="/login">
              <button type="button" className="text-text-primary hover:text-white font-medium rounded-lg text-sm px-4 py-2 text-center transition-colors">Login</button>
            </Link>
            <Link href="/signup">
              <button type="button" className="text-white bg-accent-primary hover:bg-accent-primary/90 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center transition-all hover:scale-105 hover:shadow-glow-sm shadow-lg shadow-accent-primary/20">Get started</button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="mx-auto max-w-3xl py-32 sm:py-48 lg:py-56 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl font-bold tracking-tight text-text-primary sm:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/70">
              Master any subject with AI-powered adaptive learning
            </h1>
            <p className="mt-6 text-lg leading-8 text-text-secondary">
              NeuroLearn uses advanced AI to create personalized lesson plans, quizzes, and exercises tailored to your unique learning style and pace.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/signup" className="rounded-md bg-accent-primary px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-accent-primary/25 hover:bg-accent-primary/90 hover:scale-105 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                Start Learning Now
              </Link>
              <Link href="/login" className="text-sm font-semibold leading-6 text-text-primary hover:text-white transition-colors">
                Log in <span aria-hidden="true">→</span>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
