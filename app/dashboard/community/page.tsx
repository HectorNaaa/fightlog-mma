"use client";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";

interface Tip {
  sessionId: string;
  authorName: string;
  gymName?: string | null;
  date: string;
  type: string;
  tacticNote: string | null;
  respetos: number;
  hasRespeto: boolean;
}

interface Friend {
  id: string;
  friendshipId: string;
  name: string;
  gymName?: string | null;
  level: string;
  weeklySessionCount: number;
}

type Tab = "tips" | "aliados";

export default function CommunityPage() {
  const { locale } = useLanguage();
  const isEs = locale === "es";
  const [tab, setTab] = useState<Tab>("tips");
  const [tips, setTips] = useState<Tip[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [addEmail, setAddEmail] = useState("");
  const [addStatus, setAddStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [t, f] = await Promise.all([
      fetch("/api/community/tips").then((r) => r.json()).catch(() => []),
      fetch("/api/friends").then((r) => r.json()).catch(() => []),
    ]);
    setTips(Array.isArray(t) ? t : []);
    setFriends(Array.isArray(f) ? f : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleRespeto = async (sessionId: string) => {
    await fetch(`/api/tips/${sessionId}/respeto`, { method: "POST" });
    setTips((prev) =>
      prev.map((t) =>
        t.sessionId === sessionId
          ? { ...t, respetos: t.hasRespeto ? t.respetos - 1 : t.respetos + 1, hasRespeto: !t.hasRespeto }
          : t
      )
    );
  };

  const addFriend = async () => {
    if (!addEmail.trim()) return;
    setAddStatus(null);
    const res = await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: addEmail.trim() }),
    });
    const data = await res.json();
    if (res.ok) {
      setAddStatus(isEs ? `✓ ${data.name} añadido como aliado` : `✓ ${data.name} added as teammate`);
      setAddEmail("");
      load();
    } else {
      setAddStatus(`✗ ${data.error ?? (isEs ? "Error al añadir" : "Error adding teammate")}`);
    }
  };

  const removeFriend = async (friendshipId: string) => {
    await fetch(`/api/friends/${friendshipId}`, { method: "DELETE" });
    setFriends((prev) => prev.filter((f) => f.friendshipId !== friendshipId));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="font-condensed font-black text-2xl uppercase tracking-widest text-beige-surface">
          {isEs ? "Comunidad" : "Community"}
        </h1>
        <p className="text-xs text-stone-text mt-0.5">{isEs ? "Tus aliados de entrenamiento" : "Your training teammates"}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-bg-card border border-stone-border rounded-sm p-1">
        {(["tips", "aliados"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-sm transition-colors",
              tab === t
                ? "bg-burgundy text-beige-surface"
                : "text-stone-text hover:text-beige-warm"
            )}
          >
            {t === "tips" ? (isEs ? "Muro de Tips" : "Tips Wall") : (isEs ? "Consistencia" : "Consistency")}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-10 text-center text-stone-text text-sm">{isEs ? "Cargando…" : "Loading…"}</div>
      ) : tab === "tips" ? (
        <TipsFeed tips={tips} onRespeto={toggleRespeto} isEs={isEs} />
      ) : (
        <ConsistencyBoard
          isEs={isEs}
          friends={friends}
          addEmail={addEmail}
          setAddEmail={setAddEmail}
          onAdd={addFriend}
          onRemove={removeFriend}
          addStatus={addStatus}
        />
      )}
    </div>
  );
}

/* ── Tips feed ─────────────────────────────────────────────── */
function TipsFeed({
  tips,
  onRespeto,
  isEs,
}: {
  tips: Tip[];
  onRespeto: (id: string) => void;
  isEs: boolean;
}) {
  if (tips.length === 0) {
    return (
      <EmptyState
        icon="◎"
          title={isEs ? "Sin tips aún" : "No tips yet"}
          body={isEs ? "Cuando tus aliados compartan notas tácticas al entrenar, aparecerán aquí." : "When your teammates share tactical notes after training, they will show up here."}
      />
    );
  }

  return (
    <div className="space-y-3">
      {tips.map((tip) => (
        <div
          key={tip.sessionId}
          className="bg-bg-card border border-stone-border rounded-sm p-4"
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <span className="text-sm font-bold text-beige-warm">{tip.authorName}</span>
              {tip.gymName && (
                <span className="ml-2 text-[10px] bg-stone-border/50 text-stone-text px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                  {tip.gymName}
                </span>
              )}
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] text-stone-text">{formatDate(tip.date)}</span>
              <div className="mt-0.5">
                <span className="text-[10px] bg-burgundy/20 text-burgundy-light border border-burgundy/30 px-1.5 py-0.5 rounded-sm uppercase font-bold">
                  {tip.type}
                </span>
              </div>
            </div>
          </div>

          <p className="text-sm text-stone-text/90 leading-relaxed border-l-2 border-burgundy/30 pl-3 italic">
            &ldquo;{tip.tacticNote}&rdquo;
          </p>

          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={() => onRespeto(tip.sessionId)}
              className={cn(
                "flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition-colors px-2.5 py-1 rounded-sm",
                tip.hasRespeto
                  ? "bg-burgundy/20 text-burgundy-light border border-burgundy/30"
                  : "bg-stone-border/30 text-stone-text hover:text-beige-warm border border-transparent"
              )}
            >
              <span className="text-sm">{tip.hasRespeto ? "♥" : "♡"}</span>
              <span>{isEs ? "Respeto" : "Respect"} · {tip.respetos}</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Consistency board ─────────────────────────────────────── */
function ConsistencyBoard({
  isEs,
  friends,
  addEmail,
  setAddEmail,
  onAdd,
  onRemove,
  addStatus,
}: {
  isEs: boolean;
  friends: Friend[];
  addEmail: string;
  setAddEmail: (v: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  addStatus: string | null;
}) {
  return (
    <div className="space-y-4">
      {/* Add friend */}
      <div className="bg-bg-card border border-stone-border rounded-sm p-4">
        <div className="text-[10px] uppercase tracking-widest text-stone-text mb-3">
          {isEs ? "Añadir aliado por email" : "Add teammate by email"}
        </div>
        <div className="flex gap-2">
          <input
            type="email"
            value={addEmail}
            onChange={(e) => setAddEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onAdd()}
            placeholder={isEs ? "email@ejemplo.com" : "email@example.com"}
            className="flex-1 bg-bg-elevated border border-stone-border rounded-sm px-3 py-2 text-sm text-beige-warm placeholder:text-stone-text/50 focus:outline-none focus:border-amber transition-colors"
          />
          <button
            onClick={onAdd}
            className="bg-burgundy text-beige-surface text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-sm hover:bg-burgundy-light transition-colors"
          >
            {isEs ? "Añadir" : "Add"}
          </button>
        </div>
        {addStatus && (
          <p
            className={cn(
              "text-xs mt-2",
              addStatus.startsWith("✓") ? "text-green-400" : "text-red-400"
            )}
          >
            {addStatus}
          </p>
        )}
      </div>

      {/* Consistency board */}
      {friends.length === 0 ? (
        <EmptyState
          icon="◈"
          title={isEs ? "Sin aliados todavía" : "No teammates yet"}
          body={isEs ? "Añade compañeros de entrenamiento para ver su consistencia semanal y motivaros mutuamente." : "Add training partners to see weekly consistency and motivate each other."}
        />
      ) : (
        <div className="bg-bg-card border border-stone-border rounded-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-stone-border/50">
            <div className="text-[10px] uppercase tracking-widest text-stone-text">
              {isEs ? "Consistencia esta semana" : "This week consistency"}
            </div>
          </div>
          {[...friends]
            .sort((a, b) => b.weeklySessionCount - a.weeklySessionCount)
            .map((friend, idx) => (
              <div
                key={friend.id}
                className="flex items-center gap-3 px-4 py-3 border-b border-stone-border/30 last:border-0"
              >
                {/* Rank */}
                <div
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0",
                    idx === 0
                      ? "bg-amber/20 text-amber"
                      : idx === 1
                      ? "bg-stone-muted/30 text-stone-light"
                      : "bg-stone-border/30 text-stone-text"
                  )}
                >
                  {idx + 1}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-beige-warm truncate">
                      {friend.name}
                    </span>
                    {friend.gymName && (
                      <span className="text-[9px] bg-stone-border/50 text-stone-text px-1 py-0.5 rounded-sm uppercase shrink-0">
                        {friend.gymName}
                      </span>
                    )}
                  </div>
                  {/* Mini bar */}
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1 bg-stone-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-burgundy/60 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (friend.weeklySessionCount / 7) * 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-stone-text shrink-0">
                      {friend.weeklySessionCount}/7
                    </span>
                  </div>
                </div>

                {/* Sessions badge */}
                <div className="text-right shrink-0">
                  <div
                    className={cn(
                      "font-condensed font-black text-xl",
                      friend.weeklySessionCount >= 5
                        ? "text-amber"
                        : friend.weeklySessionCount >= 3
                        ? "text-burgundy-light"
                        : "text-stone-text"
                    )}
                  >
                    {friend.weeklySessionCount}
                    <span className="text-[10px] font-normal text-stone-text ml-0.5">
                      {isEs ? "entrenos" : "sessions"}
                    </span>
                  </div>
                </div>

                {/* Remove */}
                <button
                  onClick={() => onRemove(friend.friendshipId)}
                  className="text-stone-text/30 hover:text-red-400/70 transition-colors text-sm shrink-0"
                  title={isEs ? "Eliminar aliado" : "Remove teammate"}
                >
                  ×
                </button>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  body,
}: {
  icon: string;
  title: string;
  body: string;
}) {
  return (
    <div className="py-12 text-center">
      <div className="text-4xl opacity-20 mb-3">{icon}</div>
      <div className="font-condensed font-bold text-lg uppercase tracking-widest text-beige-surface/60 mb-1">
        {title}
      </div>
      <p className="text-xs text-stone-text max-w-xs mx-auto leading-relaxed">{body}</p>
    </div>
  );
}
