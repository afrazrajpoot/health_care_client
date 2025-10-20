import Link from 'next/link';

interface DiffCardProps {
  title: string;
  text: string;
}

interface StepCardProps {
  number: string;
  title: string;
  text: string;
}

function DiffCard({ title, text }: DiffCardProps) {
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-left hover:border-indigo-600 transition-all">
      <h3 className="text-xl font-semibold text-indigo-400 mb-2">{title}</h3>
      <p className="text-slate-300 text-sm leading-relaxed">{text}</p>
    </div>
  );
}

function StepCard({ number, title, text }: StepCardProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-left hover:border-indigo-600 transition-all">
      <div className="text-indigo-400 font-extrabold text-3xl mb-2">{number}</div>
      <div className="text-lg font-semibold text-white mb-1">{title}</div>
      <div className="text-slate-400 text-sm">{text}</div>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-white">
      {/* NAV */}
      <header className="sticky top-0 z-40 bg-slate-950/70 backdrop-blur border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-indigo-500 shadow-lg" />
            <span className="font-extrabold tracking-tight text-2xl text-white">Kebilo</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-300">
            <a href="#features" className="hover:text-indigo-400">Features</a>
            <a href="#why" className="hover:text-indigo-400">Why Kebilo</a>
            <a href="#how" className="hover:text-indigo-400">How It Works</a>
          </nav>
          <a href={`${process.env.NEXTAUTH_URL}/auth/sign-in`} className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 font-semibold">
            Explore Kebilo
          </a>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden text-center py-32 px-4">
        <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-tight">
          Workflow Intelligence for the Modern Clinic
        </h1>
        <p className="mt-6 text-lg md:text-xl text-slate-300 max-w-2xl mx-auto">
          Kebilo transforms every fax, email, and report into clear, accountable workflow—without touching your EMR.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <a href={`${process.env.NEXTAUTH_URL}/auth/sign-in`} className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-lg">
            Start Now
          </a>
          <Link href="/demo" className="px-6 py-3 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-800">
            Watch Demo
          </Link>
        </div>
        <p className="mt-4 text-sm text-slate-400">No contracts · Cancel anytime · Physician-founded</p>
      </section>

      {/* DIFFERENTIATORS */}
      <section id="why" className="bg-slate-900/70 border-t border-slate-800 py-20 text-center">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-extrabold mb-8">Why Kebilo Is Different</h2>
          <p className="text-lg text-slate-300 max-w-3xl mx-auto mb-14">
            Not another EMR. Kebilo is your command layer — the missing intelligence that organizes, routes, and tracks the work your EMR can't.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <DiffCard
              title="Department‑Driven Workflow"
              text="Tasks flow through departments automatically, mirroring how real clinics operate — not how software assumes they should."
            />
            <DiffCard
              title="Zero‑Integration Document AI"
              text="Every inbound fax, email, or PDF is read, classified, and routed with zero setup. No APIs, no downtime, no IT."
            />
            <DiffCard
              title="Dual‑Mode Engine"
              text="Switch between Workers' Comp and General Medicine workflows in one clean interface — adaptable, precise, and context‑aware."
            />
            <DiffCard
              title="Future‑Ready, Physician‑Guided AI"
              text="Built to evolve responsibly as AI evolves — every decision transparent, compliant, and medically grounded."
            />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="bg-slate-950 py-20 border-t border-slate-800 text-center">
        <h2 className="text-4xl font-extrabold mb-10">How Kebilo Works</h2>
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8 px-6">
          <StepCard
            number="1"
            title="SnapLink Uploads"
            text="Drop or forward any document — Kebilo reads and assigns it instantly."
          />
          <StepCard
            number="2"
            title="Smart Trigger Matrix"
            text="Auto‑routes tasks to the right department and sets precise timelines."
          />
          <StepCard
            number="3"
            title="Mission Control Dashboard"
            text="See every document, task, and update — one screen, zero chaos."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-indigo-700 text-white py-24 text-center">
        <h2 className="text-4xl font-extrabold">From intake to insight — Kebilo keeps your clinic in sync.</h2>
        <p className="mt-3 text-indigo-100 max-w-2xl mx-auto">
          Modern workflow clarity for physicians, staff, and patients. Built for real medicine, not software demos.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <a href={`${process.env.NEXTAUTH_URL}/auth/sign-in`} className="px-8 py-3 rounded-xl bg-white text-indigo-700 font-semibold hover:bg-indigo-50">
            Explore Kebilo
          </a>
          <Link href="/demo" className="px-8 py-3 rounded-xl border border-white text-white hover:bg-indigo-600">
            See it in action
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-800 bg-slate-950 text-center py-8 text-sm text-slate-400">
        <p>Created by a board‑certified physician to simplify the medical back office — responsibly.</p>
        <p className="mt-1">© 2025 Kebilo. All rights reserved.</p>
      </footer>
    </div>
  );
}