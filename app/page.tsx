"use client";
import Link from "next/link";
import { useLanguage } from "@/contexts/language-context";
import { LanguageSelector } from "@/components/ui/language-selector";

function BackgroundAnimation() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none select-none" aria-hidden>
      <div className="absolute top-[10%] left-[8%] w-64 h-64 rounded-full border border-burgundy/10 animate-pulse-ring" style={{ animationDelay: '0s' }} />
      <div className="absolute top-[12%] left-[10%] w-44 h-44 rounded-full border border-burgundy/8 animate-pulse-ring" style={{ animationDelay: '1.5s' }} />
      <div className="absolute top-[60%] right-[6%] w-80 h-80 rounded-full border border-stone-border/20 animate-pulse-ring" style={{ animationDelay: '2s' }} />
      <div className="absolute top-[62%] right-[8%] w-52 h-52 rounded-full border border-stone-border/15 animate-pulse-ring" style={{ animationDelay: '3.5s' }} />
      <div className="absolute top-[22%] left-[55%] text-7xl text-burgundy/5 animate-float-slow font-condensed font-black" style={{ animationDelay: '0.5s' }}>{String.fromCharCode(0x2B21)}</div>
      <div className="absolute top-[45%] left-[80%] text-5xl text-stone-text/10 animate-float-med" style={{ animationDelay: '1s' }}>{String.fromCharCode(0x25C8)}</div>
      <div className="absolute top-[75%] left-[20%] text-6xl text-burgundy/5 animate-drift" style={{ animationDelay: '2s' }}>{String.fromCharCode(0x25CE)}</div>
      <div className="absolute top-[15%] right-[25%] text-4xl text-stone-text/8 animate-float-slow" style={{ animationDelay: '3s' }}>{String.fromCharCode(0x25B3)}</div>
      <div className="absolute top-[50%] left-[5%] text-8xl text-stone-border/15 animate-float-med" style={{ animationDelay: '0s' }}>{String.fromCharCode(0x25C7)}</div>
      <div className="absolute top-0 left-1/3 w-[500px] h-[500px] rounded-full bg-burgundy/[0.03] blur-[120px] animate-drift" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-navy/[0.08] blur-[100px] animate-drift" style={{ animationDelay: '4s' }} />
    </div>
  );
}

export default function LandingPage() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-bg-primary flex flex-col relative">
      <BackgroundAnimation />
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-6xl mx-auto w-full">
        <div className="font-condensed font-black text-2xl tracking-[0.2em] text-beige-surface">
          FIGHT<span className="text-burgundy">LOG</span>
        </div>
        <div className="flex items-center gap-4">
          <LanguageSelector />
          <Link href="/auth/login" className="text-sm text-stone-text hover:text-beige-warm transition-colors uppercase tracking-wider hidden sm:inline">{t.nav.signIn}</Link>
          <Link href="/auth/signup" className="bg-burgundy text-beige-surface text-sm font-bold uppercase tracking-widest px-4 py-2 rounded hover:bg-burgundy-light transition-colors">{t.nav.getStarted}</Link>
        </div>
      </nav>
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center pt-8 pb-20">
        <div className="max-w-3xl w-full">
          <div className="inline-flex items-center gap-2 bg-burgundy/10 border border-burgundy/20 rounded-sm px-3 py-1 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse" />
            <span className="text-xs text-burgundy-light font-semibold uppercase tracking-widest">{t.landing.badge}</span>
          </div>
          <h1 className="font-condensed font-black text-5xl md:text-7xl lg:text-8xl text-beige-surface leading-none uppercase tracking-tight mb-6">
            {t.landing.heroLine1}<br />
            <span className="text-burgundy">{t.landing.heroLine2}</span><br />
            {t.landing.heroLine3}
          </h1>
          <p className="text-base md:text-lg text-stone-text max-w-xl mx-auto mb-10 leading-relaxed">{t.landing.heroSub}</p>
          <div className="flex flex-wrap gap-3 justify-center mb-16">
            <Link href="/auth/signup" className="bg-burgundy text-beige-surface font-bold uppercase tracking-widest px-7 py-3.5 rounded hover:bg-burgundy-light transition-colors text-sm">{t.landing.ctaPrimary}</Link>
            <Link href="/auth/login" className="border border-stone-border text-beige-warm font-semibold uppercase tracking-wider px-7 py-3.5 rounded hover:border-stone-muted transition-colors text-sm">{t.landing.ctaSecondary}</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-stone-border/30 rounded-sm overflow-hidden border border-stone-border/30">
            {[
              { icon: "◈", label: t.landing.feature1 },
              { icon: "◎", label: t.landing.feature2 },
              { icon: "◇", label: t.landing.feature3 },
              { icon: "↓", label: t.landing.feature4 },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-3 bg-bg-card px-5 py-4 hover:bg-bg-elevated transition-colors">
                <span className="text-xl text-burgundy/50">{f.icon}</span>
                <span className="text-xs text-stone-text uppercase tracking-wider font-semibold">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
      <footer className="relative z-10 border-t border-stone-border/30 py-5 text-center text-xs text-stone-text">
        <span className="font-condensed font-black tracking-widest text-beige-surface/50">FIGHTLOG</span>
        <span className="mx-2 opacity-30">·</span>
        {t.footer.tagline}
        <span className="mx-2 opacity-30">·</span>
        {new Date().getFullYear()}
      </footer>
    </div>
  );
}
