"use client";

import { useEffect } from "react";
import Head from "next/head";
import Link from "next/link";

export default function Home() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll(".reveal"));
    let i = 0;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const el = e.target;
            el.style.transitionDelay = Math.min(i * 120, 600) + "ms";
            i++;
            el.classList.add("show");
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -10% 0px" }
    );

    els.forEach((el) => io.observe(el));

    return () => {
      io.disconnect();
    };
  }, []);

  return (
    <>
      <Head>
        <title>Kebilo — The First Workflow Intelligence Layer</title>
        <meta
          name="description"
          content="Kebilo turns faxes, emails, and reports into accountable tasks and physician-ready summaries — without touching your EMR."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="min-h-screen bg-white text-black">
        {/* NAV */}
        <header className="sticky top-0 z-40 bg-white/70 backdrop-blur border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-indigo-500 shadow-lg"></div>
              <span className="font-extrabold tracking-tight text-2xl text-black">
                Kebilo
              </span>
            </div>
            <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600">
              <a href="#firsts" className="hover:text-indigo-600">
                Why We’re First
              </a>
              <a href="#how" className="hover:text-indigo-600">
                How It Works
              </a>
              <a href="#trust" className="hover:text-indigo-600">
                Privacy & Trust
              </a>
            </nav>
            <a
              href="#cta"
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 font-semibold"
            >
              Explore Kebilo
            </a>
          </div>
        </header>

        {/* HERO */}
        <section className="relative overflow-hidden text-center py-28 px-4">
          <h1 className="reveal text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
            The First Workflow Intelligence Layer
          </h1>
          <p className="reveal mt-5 text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Kebilo turns every fax, email, and report into accountable tasks and
            physician-ready summaries — without touching your EMR.
          </p>
          <div className="reveal mt-8 flex flex-wrap justify-center gap-3">
            <span className="text-xs md:text-sm px-3 py-1 rounded-full bg-gray-100 border border-gray-300 text-gray-800">
              First to route <em>by department</em>
            </span>
            <span className="text-xs md:text-sm px-3 py-1 rounded-full bg-gray-100 border border-gray-300 text-gray-800">
              First zero‑integration document AI
            </span>
            <span className="text-xs md:text-sm px-3 py-1 rounded-full bg-gray-100 border border-gray-300 text-gray-800">
              First dual‑mode: WC ↔︎ General Med
            </span>
            <span className="text-xs md:text-sm px-3 py-1 rounded-full bg-gray-100 border border-gray-300 text-gray-800">
              First zero‑retention summaries
            </span>
          </div>
          <div className="reveal mt-8 flex flex-wrap justify-center gap-4">
            <Link href = '/auth/sign-up'
            
              className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-lg animate-pulse"
            >
              Start Now
            </Link>
            <a
              href="#demo"
              className="px-6 py-3 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-100"
            >
              Watch Demo
            </a>
          </div>
          <p className="reveal mt-4 text-sm text-gray-500">
            No contracts · Cancel anytime · Physician‑founded
          </p>
        </section>

        {/* WHY FIRST */}
        <section
          id="firsts"
          className="bg-gray-50 border-t border-gray-200 py-20"
        >
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="reveal text-4xl font-extrabold mb-10 text-center">
              Why “First” Actually Matters
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="reveal bg-white border border-gray-200 rounded-2xl p-6 text-left hover:border-indigo-500">
                <h3 className="text-xl font-semibold text-indigo-600 mb-2">
                  Department‑Driven Routing
                </h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Tasks flow to Scheduling, Clinical, Admin/Compliance, or
                  Authorizations — mirroring how clinics really work. No
                  user‑by‑user chaos.
                </p>
              </div>
              <div className="reveal bg-white border border-gray-200 rounded-2xl p-6 text-left hover:border-indigo-500">
                <h3 className="text-xl font-semibold text-indigo-600 mb-2">
                  Zero‑Integration Document AI
                </h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Reads inbound faxes/emails, classifies intent, and creates
                  tasks automatically. Works alongside any EMR.
                </p>
              </div>
              <div className="reveal bg-white border border-gray-200 rounded-2xl p-6 text-left hover:border-indigo-500">
                <h3 className="text-xl font-semibold text-indigo-600 mb-2">
                  Dual‑Mode Engine
                </h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Toggle Workers’ Comp ↔︎ General Medicine to adapt triggers,
                  language, and timelines — one interface, two worlds.
                </p>
              </div>
              <div className="reveal bg-white border border-gray-200 rounded-2xl p-6 text-left hover:border-indigo-500">
                <h3 className="text-xl font-semibold text-indigo-600 mb-2">
                  Zero‑Retention Summaries
                </h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Physicians get concise summaries with secure, time‑limited
                  links to the source PDF. No persistent PHI copies on our side.
                </p>
              </div>
            </div>
            <div className="mt-10 grid md:grid-cols-3 gap-6">
              <div className="reveal bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center">
                <div className="text-4xl font-extrabold text-indigo-600">
                  –40%
                </div>
                <div className="text-sm text-gray-700 mt-1">
                  Admin time on docs
                </div>
              </div>
              <div className="reveal bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center">
                <div className="text-4xl font-extrabold text-indigo-600">
                  +30%
                </div>
                <div className="text-sm text-gray-700 mt-1">
                  Faster case turnaround
                </div>
              </div>
              <div className="reveal bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center">
                <div className="text-4xl font-extrabold text-indigo-600">0</div>
                <div className="text-sm text-gray-700 mt-1">
                  Integrations required
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section
          id="how"
          className="bg-white py-20 border-t border-gray-200 text-center"
        >
          <h2 className="reveal text-4xl font-extrabold mb-10">
            How Kebilo Works
          </h2>
          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8 px-6">
            <div className="reveal bg-gray-50 border border-gray-200 rounded-2xl p-6 text-left hover:border-indigo-500">
              <div className="text-indigo-600 font-extrabold text-3xl mb-2">
                1
              </div>
              <div className="text-lg font-semibold text-black mb-1">
                SnapLink Uploads
              </div>
              <div className="text-gray-600 text-sm">
                Drop or forward any document — Kebilo reads and assigns it
                instantly.
              </div>
            </div>
            <div className="reveal bg-gray-50 border border-gray-200 rounded-2xl p-6 text-left hover:border-indigo-500">
              <div className="text-indigo-600 font-extrabold text-3xl mb-2">
                2
              </div>
              <div className="text-lg font-semibold text-black mb-1">
                Smart Department Triggers
              </div>
              <div className="text-gray-600 text-sm">
                Auto‑routes tasks with deadlines to the right queue.
              </div>
            </div>
            <div className="reveal bg-gray-50 border border-gray-200 rounded-2xl p-6 text-left hover:border-indigo-500">
              <div className="text-indigo-600 font-extrabold text-3xl mb-2">
                3
              </div>
              <div className="text-lg font-semibold text-black mb-1">
                Mission Control
              </div>
              <div className="text-gray-600 text-sm">
                One screen shows every task, note, and summary — zero chaos.
              </div>
            </div>
          </div>
        </section>

        {/* TRUST & PRIVACY */}
        <section
          id="trust"
          className="bg-gray-50 py-20 border-t border-gray-200"
        >
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="reveal text-4xl font-extrabold mb-6 text-center">
              Privacy & Security — Built for Medicine
            </h2>
            <ul className="grid md:grid-cols-2 gap-4 text-gray-800">
              <li className="reveal bg-gray-50 border border-gray-200 rounded-2xl p-5">
                HIPAA‑aligned hosting, end‑to‑end encryption, role‑based access
                with full audit trail.
              </li>
              <li className="reveal bg-gray-50 border border-gray-200 rounded-2xl p-5">
                Zero‑retention option: parse, summarize, delete file —
                physicians view source via time‑limited secure link.
              </li>
              <li className="reveal bg-gray-50 border border-gray-200 rounded-2xl p-5">
                Department‑first queues reduce exposure vs. user‑to‑user
                forwarding and inbox sprawl.
              </li>
              <li className="reveal bg-gray-50 border border-gray-200 rounded-2xl p-5">
                No EMR integration required — complements your current system
                without adding risk.
              </li>
            </ul>
          </div>
        </section>

        {/* ROI / CTA */}
        <section
          id="cta"
          className="bg-indigo-600 text-white py-24 text-center"
        >
          <div className="reveal">
            <h2 className="text-4xl font-extrabold">
              Half the effort. Twice the visibility.
            </h2>
            <p className="mt-3 text-indigo-50 max-w-2xl mx-auto">
              For less than one missed appointment a month, Kebilo turns hours
              of chaos into minutes of clarity. No contracts. No IT. No reason
              not to.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <a
                href="#"
                className="px-8 py-3 rounded-xl bg-white text-indigo-700 font-semibold hover:bg-indigo-50"
              >
                Explore Kebilo
              </a>
              <a
                href="#demo"
                className="px-8 py-3 rounded-xl border border-white text-white hover:bg-indigo-700"
              >
                See it in action
              </a>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-gray-200 bg-white text-center py-8 text-sm text-gray-500">
          <p>
            Created by a board‑certified physician to simplify the medical back
            office — responsibly.
          </p>
          <p className="mt-1">© 2025 Kebilo. All rights reserved.</p>
        </footer>
      </div>

      <style jsx global>{`
        .reveal {
          opacity: 0;
          transform: translateY(1.5rem);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .reveal.show {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </>
  );
}
