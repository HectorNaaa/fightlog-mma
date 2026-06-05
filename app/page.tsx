import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-stone-border/50 max-w-7xl mx-auto w-full">
        <div className="font-condensed font-black text-2xl tracking-[0.2em] text-beige-surface">
          FIGHT<span className="text-burgundy">LOG</span>
          <span className="text-xs font-sans font-normal text-stone-text ml-2 tracking-normal">MMA</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="text-sm text-stone-text hover:text-beige-warm transition-colors uppercase tracking-wider">
            Sign In
          </Link>
          <Link href="/auth/signup" className="bg-burgundy text-beige-surface text-sm font-bold uppercase tracking-widest px-4 py-2 rounded hover:bg-burgundy-light transition-colors">
            Get Started
          </Link>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6">
        {/* Hero */}
        <section className="py-20 lg:py-28">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 bg-burgundy/10 border border-burgundy/20 rounded-sm px-3 py-1 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse"></span>
              <span className="text-xs text-burgundy-light font-semibold uppercase tracking-widest">Fighter Training OS</span>
            </div>
            <h1 className="font-condensed font-black text-5xl md:text-7xl lg:text-8xl text-beige-surface leading-none uppercase tracking-tight mb-6">
              Track Your<br />
              <span className="text-burgundy">MMA Evolution</span><br />
              Like A Pro
            </h1>
            <p className="text-lg text-stone-text max-w-2xl mb-8 leading-relaxed">
              Training logs, weight tracking, grappling notes, striking setups, sparring analysis,
              personal ratings and exportable Excel reports — built for fighters who treat training as science.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/auth/signup" className="bg-burgundy text-beige-surface font-bold uppercase tracking-widest px-6 py-3 rounded hover:bg-burgundy-light transition-colors">
                Start Training Free
              </Link>
              <Link href="/auth/login" className="border border-stone-border text-beige-warm font-semibold uppercase tracking-wider px-6 py-3 rounded hover:border-stone-muted transition-colors text-sm">
                Sign In
              </Link>
            </div>
          </div>
        </section>

        {/* Dashboard preview */}
        <section className="pb-16">
          <div className="border border-stone-border rounded-sm bg-bg-secondary p-1 overflow-hidden">
            <div className="bg-bg-card rounded-sm p-5">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-stone-border">
                <div className="font-condensed font-black text-sm tracking-widest text-beige-surface">FIGHT<span className="text-burgundy">LOG</span></div>
                <div className="text-[10px] text-stone-text ml-2 uppercase tracking-widest">Dashboard Preview</div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {[
                  { label: "This Week", value: "5", unit: "sessions" },
                  { label: "Volume", value: "312", unit: "min" },
                  { label: "Avg Intensity", value: "7.4", unit: "/ 10" },
                  { label: "Body Weight", value: "77.2", unit: "kg" },
                ].map((s) => (
                  <div key={s.label} className="bg-bg-elevated border border-stone-border/50 rounded-sm p-3">
                    <div className="text-[9px] text-stone-text uppercase tracking-widest mb-1">{s.label}</div>
                    <div className="font-condensed font-black text-2xl text-beige-surface">
                      {s.value}<span className="text-xs font-normal text-stone-text ml-1">{s.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-bg-elevated border border-stone-border/50 rounded-sm p-3">
                  <div className="text-[10px] text-stone-text uppercase tracking-widest mb-2">Recent Sessions</div>
                  {[
                    { type: "MMA", focus: "Clinch work", dur: "90m", int: 8 },
                    { type: "BJJ", focus: "Guard retention", dur: "75m", int: 7 },
                    { type: "Boxing", focus: "Counter right", dur: "60m", int: 8 },
                    { type: "Strength", focus: "Posterior chain", dur: "45m", int: 7 },
                  ].map((row) => (
                    <div key={row.focus} className="flex items-center justify-between py-1.5 border-b border-stone-border/30 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] bg-burgundy/20 text-burgundy-light border border-burgundy/30 px-1.5 py-0.5 rounded-sm uppercase font-bold">
                          {row.type}
                        </span>
                        <span className="text-xs text-stone-text">{row.focus}</span>
                      </div>
                      <span className="text-xs text-beige-warm">{row.dur} · {row.int}/10</span>
                    </div>
                  ))}
                </div>
                <div className="bg-bg-elevated border border-stone-border/50 rounded-sm p-3">
                  <div className="text-[10px] text-stone-text uppercase tracking-widest mb-2">Weekly Volume</div>
                  <div className="flex items-end gap-1 h-20">
                    {[40, 90, 60, 0, 75, 45, 90].map((v, i) => (
                      <div key={i} className="flex-1 flex flex-col justify-end">
                        <div className="bg-burgundy/60 rounded-sm" style={{ height: `${v}%`, minHeight: v > 0 ? 4 : 0 }} />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-1">
                    {["M","T","W","T","F","S","S"].map((d, i) => (
                      <span key={i} className="flex-1 text-center text-[9px] text-stone-text">{d}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 border-t border-stone-border/30">
          <div className="text-center mb-12">
            <h2 className="font-condensed font-black text-3xl md:text-4xl uppercase tracking-widest text-beige-surface mb-2">
              Everything a Fighter Needs
            </h2>
            <p className="text-stone-text text-sm">One system. No noise.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-bg-card border border-stone-border rounded-sm p-5">
                <div className="text-2xl mb-3 opacity-60">{f.icon}</div>
                <div className="font-condensed font-bold text-lg uppercase tracking-wide text-beige-surface mb-2">{f.title}</div>
                <p className="text-sm text-stone-text leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Levels */}
        <section className="py-16 border-t border-stone-border/30">
          <div className="text-center mb-12">
            <h2 className="font-condensed font-black text-3xl md:text-4xl uppercase tracking-widest text-beige-surface mb-2">
              Built for Every Level
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <LevelCard title="Beginner" tag="Available" color="navy"
              features={["Session logging", "Basic striking guide", "Grappling fundamentals", "Body weight tracking", "Training volume charts"]}
              available />
            <LevelCard title="Intermediate Amateur" tag="Available" color="burgundy"
              features={["Sparring analysis", "Gameplan builder", "Technique tracker", "Weekly review", "Excel export"]}
              available highlight />
            <LevelCard title="Professional Mode" tag="Coming Soon" color="amber"
              features={["Opponent analysis", "Weight cut planner", "Coach dashboard", "AI insights", "Video tagging"]}
              available={false} />
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 border-t border-stone-border/30 text-center mb-8">
          <h2 className="font-condensed font-black text-4xl md:text-5xl uppercase tracking-widest text-beige-surface mb-4">
            Start Building Your <span className="text-burgundy">Fight Career</span>
          </h2>
          <p className="text-stone-text mb-8 max-w-xl mx-auto">Free. No subscriptions. Your training data stays yours.</p>
          <Link href="/auth/signup" className="inline-block bg-burgundy text-beige-surface font-black uppercase tracking-widest px-8 py-4 text-lg rounded hover:bg-burgundy-light transition-colors">
            Create Free Account
          </Link>
        </section>
      </main>

      <footer className="border-t border-stone-border/30 py-6 text-center text-xs text-stone-text">
        <span className="font-condensed font-black tracking-widest text-beige-surface/60">FIGHTLOG MMA</span>
        <span className="mx-2">·</span>Built for fighters<span className="mx-2">·</span>{new Date().getFullYear()}
      </footer>
    </div>
  );
}

const FEATURES = [
  { icon: "◈", title: "Training Log", desc: "Spreadsheet-style session tracking with type, duration, intensity, energy, soreness and coach feedback." },
  { icon: "◎", title: "Technical Tracker", desc: "Rate your striking and grappling techniques. Track confidence, success rates, setups and counters." },
  { icon: "◇", title: "Gameplan Builder", desc: "Build tactical setups: triggers, actions, follow-ups and counter risks for any situation." },
  { icon: "△", title: "Physical Metrics", desc: "Log body weight, heart rate, sleep, calories and recovery score. See trends over time." },
  { icon: "⬡", title: "Sparring Review", desc: "Analyze every sparring session: dominant moments, mistakes, technique success and lessons learned." },
  { icon: "↓", title: "Excel Export", desc: "Download all your data — training logs, metrics, techniques and gameplans — in a multi-sheet Excel file." },
];

function LevelCard({ title, tag, color, features, available, highlight = false }: {
  title: string; tag: string; color: "navy" | "burgundy" | "amber";
  features: string[]; available: boolean; highlight?: boolean;
}) {
  const borderColor = { navy: "border-navy/40", burgundy: "border-burgundy/40", amber: "border-amber/30" }[color];
  const tagColor = {
    navy: "bg-navy/20 text-navy-light",
    burgundy: "bg-burgundy/20 text-burgundy-light",
    amber: "bg-amber/10 text-amber/60",
  }[color];

  return (
    <div className={`bg-bg-card border ${borderColor} rounded-sm p-5 ${!available ? "opacity-60" : ""} ${highlight ? "ring-1 ring-burgundy/30" : ""}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="font-condensed font-black text-xl uppercase tracking-wide text-beige-surface">{title}</div>
        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm ${tagColor}`}>{tag}</span>
      </div>
      <ul className="space-y-2 mb-5">
        {features.map((f) => (
          <li key={f} className="text-xs text-stone-text flex items-start gap-2">
            <span className={`mt-0.5 ${available ? "text-amber" : "text-stone-text/30"}`}>◦</span>
            {f}
          </li>
        ))}
      </ul>
      {available ? (
        <Link href="/auth/signup" className={`block text-center text-xs font-bold uppercase tracking-widest py-2 border rounded-sm transition-colors ${
          color === "burgundy"
            ? "border-burgundy text-burgundy-light hover:bg-burgundy/10"
            : "border-stone-border text-stone-text hover:border-stone-muted"
        }`}>
          Get Started
        </Link>
      ) : (
        <div className="text-center text-xs text-stone-text/40 uppercase tracking-widest border border-stone-border/30 py-2 rounded-sm">
          🔒 Coming Soon
        </div>
      )}
    </div>
  );
}

