"use client";
import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { useTheme } from "@/contexts/theme-context";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { LEVELS, DISCIPLINES, cn } from "@/lib/utils";

interface ProfileResponse {
  name: string;
  email: string;
  level: string;
  gymName?: string | null;
  disciplines?: string[];
  profile?: {
    displayName?: string | null;
    city?: string | null;
    postalCode?: string | null;
    weightClass?: string | null;
    beltRank?: string | null;
  } | null;
}

interface AccountForm {
  displayName: string;
  level: string;
  gymName: string;
  postalCode: string;
  city: string;
  weightClass: string;
  beltRank: string;
}

const emptyForm: AccountForm = {
  displayName: "",
  level: "beginner",
  gymName: "",
  postalCode: "",
  city: "",
  weightClass: "",
  beltRank: "",
};

export default function AccountPage() {
  const { user, refetch, logout } = useAuth();
  const { locale } = useLanguage();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const isEs = locale === "es";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<AccountForm>(emptyForm);
  const [disciplines, setDisciplines] = useState<string[]>([]);
  const [selectedDisc, setSelectedDisc] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/user/profile", { cache: "no-store" });
        if (res.ok) {
          const data: ProfileResponse = await res.json();
          setForm({
            displayName: data.profile?.displayName ?? data.name ?? "",
            level: data.level ?? "beginner",
            gymName: data.gymName ?? "",
            postalCode: data.profile?.postalCode ?? "",
            city: data.profile?.city ?? "",
            weightClass: data.profile?.weightClass ?? "",
            beltRank: data.profile?.beltRank ?? "",
          });
          setDisciplines(Array.isArray(data.disciplines) ? data.disciplines : []);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const f = (field: keyof AccountForm) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [field]: e.target.value }));

  const save = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: form.displayName || undefined,
          level: form.level,
          gymName: form.gymName || null,
          postalCode: form.postalCode || null,
          city: form.city || null,
          weightClass: form.weightClass || null,
          beltRank: form.beltRank || null,
        }),
      });
      if (!res.ok) {
        setError(isEs ? "No se pudo guardar. Intenta de nuevo." : "Could not save. Please try again.");
        return;
      }
      await refetch();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const addDisc = async () => {
    if (!selectedDisc || disciplines.includes(selectedDisc)) return;
    const next = Array.from(new Set([...disciplines, selectedDisc]));
    setDisciplines(next);
    setSelectedDisc("");
    await fetch("/api/user/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ disciplines: next }),
    }).catch(() => null);
  };

  const removeDisc = async (name: string) => {
    const next = disciplines.filter((d) => d !== name);
    setDisciplines(next);
    await fetch("/api/user/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ disciplines: next }),
    }).catch(() => null);
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  if (loading) {
    return <div className="text-sm text-stone-text">{isEs ? "Cargando cuenta..." : "Loading account..."}</div>;
  }

  return (
    <div className="space-y-5 pb-6">
      <div>
        <h1 className="font-condensed font-black text-3xl uppercase tracking-widest text-beige-surface">{isEs ? "Mi Cuenta" : "My Account"}</h1>
        <p className="text-sm text-stone-text mt-1">{isEs ? "Preferencias, perfil y tus datos" : "Preferences, profile and your data"}</p>
      </div>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <h2 className="text-xs font-bold uppercase tracking-widest text-stone-text">{isEs ? "Apariencia" : "Appearance"}</h2>
        </CardHeader>
        <CardBody className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-sm font-semibold text-beige-warm">{isEs ? "Modo de color" : "Color mode"}</div>
            <div className="text-xs text-stone-text mt-0.5">
              {theme === "light" ? (isEs ? "Modo claro activado" : "Light mode on") : (isEs ? "Modo oscuro activado" : "Dark mode on")}
            </div>
          </div>
          <div className="flex rounded-full border border-stone-border overflow-hidden">
            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={cn("px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors", theme === "dark" ? "bg-burgundy text-white" : "text-stone-text hover:text-beige-warm")}
            >
              {isEs ? "Oscuro" : "Dark"}
            </button>
            <button
              type="button"
              onClick={() => setTheme("light")}
              className={cn("px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors", theme === "light" ? "bg-burgundy text-white" : "text-stone-text hover:text-beige-warm")}
            >
              {isEs ? "Claro" : "Light"}
            </button>
          </div>
        </CardBody>
      </Card>

      {/* Profile */}
      <Card>
        <CardHeader>
          <h2 className="text-xs font-bold uppercase tracking-widest text-stone-text">{isEs ? "Perfil" : "Profile"}</h2>
        </CardHeader>
        <CardBody className="grid gap-3 sm:grid-cols-2">
          <Input label={isEs ? "Nombre" : "Name"} value={form.displayName} onChange={f("displayName")} maxLength={80} />
          <Input label={isEs ? "Correo" : "Email"} value={user?.email ?? ""} disabled className="opacity-60 cursor-not-allowed" />
          <Select label={isEs ? "Nivel" : "Level"} value={form.level} onChange={f("level")}>
            {LEVELS.map((l) => (
              <option key={l.value} value={l.value} disabled={l.disabled}>{l.label}</option>
            ))}
          </Select>
          <Input label={isEs ? "Gimnasio (opcional)" : "Gym (optional)"} value={form.gymName} onChange={f("gymName")} placeholder={isEs ? "Nombre de tu gimnasio" : "Your gym's name"} maxLength={80} />
          <Input label={isEs ? "Código postal" : "Postal code"} value={form.postalCode} onChange={f("postalCode")} placeholder="28001" maxLength={20} />
          <Input label={isEs ? "Ciudad" : "City"} value={form.city} onChange={f("city")} maxLength={80} />
          <Input label={isEs ? "Categoría de peso" : "Weight class"} value={form.weightClass} onChange={f("weightClass")} maxLength={60} />
          <Input label={isEs ? "Cinturón / rango" : "Belt / rank"} value={form.beltRank} onChange={f("beltRank")} maxLength={60} />
        </CardBody>
      </Card>

      {/* Disciplines */}
      <Card>
        <CardHeader>
          <h2 className="text-xs font-bold uppercase tracking-widest text-stone-text">{isEs ? "Disciplinas" : "Disciplines"}</h2>
        </CardHeader>
        <CardBody>
          <div className="flex flex-wrap gap-2 mb-3">
            {disciplines.length === 0 && (
              <span className="text-xs text-stone-text/50 italic">{isEs ? "Sin disciplinas añadidas" : "No disciplines added"}</span>
            )}
            {disciplines.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => removeDisc(d)}
                title={isEs ? `Eliminar ${d}` : `Remove ${d}`}
                className="text-[11px] bg-bg-elevated border border-stone-border px-2.5 py-1 rounded-sm text-beige-warm flex items-center gap-1.5 hover:border-burgundy/60 hover:text-white transition-colors"
              >
                {d} <span className="text-stone-text/60 text-xs">×</span>
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Select value={selectedDisc} onChange={(e) => setSelectedDisc(e.target.value)} className="flex-1">
              <option value="">{isEs ? "Añadir disciplina..." : "Add discipline..."}</option>
              {DISCIPLINES.filter((d) => !disciplines.includes(d)).map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </Select>
            <Button type="button" onClick={addDisc} disabled={!selectedDisc}>{isEs ? "Añadir" : "Add"}</Button>
          </div>
        </CardBody>
      </Card>

      {/* Data export */}
      <Card>
        <CardHeader>
          <h2 className="text-xs font-bold uppercase tracking-widest text-stone-text">{isEs ? "Tus datos" : "Your data"}</h2>
        </CardHeader>
        <CardBody className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-sm font-semibold text-beige-warm">{isEs ? "Exportar a Excel" : "Export to Excel"}</div>
            <div className="text-xs text-stone-text mt-0.5 max-w-md">
              {isEs
                ? "Descarga todos tus entrenamientos, métricas, técnicas, gameplans y sparring en un archivo .xlsx que puedes guardar donde quieras (Drive, tu equipo, etc.)."
                : "Download all your training sessions, metrics, techniques, gameplans and sparring as a .xlsx file you can save anywhere (Drive, your device, etc.)."}
            </div>
          </div>
          <a
            href="/api/export"
            download
            className="inline-flex items-center gap-2 bg-burgundy text-white text-xs font-bold uppercase tracking-widest px-4 py-2.5 rounded-sm hover:bg-burgundy-light transition-colors whitespace-nowrap"
          >
            ⬇ {isEs ? "Descargar Excel" : "Download Excel"}
          </a>
        </CardBody>
      </Card>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Button onClick={save} disabled={saving}>
            {saving ? (isEs ? "Guardando..." : "Saving...") : (isEs ? "Guardar cambios" : "Save changes")}
          </Button>
          {saved && <span className="text-xs text-amber font-semibold uppercase tracking-wider">{isEs ? "Guardado ✓" : "Saved ✓"}</span>}
          {error && <span className="text-xs text-red-400">{error}</span>}
        </div>
        <button onClick={handleLogout} className="text-xs text-stone-text hover:text-beige-warm uppercase tracking-wider transition-colors">
          {isEs ? "Cerrar sesión" : "Log out"}
        </button>
      </div>
    </div>
  );
}
