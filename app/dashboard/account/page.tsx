"use client";
import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { useTheme } from "@/contexts/theme-context";
import { LOCALES, type Locale, tr } from "@/lib/i18n";
import { PushNotificationToggle } from "@/components/notifications/push-manager";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { LEVELS, DISCIPLINES, cn } from "@/lib/utils";

interface ProfileResponse {
  name: string;
  email: string;
  level: string;
  discipline?: string;
  gymName?: string | null;
  disciplines?: string[];
  reminderEnabled?: boolean;
  reminderDays?: string;
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
  discipline: string;
  gymName: string;
  postalCode: string;
  city: string;
  weightClass: string;
  beltRank: string;
}

const emptyForm: AccountForm = {
  displayName: "",
  level: "beginner",
  discipline: "MMA",
  gymName: "",
  postalCode: "",
  city: "",
  weightClass: "",
  beltRank: "",
};

export default function AccountPage() {
  const { user, refetch, logout } = useAuth();
  const { locale, setLocale } = useLanguage();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const t = (en: string, es: string, pt: string, fr: string, it: string) => tr(locale, { en, es, pt, fr, it });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<AccountForm>(emptyForm);
  const [disciplines, setDisciplines] = useState<string[]>([]);
  const [selectedDisc, setSelectedDisc] = useState("");
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderDays, setReminderDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 0]);
  const [savingReminder, setSavingReminder] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/user/profile", { cache: "no-store" });
        if (res.ok) {
          const data: ProfileResponse = await res.json();
          setForm({
            displayName: data.profile?.displayName ?? data.name ?? "",
            level: data.level ?? "beginner",
            discipline: data.discipline ?? "MMA",
            gymName: data.gymName ?? "",
            postalCode: data.profile?.postalCode ?? "",
            city: data.profile?.city ?? "",
            weightClass: data.profile?.weightClass ?? "",
            beltRank: data.profile?.beltRank ?? "",
          });
          setDisciplines(Array.isArray(data.disciplines) ? data.disciplines : []);
          setReminderEnabled(Boolean(data.reminderEnabled));
          setReminderDays(
            (data.reminderDays || "1,2,3,4,5,6,0")
              .split(",")
              .map((d) => Number(d.trim()))
              .filter((d) => !Number.isNaN(d))
          );
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
          discipline: form.discipline || undefined,
          gymName: form.gymName || null,
          postalCode: form.postalCode || null,
          city: form.city || null,
          weightClass: form.weightClass || null,
          beltRank: form.beltRank || null,
        }),
      });
      if (!res.ok) {
        setError(t("Could not save. Please try again.", "No se pudo guardar. Intenta de nuevo.", "Não foi possível salvar. Tente novamente.", "Impossible d'enregistrer. Réessayez.", "Impossibile salvare. Riprova."));
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

  const dayLabels = locale === "es"
    ? ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
    : locale === "pt"
    ? ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
    : locale === "fr"
    ? ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]
    : locale === "it"
    ? ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const toggleReminderDay = async (day: number) => {
    const next = reminderDays.includes(day) ? reminderDays.filter((d) => d !== day) : [...reminderDays, day].sort();
    setReminderDays(next);
    setSavingReminder(true);
    await fetch("/api/user/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reminderDays: next.join(",") }),
    }).catch(() => null);
    setSavingReminder(false);
  };

  const toggleReminderEnabled = async () => {
    const next = !reminderEnabled;
    setReminderEnabled(next);
    setSavingReminder(true);
    await fetch("/api/user/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reminderEnabled: next }),
    }).catch(() => null);
    setSavingReminder(false);
  };

  if (loading) {
    return <div className="text-sm text-stone-text">{t("Loading account...", "Cargando cuenta...", "Carregando conta...", "Chargement du compte...", "Caricamento account...")}</div>;
  }

  return (
    <div className="space-y-5 pb-6">
      <div>
        <h1 className="font-condensed font-black text-3xl uppercase tracking-widest text-beige-surface">{t("My Account", "Mi Cuenta", "Minha Conta", "Mon Compte", "Il Mio Account")}</h1>
        <p className="text-sm text-stone-text mt-1">{t("Preferences, profile and your data", "Preferencias, perfil y tus datos", "Preferências, perfil e seus dados", "Préférences, profil et vos données", "Preferenze, profilo e i tuoi dati")}</p>
      </div>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <h2 className="text-xs font-bold uppercase tracking-widest text-stone-text">{t("Appearance", "Apariencia", "Aparência", "Apparence", "Aspetto")}</h2>
        </CardHeader>
        <CardBody className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-sm font-semibold text-beige-warm">{t("Color mode", "Modo de color", "Modo de cor", "Mode couleur", "Modalità colore")}</div>
            <div className="text-xs text-stone-text mt-0.5">
              {theme === "light" ? t("Light mode on", "Modo claro activado", "Modo claro ativado", "Mode clair activé", "Modalità chiara attiva") : t("Dark mode on", "Modo oscuro activado", "Modo escuro ativado", "Mode sombre activé", "Modalità scura attiva")}
            </div>
          </div>
          <div className="flex rounded-full border border-stone-border overflow-hidden">
            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={cn("px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors", theme === "dark" ? "bg-burgundy text-white" : "text-stone-text hover:text-beige-warm")}
            >
              {t("Dark", "Oscuro", "Escuro", "Sombre", "Scuro")}
            </button>
            <button
              type="button"
              onClick={() => setTheme("light")}
              className={cn("px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors", theme === "light" ? "bg-burgundy text-white" : "text-stone-text hover:text-beige-warm")}
            >
              {t("Light", "Claro", "Claro", "Clair", "Chiaro")}
            </button>
          </div>
        </CardBody>
      </Card>

      {/* Language */}
      <Card>
        <CardHeader>
          <h2 className="text-xs font-bold uppercase tracking-widest text-stone-text">{t("Language", "Idioma", "Idioma", "Langue", "Lingua")}</h2>
        </CardHeader>
        <CardBody>
          <div className="flex flex-wrap gap-2">
            {LOCALES.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => setLocale(l.code as Locale)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors",
                  locale === l.code
                    ? "border-burgundy bg-burgundy text-white"
                    : "border-stone-border text-stone-text hover:text-beige-warm"
                )}
              >
                <span>{l.flag}</span>
                <span>{l.label}</span>
              </button>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <h2 className="text-xs font-bold uppercase tracking-widest text-stone-text">{t("Notifications", "Notificaciones", "Notificações", "Notifications", "Notifiche")}</h2>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="text-sm font-semibold text-beige-warm">{t("Push alerts", "Alertas push", "Alertas push", "Alertes push", "Avvisi push")}</div>
              <div className="text-xs text-stone-text mt-0.5">
                {t("Receive notifications on this device", "Recibe notificaciones en este dispositivo", "Receba notificações neste dispositivo", "Recevez des notifications sur cet appareil", "Ricevi notifiche su questo dispositivo")}
              </div>
            </div>
            <PushNotificationToggle />
          </div>

          <div className="border-t border-stone-border/50 pt-4">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
              <div>
                <div className="text-sm font-semibold text-beige-warm">{t("Daily reminder", "Recordatorio diario", "Lembrete diário", "Rappel quotidien", "Promemoria giornaliero")}</div>
                <div className="text-xs text-stone-text mt-0.5 max-w-sm">
                  {t("We'll nudge you to log today's training session or fight.", "Te avisamos para que registres tu sesión de entreno o pelea del día.", "Vamos te lembrar de registrar seu treino ou luta do dia.", "Nous vous rappellerons d'enregistrer votre séance ou combat du jour.", "Ti ricorderemo di registrare l'allenamento o l'incontro di oggi.")}
                </div>
              </div>
              <button
                type="button"
                onClick={toggleReminderEnabled}
                disabled={savingReminder}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors",
                  reminderEnabled ? "bg-burgundy text-white" : "border border-stone-border text-stone-text hover:text-beige-warm"
                )}
              >
                {reminderEnabled ? t("On", "Activado", "Ativado", "Activé", "Attivo") : t("Off", "Desactivado", "Desativado", "Désactivé", "Disattivo")}
              </button>
            </div>
            {reminderEnabled && (
              <div>
                <div className="text-[10px] uppercase tracking-widest text-stone-text mb-2">
                  {t("Days of the week", "Días de la semana", "Dias da semana", "Jours de la semaine", "Giorni della settimana")}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {dayLabels.map((label, day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleReminderDay(day)}
                      disabled={savingReminder}
                      className={cn(
                        "w-11 h-9 rounded-sm text-[11px] font-bold uppercase tracking-wider transition-colors",
                        reminderDays.includes(day)
                          ? "bg-burgundy/20 border border-burgundy/60 text-burgundy-light"
                          : "border border-stone-border text-stone-text hover:text-beige-warm"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Profile */}
      <Card>
        <CardHeader>
          <h2 className="text-xs font-bold uppercase tracking-widest text-stone-text">{t("Profile", "Perfil", "Perfil", "Profil", "Profilo")}</h2>
        </CardHeader>
        <CardBody className="grid gap-3 sm:grid-cols-2">
          <Input label={t("Name", "Nombre", "Nome", "Nom", "Nome")} value={form.displayName} onChange={f("displayName")} maxLength={80} />
          <Input label={t("Email", "Correo", "E-mail", "E-mail", "Email")} value={user?.email ?? ""} disabled className="opacity-60 cursor-not-allowed" />
          <Select label={t("Level", "Nivel", "Nível", "Niveau", "Livello")} value={form.level} onChange={f("level")}>
            {LEVELS.map((l) => (
              <option key={l.value} value={l.value} disabled={l.disabled}>{l.label}</option>
            ))}
          </Select>
          <Select label={t("Primary discipline", "Disciplina principal", "Disciplina principal", "Discipline principale", "Disciplina principale")} value={form.discipline} onChange={f("discipline")}>
            {DISCIPLINES.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </Select>
          <Input label={t("Gym (optional)", "Gimnasio (opcional)", "Academia (opcional)", "Salle (facultatif)", "Palestra (opzionale)")} value={form.gymName} onChange={f("gymName")} placeholder={t("Your gym's name", "Nombre de tu gimnasio", "Nome da sua academia", "Nom de votre salle", "Nome della tua palestra")} maxLength={80} />
          <Input label={t("Postal code", "Código postal", "CEP", "Code postal", "CAP")} value={form.postalCode} onChange={f("postalCode")} placeholder="28001" maxLength={20} />
          <Input label={t("City", "Ciudad", "Cidade", "Ville", "Città")} value={form.city} onChange={f("city")} maxLength={80} />
          <Input label={t("Weight class", "Categoría de peso", "Categoria de peso", "Catégorie de poids", "Categoria di peso")} value={form.weightClass} onChange={f("weightClass")} maxLength={60} />
          <Input label={t("Belt / rank", "Cinturón / rango", "Faixa / grau", "Ceinture / grade", "Cintura / grado")} value={form.beltRank} onChange={f("beltRank")} maxLength={60} />
        </CardBody>
      </Card>

      {/* Disciplines */}
      <Card>
        <CardHeader>
          <h2 className="text-xs font-bold uppercase tracking-widest text-stone-text">{t("Disciplines", "Disciplinas", "Disciplinas", "Disciplines", "Discipline")}</h2>
        </CardHeader>
        <CardBody>
          <div className="flex flex-wrap gap-2 mb-3">
            {disciplines.length === 0 && (
              <span className="text-xs text-stone-text/50 italic">{t("No disciplines added", "Sin disciplinas añadidas", "Nenhuma disciplina adicionada", "Aucune discipline ajoutée", "Nessuna disciplina aggiunta")}</span>
            )}
            {disciplines.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => removeDisc(d)}
                title={t(`Remove ${d}`, `Eliminar ${d}`, `Remover ${d}`, `Supprimer ${d}`, `Rimuovi ${d}`)}
                className="text-[11px] bg-bg-elevated border border-stone-border px-2.5 py-1 rounded-sm text-beige-warm flex items-center gap-1.5 hover:border-burgundy/60 hover:text-white transition-colors"
              >
                {d} <span className="text-stone-text/60 text-xs">×</span>
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Select value={selectedDisc} onChange={(e) => setSelectedDisc(e.target.value)} className="flex-1">
              <option value="">{t("Add discipline...", "Añadir disciplina...", "Adicionar disciplina...", "Ajouter une discipline...", "Aggiungi disciplina...")}</option>
              {DISCIPLINES.filter((d) => !disciplines.includes(d)).map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </Select>
            <Button type="button" onClick={addDisc} disabled={!selectedDisc}>{t("Add", "Añadir", "Adicionar", "Ajouter", "Aggiungi")}</Button>
          </div>
        </CardBody>
      </Card>

      {/* Data export */}
      <Card>
        <CardHeader>
          <h2 className="text-xs font-bold uppercase tracking-widest text-stone-text">{t("Your data", "Tus datos", "Seus dados", "Vos données", "I tuoi dati")}</h2>
        </CardHeader>
        <CardBody className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-sm font-semibold text-beige-warm">{t("Export to Excel", "Exportar a Excel", "Exportar para Excel", "Exporter vers Excel", "Esporta in Excel")}</div>
            <div className="text-xs text-stone-text mt-0.5 max-w-md">
              {t("Download all your training sessions, metrics, techniques, gameplans and sparring as a .xlsx file you can save anywhere (Drive, your device, etc.).", "Descarga todos tus entrenamientos, métricas, técnicas, gameplans y sparring en un archivo .xlsx que puedes guardar donde quieras (Drive, tu equipo, etc.).", "Baixe todos os seus treinos, métricas, técnicas, gameplans e sparring em um arquivo .xlsx que você pode salvar onde quiser (Drive, seu dispositivo, etc.).", "Téléchargez toutes vos séances, métriques, techniques, gameplans et sparring dans un fichier .xlsx à enregistrer où vous voulez (Drive, votre appareil, etc.).", "Scarica tutti i tuoi allenamenti, metriche, tecniche, gameplan e sparring in un file .xlsx da salvare ovunque (Drive, il tuo dispositivo, ecc.).")}
            </div>
          </div>
          <a
            href="/api/export"
            download
            className="inline-flex items-center gap-2 bg-burgundy text-white text-xs font-bold uppercase tracking-widest px-4 py-2.5 rounded-sm hover:bg-burgundy-light transition-colors whitespace-nowrap"
          >
            ⬇ {t("Download Excel", "Descargar Excel", "Baixar Excel", "Télécharger Excel", "Scarica Excel")}
          </a>
        </CardBody>
      </Card>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Button onClick={save} disabled={saving}>
            {saving ? t("Saving...", "Guardando...", "Salvando...", "Enregistrement...", "Salvataggio...") : t("Save changes", "Guardar cambios", "Salvar alterações", "Enregistrer les modifications", "Salva modifiche")}
          </Button>
          {saved && <span className="text-xs text-amber font-semibold uppercase tracking-wider">{t("Saved ✓", "Guardado ✓", "Salvo ✓", "Enregistré ✓", "Salvato ✓")}</span>}
          {error && <span className="text-xs text-red-400">{error}</span>}
        </div>
        <button onClick={handleLogout} className="text-xs text-stone-text hover:text-beige-warm uppercase tracking-wider transition-colors">
          {t("Log out", "Cerrar sesión", "Sair", "Déconnexion", "Disconnetti")}
        </button>
      </div>
    </div>
  );
}
