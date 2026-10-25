'use client';

import { useEffect, useState } from 'react';
import { Zap, Mail, Clock, Shield, ArrowRight, CheckCircle } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

export default function LoginPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const features = [
    { icon: Clock, text: 'Schedule emails at precise times using BullMQ delayed jobs' },
    { icon: Mail, text: 'Ethereal SMTP with clickable preview links per email' },
    { icon: Shield, text: 'Per-sender hourly rate limiting via Redis atomic counters' },
    { icon: Zap, text: 'Server restart recovery — all pending jobs re-queued automatically' },
  ];

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#0d0d1a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d1a] grid-bg flex flex-col">
      {/* Top nav */}
      <nav className="flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white text-lg tracking-tight">
            Reach<span className="text-violet-400">Inbox</span>
          </span>
        </div>
        <span className="text-xs text-gray-500 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
          Outbox Labs · Hiring Assignment
        </span>
      </nav>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-5xl w-full grid lg:grid-cols-2 gap-16 items-center">
          {/* Left — hero text */}
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-medium">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                Production-grade Email Scheduler
              </div>
              <h1 className="text-5xl font-bold text-white leading-tight tracking-tight">
                Schedule emails
                <span className="block gradient-text">at scale.</span>
              </h1>
              <p className="text-lg text-gray-400 leading-relaxed max-w-md">
                A full-stack email scheduling system built with BullMQ, Redis, PostgreSQL, and Elasticsearch.
              </p>
            </div>

            <ul className="space-y-3">
              {features.map((f) => (
                <li key={f.text} className="flex items-start gap-3">
                  <div className="mt-0.5 w-5 h-5 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                    <f.icon className="w-3 h-3 text-violet-400" />
                  </div>
                  <span className="text-sm text-gray-400">{f.text}</span>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-6 pt-2">
              {['BullMQ', 'Redis', 'PostgreSQL', 'Elasticsearch', 'Ethereal'].map((tech) => (
                <span key={tech} className="text-xs text-gray-600 font-mono">{tech}</span>
              ))}
            </div>
          </div>

          {/* Right — login card */}
          <div className="animate-modal-in">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 to-indigo-600/20 rounded-3xl blur-2xl" />

              <div className="relative glass rounded-3xl p-8 shadow-2xl space-y-6">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mx-auto shadow-xl shadow-violet-500/30 animate-float">
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white mt-4">Welcome to ReachInbox</h2>
                  <p className="text-sm text-gray-400">Sign in to manage your email campaigns</p>
                </div>

                {/* Google Login */}
                <a
                  id="google-login-button"
                  href={`${API_BASE_URL}/api/auth/google`}
                  className="flex items-center justify-center gap-3 w-full px-5 py-3.5 rounded-xl bg-white text-gray-800 font-semibold text-sm hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </a>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-3 bg-[#12122a] text-gray-500">or for local development</span>
                  </div>
                </div>

                <a
                  id="dev-login-button"
                  href={`${API_BASE_URL}/api/auth/dev-login`}
                  className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-sm hover:bg-white/10 transition-all font-medium"
                >
                  <CheckCircle className="w-4 h-4 text-violet-400" />
                  Dev Login
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </a>

                <p className="text-center text-xs text-gray-600">
                  This is a demo application for the ReachInbox hiring assignment.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-white/5 px-8 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <p className="text-xs text-gray-600">ReachInbox / Outbox Labs · Hiring Assignment</p>
          <a
            href="http://localhost:4000/api/queue"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-gray-600 hover:text-violet-400 transition-colors"
          >
            Bull Board →
          </a>
        </div>
      </footer>
    </div>
  );
}
