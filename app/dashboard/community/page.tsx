"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import GymsDirectoryPage from "@/app/dashboard/gyms/page";
import { Modal } from "@/components/ui/modal";

const NearbyMap = dynamic(() => import("@/components/map/nearby-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[340px] items-center justify-center rounded-xl border border-stone-border bg-bg-elevated text-sm text-stone-text">
      Loading map...
    </div>
  ),
});

type TabKey = "feed" | "fighters" | "nearby" | "partners" | "nodes" | "gyms";

interface Friend {
  id: string;
  friendshipId: string;
  name: string;
  gymName?: string | null;
  primaryGymId?: string | null;
  level: string;
  primaryDiscipline: string;
  weeklySessionCount: number;
  mutualFriends: number;
  sharedDisciplines: string[];
  sharedGyms: string[];
  isTrainingPartner: boolean;
}

interface FighterCandidate {
  id: string;
  isFriend: boolean;
  name: string;
  level: string;
  gymName?: string | null;
  primaryGymId?: string | null;
  primaryDiscipline: string;
  profile?: {
    username?: string;
    displayName?: string;
    city?: string;
    beltRank?: string;
    weightClass?: string;
    bio?: string;
    isPublic?: boolean;
  } | null;
  disciplines: string[];
  mutualFriends: number;
  sharedDisciplines: string[];
  sharedGyms: string[];
}

interface FriendRequest {
  id: string;
  requesterId: string;
  receiverId: string;
  note?: string | null;
  createdAt: string;
  requester?: {
    name: string;
    discipline: string;
    gymName?: string | null;
    profile?: { username?: string; displayName?: string } | null;
  };
  receiver?: {
    name: string;
    discipline: string;
    gymName?: string | null;
    profile?: { username?: string; displayName?: string } | null;
  };
}

interface TechniqueNode {
  id: string;
  title: string;
  discipline: string | null;
  position: string | null;
  description: string | null;
  visibility: "private" | "friends" | "public";
  linkedNodeIds: string[];
  counts: { saves: number; likes: number; comments: number };
  hasSaved: boolean;
  hasLiked: boolean;
  createdBy: {
    id: string;
    name: string;
    profile?: { username?: string; displayName?: string } | null;
  };
}

interface FeedEvent {
  id: string;
  eventType: string;
  message: string;
  createdAt: string;
  user: {
    name: string;
    profile?: { displayName?: string; username?: string } | null;
  };
}

interface FeedResponse {
  events: FeedEvent[];
  recommendations: {
    fightersYouMayKnow: FighterCandidate[];
    popularTechniqueNodes: Array<{
      id: string;
      title: string;
      discipline: string | null;
      likes: number;
      saves: number;
      visibility: string;
    }>;
    gymNetworkCount: number;
  };
}

interface NearbyFighter {
  id: string;
  name: string;
  level: string;
  gymName?: string | null;
  primaryDiscipline: string;
  isFriend: boolean;
  distanceKm: number;
  latitude: number;
  longitude: number;
  profile?: { username?: string; displayName?: string; city?: string; beltRank?: string } | null;
}

interface NearbyGym {
  id: string;
  name: string;
  city?: string | null;
  latitude: number;
  longitude: number;
  distanceKm: number;
}

interface NearbyResponse {
  needsLocation: boolean;
  center?: { latitude: number; longitude: number; city?: string | null; postalCode?: string | null };
  radiusKm?: number;
  fighters: NearbyFighter[];
  gyms: NearbyGym[];
}

interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
}

interface Conversation {
  friend: { id: string; name: string; profile?: { username?: string; displayName?: string } | null } | null;
  lastMessage: ChatMessage | null;
  unreadCount: number;
}

export default function CommunityPage() {
  const { locale } = useLanguage();
  const isEs = locale === "es";
  const [tab, setTab] = useState<TabKey>("feed");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [friends, setFriends] = useState<Friend[]>([]);
  const [fighters, setFighters] = useState<FighterCandidate[]>([]);
  const [search, setSearch] = useState("");

  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);

  const [feed, setFeed] = useState<FeedResponse | null>(null);
  const [nodes, setNodes] = useState<TechniqueNode[]>([]);

  const [creatingNode, setCreatingNode] = useState(false);
  const [nodeForm, setNodeForm] = useState({
    title: "",
    discipline: "MMA",
    position: "",
    description: "",
    visibility: "private" as "private" | "friends" | "public",
  });

  const [nearby, setNearby] = useState<NearbyResponse | null>(null);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [postalCodeInput, setPostalCodeInput] = useState("");
  const [savingPostalCode, setSavingPostalCode] = useState(false);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChatFriendId, setActiveChatFriendId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [sendingChat, setSendingChat] = useState(false);

  const loadNearby = async () => {
    setNearbyLoading(true);
    try {
      const res = await fetch("/api/fighters/nearby", { cache: "no-store" });
      const data = await res.json().catch(() => null);
      setNearby(res.ok && data ? data : { needsLocation: true, fighters: [], gyms: [] });
    } catch {
      setNearby({ needsLocation: true, fighters: [], gyms: [] });
    } finally {
      setNearbyLoading(false);
    }
  };

  const savePostalCode = async () => {
    if (!postalCodeInput.trim() || savingPostalCode) return;
    setSavingPostalCode(true);
    setError(null);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postalCode: postalCodeInput.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Could not save postal code");
        return;
      }
      await loadNearby();
    } catch {
      setError("Network error saving postal code");
    } finally {
      setSavingPostalCode(false);
    }
  };

  useEffect(() => {
    if (tab === "nearby" && nearby === null) {
      loadNearby();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const loadAll = async (query = "") => {
    setLoading(true);
    setError(null);
    try {
      const [friendsRes, requestsRes, feedRes, nodesRes, fightersRes] = await Promise.all([
        fetch("/api/friends", { cache: "no-store" }),
        fetch("/api/friends/requests", { cache: "no-store" }),
        fetch("/api/community/feed", { cache: "no-store" }),
        fetch(`/api/technique-nodes?q=${encodeURIComponent(query)}`, { cache: "no-store" }),
        fetch(`/api/fighters?q=${encodeURIComponent(query)}`, { cache: "no-store" }),
      ]);

      const friendsData = await friendsRes.json().catch(() => []);
      const requestsData = await requestsRes.json().catch(() => ({ incoming: [], outgoing: [] }));
      const feedData = await feedRes.json().catch(() => null);
      const nodesData = await nodesRes.json().catch(() => []);
      const fightersData = await fightersRes.json().catch(() => []);

      if (!friendsRes.ok || !requestsRes.ok || !feedRes.ok || !nodesRes.ok || !fightersRes.ok) {
        setError("Some community data failed to load. Try refreshing.");
      }

      setFriends(Array.isArray(friendsData) ? friendsData : []);
      setIncomingRequests(Array.isArray(requestsData.incoming) ? requestsData.incoming : []);
      setOutgoingRequests(Array.isArray(requestsData.outgoing) ? requestsData.outgoing : []);
    // Normalize feedData: if the response was an error JSON (no .events), treat as null
    setFeed(feedRes.ok && feedData != null && Array.isArray(feedData.events) ? feedData : null);
      setNodes(Array.isArray(nodesData) ? nodesData : []);
      setFighters(Array.isArray(fightersData) ? fightersData : []);
    } catch {
      setError("Network error loading community data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const loadConversations = async () => {
    try {
      const res = await fetch("/api/messages", { cache: "no-store" });
      const data = await res.json().catch(() => []);
      setConversations(Array.isArray(data) ? data : []);
    } catch {
      // best-effort — chat badge just stays stale until next poll
    }
  };

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 20000);
    return () => clearInterval(interval);
  }, []);

  const openChat = async (friendId: string) => {
    setActiveChatFriendId(friendId);
    setChatLoading(true);
    try {
      const res = await fetch(`/api/messages/${friendId}`, { cache: "no-store" });
      const data = await res.json().catch(() => []);
      setChatMessages(Array.isArray(data) ? data : []);
      loadConversations();
    } finally {
      setChatLoading(false);
    }
  };

  const closeChat = () => {
    setActiveChatFriendId(null);
    setChatMessages([]);
    setChatInput("");
  };

  useEffect(() => {
    if (!activeChatFriendId) return;
    const interval = setInterval(async () => {
      const res = await fetch(`/api/messages/${activeChatFriendId}`, { cache: "no-store" });
      const data = await res.json().catch(() => null);
      if (Array.isArray(data)) setChatMessages(data);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeChatFriendId]);

  const sendChatMessage = async () => {
    const content = chatInput.trim();
    if (!content || !activeChatFriendId || sendingChat) return;
    setSendingChat(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: activeChatFriendId, content }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Could not send message");
        return;
      }
      const message = await res.json();
      setChatMessages((prev) => [...prev, message]);
      setChatInput("");
      loadConversations();
    } finally {
      setSendingChat(false);
    }
  };

  const totalUnreadMessages = useMemo(
    () => conversations.reduce((sum, c) => sum + c.unreadCount, 0),
    [conversations]
  );

  const filteredFighters = useMemo(() => {
    if (!search.trim()) return fighters;
    const q = search.toLowerCase();
    return fighters.filter((fighter) => {
      const name = fighter.name || "";
      const display = fighter.profile?.displayName || name;
      return (
        name.toLowerCase().includes(q) ||
        display.toLowerCase().includes(q) ||
        (fighter.profile?.username || "").toLowerCase().includes(q) ||
        (fighter.primaryDiscipline || "").toLowerCase().includes(q)
      );
    });
  }, [fighters, search]);

  const outgoingReceiverIds = useMemo(
    () => new Set(outgoingRequests.map((request) => request.receiverId)),
    [outgoingRequests]
  );

  const incomingRequesterIds = useMemo(
    () => new Set(incomingRequests.map((request) => request.requesterId)),
    [incomingRequests]
  );

  const sendRequest = async (receiverId: string) => {
    const res = await fetch("/api/friends/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not send request");
      return;
    }

    await loadAll(search);
  };

  const processRequest = async (requestId: string, action: "accept" | "reject" | "cancel") => {
    const res = await fetch(`/api/friends/requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not process request");
      return;
    }

    await loadAll(search);
  };

  const toggleTrainingPartner = async (friendshipId: string, isTrainingPartner: boolean) => {
    const res = await fetch(`/api/friends/${friendshipId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isTrainingPartner: !isTrainingPartner }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not update training partner status");
      return;
    }

    setFriends((prev) =>
      prev.map((friend) =>
        friend.friendshipId === friendshipId
          ? { ...friend, isTrainingPartner: !isTrainingPartner }
          : friend
      )
    );
  };

  const createNode = async () => {
    if (creatingNode) return;
    if (!nodeForm.title.trim()) {
      setError("Technique title is required.");
      return;
    }

    setCreatingNode(true);
    setError(null);

    try {
      const res = await fetch("/api/technique-nodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: nodeForm.title.trim(),
          discipline: nodeForm.discipline,
          position: nodeForm.position || null,
          description: nodeForm.description || null,
          visibility: nodeForm.visibility,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Could not create technique node");
        return;
      }

      setNodeForm({
        title: "",
        discipline: "MMA",
        position: "",
        description: "",
        visibility: "private",
      });

      await loadAll(search);
    } finally {
      setCreatingNode(false);
    }
  };

  const toggleNodeSave = async (nodeId: string) => {
    const res = await fetch(`/api/technique-nodes/${nodeId}/save`, { method: "POST" });
    if (res.ok) await loadAll(search);
  };

  const toggleNodeLike = async (nodeId: string) => {
    const res = await fetch(`/api/technique-nodes/${nodeId}/like`, { method: "POST" });
    if (res.ok) await loadAll(search);
  };

  return (
    <div className="space-y-5">
      <header className="rounded-xl border border-stone-border bg-bg-card p-5 shadow-[0_12px_30px_rgba(0,0,0,0.24)]">
        <h1 className="font-condensed text-2xl font-black uppercase tracking-[0.14em] text-white">{isEs ? "Social" : "Social"}</h1>
        <p className="mt-1 text-sm text-stone-light">{isEs ? "Entrena de forma más inteligente. Construye tu mente de luchador." : "Train smarter. Build your fight brain."}</p>
        <p className="text-xs text-stone-text">{isEs ? "Red de aprendizaje para luchadores, no vanidad social." : "Learning network for fighters, not vanity engagement."}</p>
      </header>

      <div className="grid gap-2 rounded-xl border border-stone-border bg-bg-card p-2 sm:grid-cols-3 lg:grid-cols-6">
        {([
          { key: "feed", label: isEs ? "Feed de aprendizaje" : "Learning Feed" },
          { key: "fighters", label: isEs ? "Buscar luchadores" : "Find Fighters" },
          { key: "nearby", label: isEs ? "Cerca de ti" : "Nearby" },
          { key: "gyms", label: isEs ? "Gimnasios" : "Gyms" },
          { key: "partners", label: isEs ? "Compañeros" : "Partners" },
          { key: "nodes", label: isEs ? "Grafo de técnicas" : "Technique Graph" },
        ] as Array<{ key: TabKey; label: string }>).map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={cn(
              "relative rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition-colors",
              tab === item.key
                ? "bg-burgundy text-white"
                : "text-stone-light hover:bg-bg-elevated hover:text-white"
            )}
          >
            {item.label}
            {item.key === "partners" && totalUnreadMessages > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-burgundy px-1 text-[10px] font-bold text-white">
                {totalUnreadMessages > 9 ? "9+" : totalUnreadMessages}
              </span>
            )}
          </button>
        ))}
      </div>

      {error && <div className="rounded-lg border border-burgundy/40 bg-burgundy/15 px-3 py-2 text-sm text-burgundy-light">{error}</div>}
      {loading && <div className="text-sm text-stone-text">{isEs ? "Cargando red social..." : "Loading community intelligence..."}</div>}

      {!loading && tab === "feed" && (
        <section className="space-y-4">
          <div className="rounded-xl border border-stone-border bg-bg-card p-4">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-stone-light">{isEs ? "Actividad de la red" : "Network Activity"}</h2>
            <div className="space-y-2">
              {(feed?.events || []).slice(0, 12).map((event) => (
                <div key={event.id} className="rounded-lg border border-stone-border/70 bg-bg-elevated p-3">
                  <p className="text-sm text-white">
                    <span className="font-semibold text-burgundy-light">{event.user?.profile?.displayName || event.user?.name || (isEs ? "Alguien" : "Someone")}</span>{" "}
                    {event.message}
                  </p>
                  <p className="mt-1 text-[11px] uppercase tracking-wider text-stone-text">{new Date(event.createdAt).toLocaleString()}</p>
                </div>
              ))}
              {(!feed?.events || feed.events.length === 0) && (
                <div className="rounded-lg border border-dashed border-stone-border p-4 text-sm text-stone-text">
                  {isEs ? "Aún no hay actividad. Añade amigos y comparte una técnica para activar tu red de aprendizaje." : "No activity yet. Add friends and share a technique node to kickstart your learning network."}
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-stone-border bg-bg-card p-4">
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-light">{isEs ? "Luchadores que quizás conozcas" : "Fighters You May Know"}</h3>
              <div className="mt-3 space-y-2">
                {(feed?.recommendations?.fightersYouMayKnow || []).slice(0, 5).map((fighter) => (
                  <div key={fighter.id} className="rounded-lg border border-stone-border/70 bg-bg-elevated p-3">
                    <p className="text-sm font-semibold text-white">{fighter.profile?.displayName || fighter.name}</p>
                    <p className="text-xs text-stone-light">{fighter.primaryDiscipline} · {fighter.gymName || (isEs ? "Independiente" : "Independent")}</p>
                  </div>
                ))}
                {(feed?.recommendations.fightersYouMayKnow || []).length === 0 && (
                  <p className="text-sm text-stone-text">{isEs ? "Las recomendaciones aparecen a medida que crece tu red." : "Recommendations appear as your network grows."}</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-stone-border bg-bg-card p-4">
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-light">{isEs ? "Popular en tu red" : "Popular In Your Network"}</h3>
              <div className="mt-3 space-y-2">
                {(feed?.recommendations?.popularTechniqueNodes || []).slice(0, 5).map((node) => (
                  <div key={node.id} className="rounded-lg border border-stone-border/70 bg-bg-elevated p-3">
                    <p className="text-sm font-semibold text-white">{node.title}</p>
                    <p className="text-xs text-stone-light">{node.discipline || (isEs ? "General" : "General")} · {node.saves} {isEs ? "guardados" : "saves"} · {node.likes} {isEs ? "me gusta" : "likes"}</p>
                  </div>
                ))}
                {(feed?.recommendations.popularTechniqueNodes || []).length === 0 && (
                  <p className="text-sm text-stone-text">{isEs ? "Aún no hay nodos populares. Añade el primero en el Grafo de técnicas." : "No popular nodes yet. Add your first one in Technique Graph."}</p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {!loading && tab === "fighters" && (
        <section className="space-y-4">
          <div className="rounded-xl border border-stone-border bg-bg-card p-4">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-stone-light">{isEs ? "Buscar luchadores" : "Search fighters"}</label>
            <div className="flex gap-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isEs ? "Nombre, usuario, disciplina" : "Name, username, discipline"}
                className="flex-1 rounded-lg border border-stone-border bg-bg-elevated px-3 py-2 text-sm text-white placeholder:text-stone-text focus:border-burgundy-light focus:outline-none"
              />
              <button
                onClick={() => loadAll(search)}
                className="rounded-lg bg-burgundy px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-burgundy-light"
              >
                {isEs ? "Buscar" : "Search"}
              </button>
            </div>
          </div>

          <div className="grid gap-3">
            {filteredFighters.map((fighter) => (
              <div key={fighter.id} className="rounded-xl border border-stone-border bg-bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{fighter.profile?.displayName || fighter.name}</p>
                    <p className="text-xs text-stone-light">
                      @{fighter.profile?.username || (fighter.name || "fighter").toLowerCase().replace(/\s+/g, "")}
                      {" · "}
                      {fighter.primaryDiscipline}
                    </p>
                    <p className="mt-1 text-xs text-stone-text">
                      {fighter.primaryGymId ? (
                        <Link href={`/dashboard/gyms/${fighter.primaryGymId}`} className="text-burgundy-light hover:underline">
                          {fighter.gymName || (isEs ? "Ver gimnasio" : "View gym")}
                        </Link>
                      ) : (
                        fighter.gymName || (isEs ? "Sin gimnasio" : "No gym listed")
                      )}
                      {fighter.profile?.city ? ` · ${fighter.profile.city}` : ""}
                    </p>
                  </div>

                  {fighter.isFriend ? (
                    <span className="rounded-md border border-burgundy/50 bg-burgundy/20 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-burgundy-light">{isEs ? "Conectado" : "Connected"}</span>
                  ) : outgoingReceiverIds.has(fighter.id) ? (
                    <span className="rounded-md border border-amber/30 bg-amber/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-amber">{isEs ? "Pendiente" : "Pending"}</span>
                  ) : incomingRequesterIds.has(fighter.id) ? (
                    <button
                      onClick={() => setTab("partners")}
                      className="rounded-md border border-burgundy/50 bg-burgundy/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-burgundy-light"
                    >
                      {isEs ? "Responder" : "Respond"}
                    </button>
                  ) : (
                    <button
                      onClick={() => sendRequest(fighter.id)}
                      className="rounded-md border border-stone-border bg-bg-elevated px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white hover:border-burgundy-light"
                    >
                      {isEs ? "Enviar solicitud" : "Send Request"}
                    </button>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-stone-light">
                  <span className="rounded bg-bg-elevated px-2 py-1">{isEs ? "Amigos en común" : "Mutual friends"}: {fighter.mutualFriends}</span>
                  <span className="rounded bg-bg-elevated px-2 py-1">{isEs ? "Disciplinas compartidas" : "Shared disciplines"}: {fighter.sharedDisciplines.length}</span>
                  <span className="rounded bg-bg-elevated px-2 py-1">{isEs ? "Gimnasios compartidos" : "Shared gyms"}: {fighter.sharedGyms.length}</span>
                </div>
              </div>
            ))}
            {filteredFighters.length === 0 && (
              <div className="rounded-xl border border-dashed border-stone-border bg-bg-card p-5 text-sm text-stone-text">
                {isEs ? "Aún no se encontraron luchadores. Prueba con una disciplina o usuario." : "No fighters found yet. Try a discipline or username search."}
              </div>
            )}
          </div>
        </section>
      )}

      {!loading && tab === "nearby" && (
        <section className="space-y-4">
          <div className="rounded-xl border border-stone-border bg-bg-card p-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-light">{isEs ? "Encuentra luchadores cerca de ti" : "Find fighters near you"}</h3>
            <p className="mt-1 text-xs text-stone-text">
              {isEs ? "Indica tu código postal para descubrir luchadores y gimnasios cercanos en el mapa. Solo se usa para estimar la distancia." : "Set your postal code to discover nearby fighters and gyms on the map. This is only used to estimate distance."}
            </p>
            <div className="mt-3 flex gap-2">
              <input
                value={postalCodeInput}
                onChange={(e) => setPostalCodeInput(e.target.value)}
                placeholder={nearby?.center?.postalCode || (isEs ? "Código postal" : "Postal / ZIP code")}
                className="flex-1 rounded-lg border border-stone-border bg-bg-elevated px-3 py-2 text-sm text-white placeholder:text-stone-text focus:border-burgundy-light focus:outline-none"
              />
              <button
                onClick={savePostalCode}
                disabled={savingPostalCode}
                className="rounded-lg bg-burgundy px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-burgundy-light disabled:opacity-60"
              >
                {savingPostalCode ? (isEs ? "Guardando..." : "Saving...") : (isEs ? "Guardar" : "Save")}
              </button>
            </div>
          </div>

          {nearbyLoading && <div className="text-sm text-stone-text">{isEs ? "Localizando luchadores cercanos..." : "Locating nearby fighters..."}</div>}

          {!nearbyLoading && nearby?.needsLocation && (
            <div className="rounded-xl border border-dashed border-stone-border bg-bg-card p-5 text-sm text-stone-text">
              {isEs ? "Añade tu código postal arriba para desbloquear el mapa y la lista de luchadores cercanos." : "Add your postal code above to unlock the nearby map and fighter list."}
            </div>
          )}

          {!nearbyLoading && nearby && !nearby.needsLocation && nearby.center && (
            <>
              <NearbyMap
                center={{ latitude: nearby.center.latitude, longitude: nearby.center.longitude }}
                fighters={(nearby.fighters || []).map((f) => ({
                  id: f.id,
                  label: f.profile?.displayName || f.name,
                  sublabel: `${f.primaryDiscipline} · ${f.distanceKm} km`,
                  latitude: f.latitude,
                  longitude: f.longitude,
                }))}
                gyms={nearby.gyms || []}
              />

              <div className="grid gap-3">
                {(nearby.fighters || []).map((fighter) => (
                  <div key={fighter.id} className="rounded-xl border border-stone-border bg-bg-card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{fighter.profile?.displayName || fighter.name}</p>
                        <p className="text-xs text-stone-light">
                          {fighter.primaryDiscipline} · {fighter.distanceKm} km {isEs ? "de distancia" : "away"}
                        </p>
                        <p className="mt-1 text-xs text-stone-text">
                          {fighter.gymName || (isEs ? "Sin gimnasio" : "No gym listed")}
                          {fighter.profile?.city ? ` · ${fighter.profile.city}` : ""}
                        </p>
                      </div>
                      {fighter.isFriend ? (
                        <span className="rounded-md border border-burgundy/50 bg-burgundy/20 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-burgundy-light">{isEs ? "Conectado" : "Connected"}</span>
                      ) : outgoingReceiverIds.has(fighter.id) ? (
                        <span className="rounded-md border border-amber/30 bg-amber/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-amber">{isEs ? "Pendiente" : "Pending"}</span>
                      ) : (
                        <button
                          onClick={() => sendRequest(fighter.id)}
                          className="rounded-md border border-stone-border bg-bg-elevated px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white hover:border-burgundy-light"
                        >
                          {isEs ? "Enviar solicitud" : "Send Request"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {(nearby.fighters || []).length === 0 && (
                  <div className="rounded-xl border border-dashed border-stone-border bg-bg-card p-5 text-sm text-stone-text">
                    {isEs ? `Aún no se han encontrado luchadores en un radio de ${nearby.radiusKm ?? 100} km. Vuelve pronto.` : `No fighters found within ${nearby.radiusKm ?? 100} km yet. Check back as more fighters join.`}
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      )}

      {tab === "gyms" && (
        <section>
          <GymsDirectoryPage />
        </section>
      )}

      {!loading && tab === "partners" && (
        <section className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-stone-border bg-bg-card p-4">
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-light">{isEs ? "Solicitudes recibidas" : "Incoming Requests"}</h3>
              <div className="mt-3 space-y-2">
                {incomingRequests.map((request) => (
                  <div key={request.id} className="rounded-lg border border-stone-border/70 bg-bg-elevated p-3">
                    <p className="text-sm text-white">{request.requester?.profile?.displayName || request.requester?.name}</p>
                    <p className="text-xs text-stone-light">{request.requester?.discipline} · {request.requester?.gymName || (isEs ? "Sin gimnasio" : "No gym")}</p>
                    <div className="mt-2 flex gap-2">
                      <button onClick={() => processRequest(request.id, "accept")} className="rounded bg-burgundy px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">{isEs ? "Aceptar" : "Accept"}</button>
                      <button onClick={() => processRequest(request.id, "reject")} className="rounded border border-stone-border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-stone-light">{isEs ? "Rechazar" : "Reject"}</button>
                    </div>
                  </div>
                ))}
                {incomingRequests.length === 0 && <p className="text-sm text-stone-text">{isEs ? "Sin solicitudes recibidas." : "No incoming requests."}</p>}
              </div>
            </div>

            <div className="rounded-xl border border-stone-border bg-bg-card p-4">
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-light">{isEs ? "Solicitudes enviadas" : "Outgoing Requests"}</h3>
              <div className="mt-3 space-y-2">
                {outgoingRequests.map((request) => (
                  <div key={request.id} className="rounded-lg border border-stone-border/70 bg-bg-elevated p-3">
                    <p className="text-sm text-white">{request.receiver?.profile?.displayName || request.receiver?.name}</p>
                    <p className="text-xs text-stone-light">{request.receiver?.discipline} · {request.receiver?.gymName || (isEs ? "Sin gimnasio" : "No gym")}</p>
                    <button onClick={() => processRequest(request.id, "cancel")} className="mt-2 rounded border border-stone-border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-stone-light">{isEs ? "Cancelar" : "Cancel"}</button>
                  </div>
                ))}
                {outgoingRequests.length === 0 && <p className="text-sm text-stone-text">{isEs ? "Sin solicitudes enviadas." : "No outgoing requests."}</p>}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-stone-border bg-bg-card p-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-light">{isEs ? "Luchadores conectados" : "Connected Fighters"}</h3>
            <div className="mt-3 grid gap-2">
              {friends.map((friend) => (
                <div key={friend.friendshipId} className="rounded-lg border border-stone-border/70 bg-bg-elevated p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{friend.name}</p>
                      <p className="text-xs text-stone-light">
                        {friend.primaryDiscipline} ·{" "}
                        {friend.primaryGymId ? (
                          <Link href={`/dashboard/gyms/${friend.primaryGymId}`} className="text-burgundy-light hover:underline">
                            {friend.gymName || (isEs ? "Ver gimnasio" : "View gym")}
                          </Link>
                        ) : (
                          friend.gymName || (isEs ? "Sin gimnasio" : "No gym")
                        )}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        onClick={() => openChat(friend.id)}
                        className="relative rounded px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider border border-burgundy/50 bg-burgundy/20 text-burgundy-light hover:bg-burgundy/30"
                      >
                        {isEs ? "Mensaje" : "Message"}
                        {(conversations.find((c) => c.friend?.id === friend.id)?.unreadCount ?? 0) > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-burgundy px-1 text-[9px] font-bold text-white">
                            {conversations.find((c) => c.friend?.id === friend.id)?.unreadCount}
                          </span>
                        )}
                      </button>
                      <button
                        onClick={() => toggleTrainingPartner(friend.friendshipId, friend.isTrainingPartner)}
                        className={cn(
                          "rounded px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider",
                          friend.isTrainingPartner
                            ? "border border-burgundy/50 bg-burgundy/20 text-burgundy-light"
                            : "border border-stone-border text-stone-light"
                        )}
                      >
                        {friend.isTrainingPartner ? (isEs ? "Compañero de entreno" : "Training Partner") : (isEs ? "Marcar compañero" : "Mark Partner")}
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-stone-light">
                    <span className="rounded bg-bg-card px-2 py-1">{isEs ? "En común" : "Mutual"}: {friend.mutualFriends}</span>
                    <span className="rounded bg-bg-card px-2 py-1">{isEs ? "Disciplinas compartidas" : "Shared disciplines"}: {friend.sharedDisciplines.length}</span>
                    <span className="rounded bg-bg-card px-2 py-1">{isEs ? "Gimnasios compartidos" : "Shared gyms"}: {friend.sharedGyms.length}</span>
                    <span className="rounded bg-bg-card px-2 py-1">{isEs ? "Sesiones semanales" : "Weekly sessions"}: {friend.weeklySessionCount}</span>
                  </div>
                </div>
              ))}
              {friends.length === 0 && (
                <div className="rounded-lg border border-dashed border-stone-border p-4 text-sm text-stone-text">
                  {isEs ? "Aún no hay conexiones. Empieza enviando solicitudes a luchadores de tu disciplina." : "No connections yet. Start by sending requests to fighters in your discipline."}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {!loading && tab === "nodes" && (
        <section className="space-y-4">
          <div className="rounded-xl border border-stone-border bg-bg-card p-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-light">{isEs ? "Añadir nodo de técnica" : "Add Technique Node"}</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <input
                value={nodeForm.title}
                onChange={(e) => setNodeForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Single Leg Defense"
                className="rounded-lg border border-stone-border bg-bg-elevated px-3 py-2 text-sm text-white placeholder:text-stone-text focus:border-burgundy-light focus:outline-none"
              />
              <input
                value={nodeForm.discipline}
                onChange={(e) => setNodeForm((prev) => ({ ...prev, discipline: e.target.value }))}
                placeholder="MMA"
                className="rounded-lg border border-stone-border bg-bg-elevated px-3 py-2 text-sm text-white placeholder:text-stone-text focus:border-burgundy-light focus:outline-none"
              />
              <input
                value={nodeForm.position}
                onChange={(e) => setNodeForm((prev) => ({ ...prev, position: e.target.value }))}
                placeholder="Half Guard Bottom"
                className="rounded-lg border border-stone-border bg-bg-elevated px-3 py-2 text-sm text-white placeholder:text-stone-text focus:border-burgundy-light focus:outline-none"
              />
              <select
                value={nodeForm.visibility}
                onChange={(e) => setNodeForm((prev) => ({ ...prev, visibility: e.target.value as "private" | "friends" | "public" }))}
                title={isEs ? "Visibilidad del nodo de técnica" : "Technique node visibility"}
                className="rounded-lg border border-stone-border bg-bg-elevated px-3 py-2 text-sm text-white focus:border-burgundy-light focus:outline-none"
              >
                <option value="private">{isEs ? "Privado" : "Private"}</option>
                <option value="friends">{isEs ? "Amigos" : "Friends"}</option>
                <option value="public">{isEs ? "Público" : "Public"}</option>
              </select>
              <textarea
                value={nodeForm.description}
                onChange={(e) => setNodeForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder={isEs ? "Detalles clave, señales y referencias tácticas..." : "Key details, cues, and tactical references..."}
                className="sm:col-span-2 rounded-lg border border-stone-border bg-bg-elevated px-3 py-2 text-sm text-white placeholder:text-stone-text focus:border-burgundy-light focus:outline-none"
                rows={3}
              />
            </div>
            <button
              onClick={createNode}
              disabled={creatingNode}
              className="mt-3 rounded-lg bg-burgundy px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-burgundy-light disabled:opacity-60"
            >
              {creatingNode ? (isEs ? "Guardando..." : "Saving...") : (isEs ? "Crear nodo" : "Create Node")}
            </button>
          </div>

          <div className="grid gap-3">
            {nodes.map((node) => (
              <div key={node.id} className="rounded-xl border border-stone-border bg-bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{node.title}</p>
                    <p className="text-xs text-stone-light">
                      {node.discipline || (isEs ? "General" : "General")}
                      {node.position ? ` · ${node.position}` : ""}
                      {" · "}
                      {node.visibility}
                    </p>
                    {node.description && <p className="mt-2 text-sm text-stone-light">{node.description}</p>}
                  </div>
                  <span className="rounded bg-bg-elevated px-2 py-1 text-[11px] uppercase tracking-wider text-stone-light">{node.createdBy?.profile?.displayName || node.createdBy?.name || (isEs ? "Desconocido" : "Unknown")}</span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button onClick={() => toggleNodeLike(node.id)} className={cn("rounded px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider", node.hasLiked ? "bg-burgundy/20 text-burgundy-light" : "border border-stone-border text-stone-light")}>{isEs ? "Me gusta" : "Like"} ({node.counts.likes})</button>
                  <button onClick={() => toggleNodeSave(node.id)} className={cn("rounded px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider", node.hasSaved ? "bg-burgundy/20 text-burgundy-light" : "border border-stone-border text-stone-light")}>{isEs ? "Guardar" : "Save"} ({node.counts.saves})</button>
                  <span className="rounded bg-bg-elevated px-2 py-1 text-[11px] text-stone-light">{isEs ? "Comentarios" : "Comments"}: {node.counts.comments}</span>
                </div>
              </div>
            ))}
            {nodes.length === 0 && (
              <div className="rounded-xl border border-dashed border-stone-border bg-bg-card p-5 text-sm text-stone-text">
                {isEs ? "Aún no hay nodos de técnica. Añade el primero en privado y compártelo con tus amigos." : "No technique nodes yet. Add your first knowledge node privately, then share with friends."}
              </div>
            )}
          </div>
        </section>
      )}

      <Modal
        open={!!activeChatFriendId}
        onClose={closeChat}
        title={
          friends.find((f) => f.id === activeChatFriendId)?.name ||
          conversations.find((c) => c.friend?.id === activeChatFriendId)?.friend?.name ||
          (isEs ? "Mensaje" : "Message")
        }
        className="max-w-md"
      >
        <div className="flex h-[420px] flex-col">
          <div className="flex-1 space-y-2 overflow-y-auto p-4">
            {chatLoading && <p className="text-sm text-stone-text">{isEs ? "Cargando..." : "Loading..."}</p>}
            {!chatLoading && chatMessages.length === 0 && (
              <p className="text-sm text-stone-text">{isEs ? "Aún no hay mensajes. ¡Saluda!" : "No messages yet. Say hi!"}</p>
            )}
            {chatMessages.map((message) => {
              const mine = message.senderId !== activeChatFriendId;
              return (
                <div key={message.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[75%] rounded-lg px-3 py-2 text-sm",
                      mine ? "bg-burgundy text-white" : "bg-bg-elevated text-white border border-stone-border"
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                    <p className={cn("mt-1 text-[10px]", mine ? "text-white/70" : "text-stone-text")}>
                      {new Date(message.createdAt).toLocaleTimeString(isEs ? "es-ES" : "en-US", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-2 border-t border-stone-border p-3">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendChatMessage();
                }
              }}
              placeholder={isEs ? "Escribe un mensaje..." : "Write a message..."}
              className="flex-1 rounded-lg border border-stone-border bg-bg-elevated px-3 py-2 text-sm text-white placeholder:text-stone-text focus:border-burgundy-light focus:outline-none"
            />
            <button
              onClick={sendChatMessage}
              disabled={sendingChat || !chatInput.trim()}
              className="rounded-lg bg-burgundy px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-burgundy-light disabled:opacity-60"
            >
              {isEs ? "Enviar" : "Send"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
