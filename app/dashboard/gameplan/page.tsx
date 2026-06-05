"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Card, CardBody } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";

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
        <h1 className="font-condensed font-black text-3xl uppercase tracking-widest text-beige-surface mb-6">Gameplan Builder</h1>
        <div className="border border-navy/30 bg-navy/10 rounded-sm p-6 text-center max-w-lg mx-auto mt-10">
          <div className="text-4xl mb-3 opacity-30">◇</div>
          <div className="font-condensed text-xl font-bold uppercase tracking-widest text-navy-light mb-2">
            Intermediate Feature
          </div>
          <p className="text-sm text-stone-text mb-4">
            Gameplan Builder is available for Intermediate Amateur fighters. Upgrade your level to unlock tactical setup chains.
          </p>
          <div className="text-xs text-stone-text">Requires: Intermediate Amateur mode</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-condensed font-black text-3xl uppercase tracking-widest text-beige-surface">Gameplan Builder</h1>
          <p className="text-sm text-stone-text mt-1">Build and save tactical setups</p>
        </div>
        <Button onClick={openNew}>+ Add Setup</Button>
      </div>

      {gameplans.length === 0 && (
        <div className="mb-4 p-4 border border-stone-border/50 rounded-sm">
          <div className="text-xs text-stone-text uppercase tracking-wider mb-2">Example setups to get started:</div>
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
                  <Button variant="ghost" size="sm" onClick={() => openEdit(g)}>Edit</Button>
                  <Button variant="danger" size="sm" onClick={() => del(g.id)}>×</Button>
                </div>
              </div>
              <div className="space-y-2 text-xs">
                {g.startPosition && <Row label="Start" value={g.startPosition} />}
                {g.trigger && <Row label="Trigger" value={g.trigger} />}
                {g.action && <Row label="Action" value={g.action} color="text-amber" />}
                {g.followUpA && <Row label="Follow-up A" value={g.followUpA} />}
                {g.followUpB && <Row label="Follow-up B" value={g.followUpB} />}
                {g.counterRisk && <Row label="Counter Risk" value={g.counterRisk} color="text-red-400" />}
                {g.bestAgainst && <Row label="Best Against" value={g.bestAgainst} />}
                {g.notes && <div className="mt-2 text-stone-text italic border-t border-stone-border/50 pt-2">{g.notes}</div>}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit Setup" : "New Setup"} className="max-w-xl">
        <div className="flex flex-col gap-4">
          <Input label="Setup Name" value={form.name} onChange={f("name")} placeholder="e.g. Jab to low kick" />
          <Input label="Starting Position" value={form.startPosition ?? ""} onChange={f("startPosition")} placeholder="e.g. Orthodox, at range" />
          <Input label="Trigger" value={form.trigger ?? ""} onChange={f("trigger")} placeholder="e.g. Opponent drops guard" />
          <Input label="Action" value={form.action ?? ""} onChange={f("action")} placeholder="e.g. Throw jab" />
          <Input label="Follow-up A" value={form.followUpA ?? ""} onChange={f("followUpA")} placeholder="e.g. Low kick if they shell" />
          <Input label="Follow-up B" value={form.followUpB ?? ""} onChange={f("followUpB")} placeholder="e.g. Level change if they counter" />
          <Input label="Counter Risk" value={form.counterRisk ?? ""} onChange={f("counterRisk")} placeholder="e.g. Right hand counter" />
          <Input label="Best Against" value={form.bestAgainst ?? ""} onChange={f("bestAgainst")} placeholder="e.g. Aggressive pressure fighters" />
          <Textarea label="Notes" value={form.notes ?? ""} onChange={f("notes")} rows={3} />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving || !form.name}>{saving ? "Saving…" : "Save"}</Button>
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
