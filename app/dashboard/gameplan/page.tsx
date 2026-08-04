"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Card, CardBody } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { tr } from "@/lib/i18n";

interface Gameplan {
  id: string;
  name: string;
  startPosition?: string | null;
  trigger?: string | null;
  action?: string | null;
  followUpA?: string | null;
  followUpB?: string | null;
  counterRisk?: string | null;
  bestAgainst?: string | null;
  notes?: string | null;
}

const emptyPlan: Omit<Gameplan, "id"> = {
  name: "",
  startPosition: "",
  trigger: "",
  action: "",
  followUpA: "",
  followUpB: "",
  counterRisk: "",
  bestAgainst: "",
  notes: "",
};

const EXAMPLES = [
  "Jab → Low Kick",
  "Level Change → Overhand",
  "Feint Cross → Double Leg",
  "Sprawl → Front Headlock",
  "Cage Pressure → Single Leg",
];

export default function GameplanPage() {
  const { user } = useAuth();
  const { locale } = useLanguage();
  const t = (en: string, es: string, pt: string, fr: string, it: string) => tr(locale, { en, es, pt, fr, it });
  const [gameplans, setGameplans] = useState<Gameplan[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Gameplan | null>(null);
  const [form, setForm] = useState<Omit<Gameplan, "id">>(emptyPlan);
  const [saving, setSaving] = useState(false);

  const isIntermediate = user?.level === "intermediate";

  const load = () =>
    fetch("/api/gameplan").then((r) => r.json()).then((d) => setGameplans(Array.isArray(d) ? d : []));

  useEffect(() => { if (isIntermediate) load(); }, [isIntermediate]);

  const openNew = () => { setEditing(null); setForm(emptyPlan); setOpen(true); };
  const openEdit = (g: Gameplan) => { setEditing(g); setForm({ ...g }); setOpen(true); };

  const save = async () => {
    setSaving(true);
    const url = editing ? `/api/gameplan/${editing.id}` : "/api/gameplan";
    const method = editing ? "PUT" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    await load();
    setOpen(false);
    setSaving(false);
  };

  const del = async (id: string) => {
    await fetch(`/api/gameplan/${id}`, { method: "DELETE" });
    await load();
  };

  const f = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [field]: e.target.value }));

  if (!isIntermediate) {
    return (
      <div>
        <h1 className="font-condensed font-black text-3xl uppercase tracking-widest text-beige-surface mb-6">{t("Gameplan Builder", "Constructor de gameplan", "Construtor de gameplan", "Créateur de gameplan", "Costruttore di gameplan")}</h1>
        <div className="border border-navy/30 bg-navy/10 rounded-sm p-6 text-center max-w-lg mx-auto mt-10">
          <div className="text-4xl mb-3 opacity-30">◇</div>
          <div className="font-condensed text-xl font-bold uppercase tracking-widest text-navy-light mb-2">
            {t("Intermediate Feature", "Función intermedia", "Recurso intermediário", "Fonctionnalité intermédiaire", "Funzione intermedia")}
          </div>
          <p className="text-sm text-stone-text mb-4">
            {t("Gameplan Builder is available for Intermediate Amateur fighters. Upgrade your level to unlock tactical setup chains.", "Gameplan Builder está disponible para nivel intermedio. Sube tu nivel para desbloquear secuencias tácticas.", "O Construtor de Gameplan está disponível para o nível intermediário. Suba de nível para desbloquear sequências táticas.", "Le Créateur de gameplan est disponible pour le niveau intermédiaire. Passez de niveau pour débloquer les chaînes tactiques.", "Il Costruttore di gameplan è disponibile per il livello intermedio. Sali di livello per sbloccare le sequenze tattiche.")}
          </p>
          <div className="text-xs text-stone-text">{t("Requires: Intermediate Amateur mode", "Requiere modo Intermedio Amateur", "Requer modo Amador Intermediário", "Nécessite le mode Amateur intermédiaire", "Richiede modalità Dilettante Intermedio")}</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-condensed font-black text-3xl uppercase tracking-widest text-beige-surface">{t("Gameplan Builder", "Constructor de gameplan", "Construtor de gameplan", "Créateur de gameplan", "Costruttore di gameplan")}</h1>
          <p className="text-sm text-stone-text mt-1">{t("Build and save tactical setups", "Construye y guarda setups tácticos", "Construa e salve setups táticos", "Créez et enregistrez des setups tactiques", "Crea e salva setup tattici")}</p>
        </div>
        <Button onClick={openNew}>+ {t("Add Setup", "Añadir setup", "Adicionar setup", "Ajouter un setup", "Aggiungi setup")}</Button>
      </div>

      {gameplans.length === 0 && (
        <div className="mb-4 p-4 border border-stone-border/50 rounded-sm">
          <div className="text-xs text-stone-text uppercase tracking-wider mb-2">{t("Example setups to get started:", "Ejemplos para empezar:", "Exemplos para começar:", "Exemples de setups pour commencer :", "Esempi per iniziare:")}</div>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((e) => (
              <button key={e} onClick={() => { setForm({ ...emptyPlan, name: e }); setOpen(true); }} className="text-xs bg-bg-elevated border border-stone-border/50 px-2 py-1 rounded-sm text-beige-warm hover:border-amber/50 transition-colors">
                {e}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {gameplans.map((g) => (
          <Card key={g.id}>
            <CardBody>
              <div className="flex items-start justify-between mb-3">
                <div className="font-condensed font-bold text-lg text-beige-surface uppercase tracking-wide">{g.name}</div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(g)}>{t("Edit", "Editar", "Editar", "Modifier", "Modifica")}</Button>
                  <Button variant="danger" size="sm" onClick={() => del(g.id)}>×</Button>
                </div>
              </div>
              <div className="space-y-2 text-xs">
                {g.startPosition && <Row label={t("Start", "Inicio", "Início", "Début", "Inizio")} value={g.startPosition} />}
                {g.trigger && <Row label={t("Trigger", "Disparador", "Gatilho", "Déclencheur", "Trigger")} value={g.trigger} />}
                {g.action && <Row label={t("Action", "Acción", "Ação", "Action", "Azione")} value={g.action} color="text-amber" />}
                {g.followUpA && <Row label="Follow-up A" value={g.followUpA} />}
                {g.followUpB && <Row label="Follow-up B" value={g.followUpB} />}
                {g.counterRisk && <Row label={t("Counter Risk", "Riesgo de contra", "Risco de contra-ataque", "Risque de contre", "Rischio di contrattacco")} value={g.counterRisk} color="text-red-400" />}
                {g.bestAgainst && <Row label={t("Best Against", "Mejor contra", "Melhor contra", "Meilleur contre", "Migliore contro")} value={g.bestAgainst} />}
                {g.notes && <div className="mt-2 text-stone-text italic border-t border-stone-border/50 pt-2">{g.notes}</div>}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? t("Edit Setup", "Editar setup", "Editar setup", "Modifier le setup", "Modifica setup") : t("New Setup", "Nuevo setup", "Novo setup", "Nouveau setup", "Nuovo setup")} className="max-w-xl">
        <div className="flex flex-col gap-4">
          <Input label={t("Setup Name", "Nombre del setup", "Nome do setup", "Nom du setup", "Nome del setup")} value={form.name} onChange={f("name")} placeholder={t("e.g. Jab to low kick", "ej: Jab a low kick", "ex: Jab para low kick", "ex : Jab vers low kick", "es: Jab verso low kick")} />
          <Input label={t("Starting Position", "Posición inicial", "Posição inicial", "Position de départ", "Posizione iniziale")} value={form.startPosition ?? ""} onChange={f("startPosition")} placeholder={t("e.g. Orthodox, at range", "ej: Ortodoxo, a distancia", "ex: Ortodoxo, à distância", "ex : Orthodoxe, à distance", "es: Ortodosso, a distanza")} />
          <Input label={t("Trigger", "Disparador", "Gatilho", "Déclencheur", "Trigger")} value={form.trigger ?? ""} onChange={f("trigger")} placeholder={t("e.g. Opponent drops guard", "ej: rival baja la guardia", "ex: adversário baixa a guarda", "ex : l'adversaire baisse sa garde", "es: l'avversario abbassa la guardia")} />
          <Input label={t("Action", "Acción", "Ação", "Action", "Azione")} value={form.action ?? ""} onChange={f("action")} placeholder={t("e.g. Throw jab", "ej: lanzar jab", "ex: aplicar jab", "ex : lancer un jab", "es: tirare un jab")} />
          <Input label="Follow-up A" value={form.followUpA ?? ""} onChange={f("followUpA")} placeholder={t("e.g. Low kick if they shell", "ej: low kick si cierra", "ex: low kick se fechar", "ex : low kick s'il se ferme", "es: low kick se si chiude")} />
          <Input label="Follow-up B" value={form.followUpB ?? ""} onChange={f("followUpB")} placeholder={t("e.g. Level change if they counter", "ej: cambio de nivel si contragolpea", "ex: mudança de nível se contra-atacar", "ex : changement de niveau s'il contre", "es: cambio di livello se contrattacca")} />
          <Input label={t("Counter Risk", "Riesgo de contra", "Risco de contra-ataque", "Risque de contre", "Rischio di contrattacco")} value={form.counterRisk ?? ""} onChange={f("counterRisk")} placeholder={t("e.g. Right hand counter", "ej: contra de derecha", "ex: contra-ataque de direita", "ex : contre de la main droite", "es: contrattacco di destro")} />
          <Input label={t("Best Against", "Mejor contra", "Melhor contra", "Meilleur contre", "Migliore contro")} value={form.bestAgainst ?? ""} onChange={f("bestAgainst")} placeholder={t("e.g. Aggressive pressure fighters", "ej: rivales presionantes", "ex: lutadores agressivos de pressão", "ex : combattants agressifs qui pressent", "es: combattenti aggressivi che pressano")} />
          <Textarea label={t("Notes", "Notas", "Notas", "Notes", "Note")} value={form.notes ?? ""} onChange={f("notes")} rows={3} />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={() => setOpen(false)}>{t("Cancel", "Cancelar", "Cancelar", "Annuler", "Annulla")}</Button>
          <Button onClick={save} disabled={saving || !form.name}>{saving ? t("Saving…", "Guardando…", "Salvando…", "Enregistrement…", "Salvataggio…") : t("Save", "Guardar", "Salvar", "Enregistrer", "Salva")}</Button>
        </div>
      </Modal>
    </div>
  );
}

function Row({ label, value, color = "text-beige-warm" }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-stone-text/60 w-24 shrink-0">{label}:</span>
      <span className={color}>{value}</span>
    </div>
  );
}
