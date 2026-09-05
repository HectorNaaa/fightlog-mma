"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { tr } from "@/lib/i18n";
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
  const L = (dict: { en: string; es?: string; pt?: string; fr?: string; it?: string; uk?: string }) => tr(locale, dict);
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
        setError(data.error ?? L({ en: "Could not save postal code", es: "No se pudo guardar el código postal", pt: "Não foi possível salvar o CEP", fr: "Impossible d'enregistrer le code postal", it: "Impossibile salvare il codice postale", uk: "Не вдалося зберегти поштовий індекс" }));
        return;
      }
      await loadNearby();
    } catch {
      setError(L({ en: "Network error saving postal code", es: "Error de red al guardar el código postal", pt: "Erro de rede ao salvar o CEP", fr: "Erreur réseau lors de l'enregistrement du code postal", it: "Errore di rete durante il salvataggio del codice postale", uk: "Помилка мережі під час збереження поштового індексу" }));
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
        setError(L({ en: "Some community data failed to load. Try refreshing.", es: "Algunos datos de la comunidad no se pudieron cargar. Intenta actualizar la página.", pt: "Alguns dados da comunidade não puderam ser carregados. Tente atualizar a página.", fr: "Certaines données de la communauté n'ont pas pu être chargées. Essayez d'actualiser la page.", it: "Alcuni dati della community non sono stati caricati. Prova ad aggiornare la pagina.", uk: "Деякі дані спільноти не вдалося завантажити. Спробуйте оновити сторінку." }));
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
      // best-effort -- chat badge just stays stale until next poll
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
        setError(data.error ?? L({ en: "Could not send message", es: "No se pudo enviar el mensaje", pt: "Não foi possível enviar a mensagem", fr: "Impossible d'envoyer le message", it: "Impossibile inviare il messaggio", uk: "Не вдалося надіслати повідомлення" }));
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
      setError(data.error ?? L({ en: "Could not send request", es: "No se pudo enviar la solicitud", pt: "Não foi possível enviar a solicitação", fr: "Impossible d'envoyer la demande", it: "Impossibile inviare la richiesta", uk: "Не вдалося надіслати запит" }));
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
      setError(data.error ?? L({ en: "Could not process request", es: "No se pudo procesar la solicitud", pt: "Não foi possível processar a solicitação", fr: "Impossible de traiter la demande", it: "Impossibile elaborare la richiesta", uk: "Не вдалося обробити запит" }));
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
      setError(data.error ?? L({ en: "Could not update training partner status", es: "No se pudo actualizar el estado de compañero de entreno", pt: "Não foi possível atualizar o status de parceiro de treino", fr: "Impossible de mettre à jour le statut de partenaire d'entraînement", it: "Impossibile aggiornare lo stato di partner di allenamento", uk: "Не вдалося оновити статус партнера з тренувань" }));
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
      setError(L({ en: "Technique title is required.", es: "El título de la técnica es obligatorio.", pt: "O título da técnica é obrigatório.", fr: "Le titre de la technique est requis.", it: "Il titolo della tecnica è obbligatorio.", uk: "Назва техніки є обов'язковою." }));
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
        setError(data.error ?? L({ en: "Could not create technique node", es: "No se pudo crear el nodo de técnica", pt: "Não foi possível criar o nó de técnica", fr: "Impossible de créer le nœud de technique", it: "Impossibile creare il nodo tecnica", uk: "Не вдалося створити вузол техніки" }));
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
        <h1 className="font-condensed text-2xl font-black uppercase tracking-[0.14em] text-white">Social</h1>
        <p className="mt-1 text-sm text-stone-light">{L({ en: "Train smarter. Build your fight brain.", es: "Entrena de forma más inteligente. Construye tu mente de luchador.", pt: "Treine de forma mais inteligente. Construa sua mente de lutador.", fr: "Entraînez-vous plus intelligemment. Construisez votre mental de combattant.", it: "Allenati in modo più intelligente. Costruisci la tua mente da combattente.", uk: "Тренуйся розумніше. Розвивай мислення бійця." })}</p>
        <p className="text-xs text-stone-text">{L({ en: "Learning network for fighters, not vanity engagement.", es: "Red de aprendizaje para luchadores, no vanidad social.", pt: "Rede de aprendizado para lutadores, não engajamento vaidoso.", fr: "Réseau d'apprentissage pour combattants, pas de l'engagement superficiel.", it: "Rete di apprendimento per combattenti, non coinvolgimento superficiale.", uk: "Мережа для навчання бійців, а не марнославна активність." })}</p>
      </header>

      <div className="grid gap-2 rounded-xl border border-stone-border bg-bg-card p-2 sm:grid-cols-3 lg:grid-cols-6">
        {([
          { key: "feed", label: L({ en: "Learning Feed", es: "Feed de aprendizaje", pt: "Feed de Aprendizado", fr: "Fil d'apprentissage", it: "Feed di apprendimento", uk: "Стрічка навчання" }) },
          { key: "fighters", label: L({ en: "Find Fighters", es: "Buscar luchadores", pt: "Encontrar lutadores", fr: "Trouver des combattants", it: "Trova combattenti", uk: "Знайти бійців" }) },
          { key: "nearby", label: L({ en: "Nearby", es: "Cerca de ti", pt: "Perto de você", fr: "À proximité", it: "Nelle vicinanze", uk: "Поруч" }) },
          { key: "gyms", label: L({ en: "Gyms", es: "Gimnasios", pt: "Academias", fr: "Salles", it: "Palestre", uk: "Зали" }) },
          { key: "partners", label: L({ en: "Partners", es: "Compañeros", pt: "Parceiros", fr: "Partenaires", it: "Partner", uk: "Партнери" }) },
          { key: "nodes", label: L({ en: "Technique Graph", es: "Grafo de técnicas", pt: "Grafo de técnicas", fr: "Graphe de techniques", it: "Grafo delle tecniche", uk: "Граф технік" }) },
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
      {loading && <div className="text-sm text-stone-text">{L({ en: "Loading community intelligence...", es: "Cargando red social...", pt: "Carregando rede social...", fr: "Chargement du réseau communautaire...", it: "Caricamento della rete sociale...", uk: "Завантаження спільноти..." })}</div>}

      {!loading && tab === "feed" && (
        <section className="space-y-4">
          <div className="rounded-xl border border-stone-border bg-bg-card p-4">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-stone-light">{L({ en: "Network Activity", es: "Actividad de la red", pt: "Atividade da rede", fr: "Activité du réseau", it: "Attività della rete", uk: "Активність мережі" })}</h2>
            <div className="space-y-2">
              {(feed?.events || []).slice(0, 12).map((event) => (
                <div key={event.id} className="rounded-lg border border-stone-border/70 bg-bg-elevated p-3">
                  <p className="text-sm text-white">
                    <span className="font-semibold text-burgundy-light">{event.user?.profile?.displayName || event.user?.name || L({ en: "Someone", es: "Alguien", pt: "Alguém", fr: "Quelqu'un", it: "Qualcuno", uk: "Хтось" })}</span>{" "}
                    {event.message}
                  </p>
                  <p className="mt-1 text-[11px] uppercase tracking-wider text-stone-text">{new Date(event.createdAt).toLocaleString()}</p>
                </div>
              ))}
              {(!feed?.events || feed.events.length === 0) && (
                <div className="rounded-lg border border-dashed border-stone-border p-4 text-sm text-stone-text">
                  {L({ en: "No activity yet. Add friends and share a technique node to kickstart your learning network.", es: "Aún no hay actividad. Añade amigos y comparte una técnica para activar tu red de aprendizaje.", pt: "Ainda não há atividade. Adicione amigos e compartilhe uma técnica para ativar sua rede de aprendizado.", fr: "Pas encore d'activité. Ajoutez des amis et partagez une technique pour lancer votre réseau d'apprentissage.", it: "Ancora nessuna attività. Aggiungi amici e condividi una tecnica per avviare la tua rete di apprendimento.", uk: "Активності ще немає. Додайте друзів і поділіться технікою, щоб запустити свою мережу навчання." })}
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-stone-border bg-bg-card p-4">
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-light">{L({ en: "Fighters You May Know", es: "Luchadores que quizás conozcas", pt: "Lutadores que você talvez conheça", fr: "Combattants que vous connaissez peut-être", it: "Combattenti che potresti conoscere", uk: "Бійці, яких ви можете знати" })}</h3>
              <div className="mt-3 space-y-2">
                {(feed?.recommendations?.fightersYouMayKnow || []).slice(0, 5).map((fighter) => (
                  <div key={fighter.id} className="rounded-lg border border-stone-border/70 bg-bg-elevated p-3">
                    <p className="text-sm font-semibold text-white">{fighter.profile?.displayName || fighter.name}</p>
                    <p className="text-xs text-stone-light">{fighter.primaryDiscipline} · {fighter.gymName || L({ en: "Independent", es: "Independiente", pt: "Independente", fr: "Indépendant", it: "Indipendente", uk: "Незалежний" })}</p>
                  </div>
                ))}
                {(feed?.recommendations.fightersYouMayKnow || []).length === 0 && (
                  <p className="text-sm text-stone-text">{L({ en: "Recommendations appear as your network grows.", es: "Las recomendaciones aparecen a medida que crece tu red.", pt: "As recomendações aparecem à medida que sua rede cresce.", fr: "Les recommandations apparaissent au fur et à mesure que votre réseau grandit.", it: "I suggerimenti compaiono man mano che la tua rete cresce.", uk: "Рекомендації з'являються з ростом вашої мережі." })}</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-stone-border bg-bg-card p-4">
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-light">{L({ en: "Popular In Your Network", es: "Popular en tu red", pt: "Popular na sua rede", fr: "Populaire dans votre réseau", it: "Popolare nella tua rete", uk: "Популярне у вашій мережі" })}</h3>
              <div className="mt-3 space-y-2">
                {(feed?.recommendations?.popularTechniqueNodes || []).slice(0, 5).map((node) => (
                  <div key={node.id} className="rounded-lg border border-stone-border/70 bg-bg-elevated p-3">
                    <p className="text-sm font-semibold text-white">{node.title}</p>
                    <p className="text-xs text-stone-light">{node.discipline || L({ en: "General", es: "General", pt: "Geral", fr: "Général", it: "Generale", uk: "Загальне" })} · {node.saves} {L({ en: "saves", es: "guardados", pt: "salvamentos", fr: "sauvegardes", it: "salvataggi", uk: "збережень" })} · {node.likes} {L({ en: "likes", es: "me gusta", pt: "curtidas", fr: "mentions J'aime", it: "mi piace", uk: "вподобань" })}</p>
                  </div>
                ))}
                {(feed?.recommendations.popularTechniqueNodes || []).length === 0 && (
                  <p className="text-sm text-stone-text">{L({ en: "No popular nodes yet. Add your first one in Technique Graph.", es: "Aún no hay nodos populares. Añade el primero en el Grafo de técnicas.", pt: "Ainda não há nós populares. Adicione o primeiro no Grafo de técnicas.", fr: "Pas encore de nœuds populaires. Ajoutez le premier dans le Graphe de techniques.", it: "Ancora nessun nodo popolare. Aggiungi il primo nel Grafo delle tecniche.", uk: "Популярних вузлів ще немає. Додайте перший у Графі технік." })}</p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {!loading && tab === "fighters" && (
        <section className="space-y-4">
          <div className="rounded-xl border border-stone-border bg-bg-card p-4">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-stone-light">{L({ en: "Search fighters", es: "Buscar luchadores", pt: "Buscar lutadores", fr: "Rechercher des combattants", it: "Cerca combattenti", uk: "Пошук бійців" })}</label>
            <div className="flex gap-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={L({ en: "Name, username, discipline", es: "Nombre, usuario, disciplina", pt: "Nome, usuário, disciplina", fr: "Nom, pseudo, discipline", it: "Nome, utente, disciplina", uk: "Ім'я, юзернейм, дисципліна" })}
                className="flex-1 rounded-lg border border-stone-border bg-bg-elevated px-3 py-2 text-sm text-white placeholder:text-stone-text focus:border-burgundy-light focus:outline-none"
              />
              <button
                onClick={() => loadAll(search)}
                className="rounded-lg bg-burgundy px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-burgundy-light"
              >
                {L({ en: "Search", es: "Buscar", pt: "Buscar", fr: "Rechercher", it: "Cerca", uk: "Пошук" })}
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
                          {fighter.gymName || L({ en: "View gym", es: "Ver gimnasio", pt: "Ver academia", fr: "Voir la salle", it: "Vedi palestra", uk: "Переглянути залу" })}
                        </Link>
                      ) : (
                        fighter.gymName || L({ en: "No gym listed", es: "Sin gimnasio", pt: "Sem academia informada", fr: "Aucune salle indiquée", it: "Nessuna palestra indicata", uk: "Зала не вказана" })
                      )}
                      {fighter.profile?.city ? ` · ${fighter.profile.city}` : ""}
                    </p>
                  </div>

                  {fighter.isFriend ? (
                    <span className="rounded-md border border-burgundy/50 bg-burgundy/20 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-burgundy-light">{L({ en: "Connected", es: "Conectado", pt: "Conectado", fr: "Connecté", it: "Connesso", uk: "З'єднано" })}</span>
                  ) : outgoingReceiverIds.has(fighter.id) ? (
                    <span className="rounded-md border border-amber/30 bg-amber/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-amber">{L({ en: "Pending", es: "Pendiente", pt: "Pendente", fr: "En attente", it: "In attesa", uk: "Очікує" })}</span>
                  ) : incomingRequesterIds.has(fighter.id) ? (
                    <button
                      onClick={() => setTab("partners")}
                      className="rounded-md border border-burgundy/50 bg-burgundy/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-burgundy-light"
                    >
                      {L({ en: "Respond", es: "Responder", pt: "Responder", fr: "Répondre", it: "Rispondi", uk: "Відповісти" })}
                    </button>
                  ) : (
                    <button
                      onClick={() => sendRequest(fighter.id)}
                      className="rounded-md border border-stone-border bg-bg-elevated px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white hover:border-burgundy-light"
                    >
                      {L({ en: "Send Request", es: "Enviar solicitud", pt: "Enviar solicitação", fr: "Envoyer une demande", it: "Invia richiesta", uk: "Надіслати запит" })}
                    </button>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-stone-light">
                  <span className="rounded bg-bg-elevated px-2 py-1">{L({ en: "Mutual friends", es: "Amigos en común", pt: "Amigos em comum", fr: "Amis en commun", it: "Amici in comune", uk: "Спільні друзі" })}: {fighter.mutualFriends}</span>
                  <span className="rounded bg-bg-elevated px-2 py-1">{L({ en: "Shared disciplines", es: "Disciplinas compartidas", pt: "Disciplinas compartilhadas", fr: "Disciplines partagées", it: "Discipline condivise", uk: "Спільні дисципліни" })}: {fighter.sharedDisciplines.length}</span>
                  <span className="rounded bg-bg-elevated px-2 py-1">{L({ en: "Shared gyms", es: "Gimnasios compartidos", pt: "Academias compartilhadas", fr: "Salles partagées", it: "Palestre condivise", uk: "Спільні зали" })}: {fighter.sharedGyms.length}</span>
                </div>
              </div>
            ))}
            {filteredFighters.length === 0 && (
              <div className="rounded-xl border border-dashed border-stone-border bg-bg-card p-5 text-sm text-stone-text">
                {L({ en: "No fighters found yet. Try a discipline or username search.", es: "Aún no se encontraron luchadores. Prueba con una disciplina o usuario.", pt: "Nenhum lutador encontrado ainda. Tente buscar por disciplina ou usuário.", fr: "Aucun combattant trouvé pour l'instant. Essayez une recherche par discipline ou pseudo.", it: "Ancora nessun combattente trovato. Prova una ricerca per disciplina o utente.", uk: "Бійців ще не знайдено. Спробуйте пошук за дисципліною чи юзернеймом." })}
              </div>
            )}
          </div>
        </section>
      )}

      {!loading && tab === "nearby" && (
        <section className="space-y-4">
          <div className="rounded-xl border border-stone-border bg-bg-card p-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-light">{L({ en: "Find fighters near you", es: "Encuentra luchadores cerca de ti", pt: "Encontre lutadores perto de você", fr: "Trouvez des combattants près de chez vous", it: "Trova combattenti vicino a te", uk: "Знайдіть бійців поруч із вами" })}</h3>
            <p className="mt-1 text-xs text-stone-text">
              {L({ en: "Set your postal code to discover nearby fighters and gyms on the map. This is only used to estimate distance.", es: "Indica tu código postal para descubrir luchadores y gimnasios cercanos en el mapa. Solo se usa para estimar la distancia.", pt: "Informe seu CEP para descobrir lutadores e academias próximos no mapa. Isso é usado apenas para estimar a distância.", fr: "Indiquez votre code postal pour découvrir des combattants et des salles à proximité sur la carte. Cela sert uniquement à estimer la distance.", it: "Inserisci il tuo codice postale per scoprire combattenti e palestre vicine sulla mappa. Viene usato solo per stimare la distanza.", uk: "Вкажіть свій поштовий індекс, щоб знайти бійців і зали поруч на карті. Це використовується лише для оцінки відстані." })}
            </p>
            <div className="mt-3 flex gap-2">
              <input
                value={postalCodeInput}
                onChange={(e) => setPostalCodeInput(e.target.value)}
                placeholder={nearby?.center?.postalCode || L({ en: "Postal / ZIP code", es: "Código postal", pt: "CEP", fr: "Code postal", it: "Codice postale", uk: "Поштовий індекс" })}
                className="flex-1 rounded-lg border border-stone-border bg-bg-elevated px-3 py-2 text-sm text-white placeholder:text-stone-text focus:border-burgundy-light focus:outline-none"
              />
              <button
                onClick={savePostalCode}
                disabled={savingPostalCode}
                className="rounded-lg bg-burgundy px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-burgundy-light disabled:opacity-60"
              >
                {savingPostalCode ? L({ en: "Saving...", es: "Guardando...", pt: "Salvando...", fr: "Enregistrement...", it: "Salvataggio...", uk: "Збереження..." }) : L({ en: "Save", es: "Guardar", pt: "Salvar", fr: "Enregistrer", it: "Salva", uk: "Зберегти" })}
              </button>
            </div>
          </div>

          {nearbyLoading && <div className="text-sm text-stone-text">{L({ en: "Locating nearby fighters...", es: "Localizando luchadores cercanos...", pt: "Localizando lutadores próximos...", fr: "Localisation des combattants à proximité...", it: "Localizzazione combattenti vicini...", uk: "Пошук бійців поблизу..." })}</div>}

          {!nearbyLoading && nearby?.needsLocation && (
            <div className="rounded-xl border border-dashed border-stone-border bg-bg-card p-5 text-sm text-stone-text">
              {L({ en: "Add your postal code above to unlock the nearby map and fighter list.", es: "Añade tu código postal arriba para desbloquear el mapa y la lista de luchadores cercanos.", pt: "Adicione seu CEP acima para desbloquear o mapa e a lista de lutadores próximos.", fr: "Ajoutez votre code postal ci-dessus pour débloquer la carte et la liste des combattants à proximité.", it: "Aggiungi il tuo codice postale sopra per sbloccare la mappa e l'elenco dei combattenti vicini.", uk: "Додайте свій поштовий індекс вище, щоб розблокувати карту та список бійців поблизу." })}
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
                          {fighter.primaryDiscipline} · {fighter.distanceKm} km {L({ en: "away", es: "de distancia", pt: "de distância", fr: "de distance", it: "di distanza", uk: "від вас" })}
                        </p>
                        <p className="mt-1 text-xs text-stone-text">
                          {fighter.gymName || L({ en: "No gym listed", es: "Sin gimnasio", pt: "Sem academia informada", fr: "Aucune salle indiquée", it: "Nessuna palestra indicata", uk: "Зала не вказана" })}
                          {fighter.profile?.city ? ` · ${fighter.profile.city}` : ""}
                        </p>
                      </div>
                      {fighter.isFriend ? (
                        <span className="rounded-md border border-burgundy/50 bg-burgundy/20 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-burgundy-light">{L({ en: "Connected", es: "Conectado", pt: "Conectado", fr: "Connecté", it: "Connesso", uk: "З'єднано" })}</span>
                      ) : outgoingReceiverIds.has(fighter.id) ? (
                        <span className="rounded-md border border-amber/30 bg-amber/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-amber">{L({ en: "Pending", es: "Pendiente", pt: "Pendente", fr: "En attente", it: "In attesa", uk: "Очікує" })}</span>
                      ) : (
                        <button
                          onClick={() => sendRequest(fighter.id)}
                          className="rounded-md border border-stone-border bg-bg-elevated px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white hover:border-burgundy-light"
                        >
                          {L({ en: "Send Request", es: "Enviar solicitud", pt: "Enviar solicitação", fr: "Envoyer une demande", it: "Invia richiesta", uk: "Надіслати запит" })}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {(nearby.fighters || []).length === 0 && (
                  <div className="rounded-xl border border-dashed border-stone-border bg-bg-card p-5 text-sm text-stone-text">
                    {L({ en: `No fighters found within ${nearby.radiusKm ?? 100} km yet. Check back as more fighters join.`, es: `Aún no se han encontrado luchadores en un radio de ${nearby.radiusKm ?? 100} km. Vuelve pronto.`, pt: `Nenhum lutador encontrado em um raio de ${nearby.radiusKm ?? 100} km ainda. Volte em breve.`, fr: `Aucun combattant trouvé dans un rayon de ${nearby.radiusKm ?? 100} km pour l'instant. Revenez bientôt.`, it: `Nessun combattente trovato entro ${nearby.radiusKm ?? 100} km. Torna presto.`, uk: `Бійців у радіусі ${nearby.radiusKm ?? 100} км поки не знайдено. Завітайте пізніше.` })}
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
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-light">{L({ en: "Incoming Requests", es: "Solicitudes recibidas", pt: "Solicitações recebidas", fr: "Demandes reçues", it: "Richieste ricevute", uk: "Вхідні запити" })}</h3>
              <div className="mt-3 space-y-2">
                {incomingRequests.map((request) => (
                  <div key={request.id} className="rounded-lg border border-stone-border/70 bg-bg-elevated p-3">
                    <p className="text-sm text-white">{request.requester?.profile?.displayName || request.requester?.name}</p>
                    <p className="text-xs text-stone-light">{request.requester?.discipline} · {request.requester?.gymName || L({ en: "No gym", es: "Sin gimnasio", pt: "Sem academia", fr: "Sans salle", it: "Nessuna palestra", uk: "Без зали" })}</p>
                    <div className="mt-2 flex gap-2">
                      <button onClick={() => processRequest(request.id, "accept")} className="rounded bg-burgundy px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">{L({ en: "Accept", es: "Aceptar", pt: "Aceitar", fr: "Accepter", it: "Accetta", uk: "Прийняти" })}</button>
                      <button onClick={() => processRequest(request.id, "reject")} className="rounded border border-stone-border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-stone-light">{L({ en: "Reject", es: "Rechazar", pt: "Rejeitar", fr: "Refuser", it: "Rifiuta", uk: "Відхилити" })}</button>
                    </div>
                  </div>
                ))}
                {incomingRequests.length === 0 && <p className="text-sm text-stone-text">{L({ en: "No incoming requests.", es: "Sin solicitudes recibidas.", pt: "Sem solicitações recebidas.", fr: "Aucune demande reçue.", it: "Nessuna richiesta ricevuta.", uk: "Немає вхідних запитів." })}</p>}
              </div>
            </div>

            <div className="rounded-xl border border-stone-border bg-bg-card p-4">
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-light">{L({ en: "Outgoing Requests", es: "Solicitudes enviadas", pt: "Solicitações enviadas", fr: "Demandes envoyées", it: "Richieste inviate", uk: "Вихідні запити" })}</h3>
              <div className="mt-3 space-y-2">
                {outgoingRequests.map((request) => (
                  <div key={request.id} className="rounded-lg border border-stone-border/70 bg-bg-elevated p-3">
                    <p className="text-sm text-white">{request.receiver?.profile?.displayName || request.receiver?.name}</p>
                    <p className="text-xs text-stone-light">{request.receiver?.discipline} · {request.receiver?.gymName || L({ en: "No gym", es: "Sin gimnasio", pt: "Sem academia", fr: "Sans salle", it: "Nessuna palestra", uk: "Без зали" })}</p>
                    <button onClick={() => processRequest(request.id, "cancel")} className="mt-2 rounded border border-stone-border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-stone-light">{L({ en: "Cancel", es: "Cancelar", pt: "Cancelar", fr: "Annuler", it: "Annulla", uk: "Скасувати" })}</button>
                  </div>
                ))}
                {outgoingRequests.length === 0 && <p className="text-sm text-stone-text">{L({ en: "No outgoing requests.", es: "Sin solicitudes enviadas.", pt: "Sem solicitações enviadas.", fr: "Aucune demande envoyée.", it: "Nessuna richiesta inviata.", uk: "Немає вихідних запитів." })}</p>}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-stone-border bg-bg-card p-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-light">{L({ en: "Connected Fighters", es: "Luchadores conectados", pt: "Lutadores conectados", fr: "Combattants connectés", it: "Combattenti connessi", uk: "З'єднані бійці" })}</h3>
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
                            {friend.gymName || L({ en: "View gym", es: "Ver gimnasio", pt: "Ver academia", fr: "Voir la salle", it: "Vedi palestra", uk: "Переглянути залу" })}
                          </Link>
                        ) : (
                          friend.gymName || L({ en: "No gym", es: "Sin gimnasio", pt: "Sem academia", fr: "Sans salle", it: "Nessuna palestra", uk: "Без зали" })
                        )}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        onClick={() => openChat(friend.id)}
                        className="relative rounded px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider border border-burgundy/50 bg-burgundy/20 text-burgundy-light hover:bg-burgundy/30"
                      >
                        {L({ en: "Message", es: "Mensaje", pt: "Mensagem", fr: "Message", it: "Messaggio", uk: "Повідомлення" })}
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
                        {friend.isTrainingPartner ? L({ en: "Training Partner", es: "Compañero de entreno", pt: "Parceiro de treino", fr: "Partenaire d'entraînement", it: "Partner di allenamento", uk: "Партнер з тренувань" }) : L({ en: "Mark Partner", es: "Marcar compañero", pt: "Marcar parceiro", fr: "Marquer comme partenaire", it: "Segna come partner", uk: "Позначити партнером" })}
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-stone-light">
                    <span className="rounded bg-bg-card px-2 py-1">{L({ en: "Mutual", es: "En común", pt: "Em comum", fr: "En commun", it: "In comune", uk: "Спільне" })}: {friend.mutualFriends}</span>
                    <span className="rounded bg-bg-card px-2 py-1">{L({ en: "Shared disciplines", es: "Disciplinas compartidas", pt: "Disciplinas compartilhadas", fr: "Disciplines partagées", it: "Discipline condivise", uk: "Спільні дисципліни" })}: {friend.sharedDisciplines.length}</span>
                    <span className="rounded bg-bg-card px-2 py-1">{L({ en: "Shared gyms", es: "Gimnasios compartidos", pt: "Academias compartilhadas", fr: "Salles partagées", it: "Palestre condivise", uk: "Спільні зали" })}: {friend.sharedGyms.length}</span>
                    <span className="rounded bg-bg-card px-2 py-1">{L({ en: "Weekly sessions", es: "Sesiones semanales", pt: "Sessões semanais", fr: "Séances hebdomadaires", it: "Sessioni settimanali", uk: "Щотижневі сесії" })}: {friend.weeklySessionCount}</span>
                  </div>
                </div>
              ))}
              {friends.length === 0 && (
                <div className="rounded-lg border border-dashed border-stone-border p-4 text-sm text-stone-text">
                  {L({ en: "No connections yet. Start by sending requests to fighters in your discipline.", es: "Aún no hay conexiones. Empieza enviando solicitudes a luchadores de tu disciplina.", pt: "Ainda não há conexões. Comece enviando solicitações a lutadores da sua disciplina.", fr: "Pas encore de connexions. Commencez par envoyer des demandes à des combattants de votre discipline.", it: "Ancora nessuna connessione. Inizia inviando richieste a combattenti della tua disciplina.", uk: "З'єднань ще немає. Почніть з надсилання запитів бійцям вашої дисципліни." })}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {!loading && tab === "nodes" && (
        <section className="space-y-4">
          <div className="rounded-xl border border-stone-border bg-bg-card p-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-light">{L({ en: "Add Technique Node", es: "Añadir nodo de técnica", pt: "Adicionar nó de técnica", fr: "Ajouter un nœud de technique", it: "Aggiungi nodo tecnica", uk: "Додати вузол техніки" })}</h3>
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
                title={L({ en: "Technique node visibility", es: "Visibilidad del nodo de técnica", pt: "Visibilidade do nó de técnica", fr: "Visibilité du nœud de technique", it: "Visibilità del nodo tecnica", uk: "Видимість вузла техніки" })}
                className="rounded-lg border border-stone-border bg-bg-elevated px-3 py-2 text-sm text-white focus:border-burgundy-light focus:outline-none"
              >
                <option value="private">{L({ en: "Private", es: "Privado", pt: "Privado", fr: "Privé", it: "Privato", uk: "Приватний" })}</option>
                <option value="friends">{L({ en: "Friends", es: "Amigos", pt: "Amigos", fr: "Amis", it: "Amici", uk: "Друзі" })}</option>
                <option value="public">{L({ en: "Public", es: "Público", pt: "Público", fr: "Public", it: "Pubblico", uk: "Публічний" })}</option>
              </select>
              <textarea
                value={nodeForm.description}
                onChange={(e) => setNodeForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder={L({ en: "Key details, cues, and tactical references...", es: "Detalles clave, señales y referencias tácticas...", pt: "Detalhes-chave, sinais e referências táticas...", fr: "Détails clés, repères et références tactiques...", it: "Dettagli chiave, segnali e riferimenti tattici...", uk: "Ключові деталі, підказки та тактичні посилання..." })}
                className="sm:col-span-2 rounded-lg border border-stone-border bg-bg-elevated px-3 py-2 text-sm text-white placeholder:text-stone-text focus:border-burgundy-light focus:outline-none"
                rows={3}
              />
            </div>
            <button
              onClick={createNode}
              disabled={creatingNode}
              className="mt-3 rounded-lg bg-burgundy px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-burgundy-light disabled:opacity-60"
            >
              {creatingNode ? L({ en: "Saving...", es: "Guardando...", pt: "Salvando...", fr: "Enregistrement...", it: "Salvataggio...", uk: "Збереження..." }) : L({ en: "Create Node", es: "Crear nodo", pt: "Criar nó", fr: "Créer le nœud", it: "Crea nodo", uk: "Створити вузол" })}
            </button>
          </div>

          <div className="grid gap-3">
            {nodes.map((node) => (
              <div key={node.id} className="rounded-xl border border-stone-border bg-bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{node.title}</p>
                    <p className="text-xs text-stone-light">
                      {node.discipline || L({ en: "General", es: "General", pt: "Geral", fr: "Général", it: "Generale", uk: "Загальне" })}
                      {node.position ? ` · ${node.position}` : ""}
                      {" · "}
                      {node.visibility}
                    </p>
                    {node.description && <p className="mt-2 text-sm text-stone-light">{node.description}</p>}
                  </div>
                  <span className="rounded bg-bg-elevated px-2 py-1 text-[11px] uppercase tracking-wider text-stone-light">{node.createdBy?.profile?.displayName || node.createdBy?.name || L({ en: "Unknown", es: "Desconocido", pt: "Desconhecido", fr: "Inconnu", it: "Sconosciuto", uk: "Невідомо" })}</span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button onClick={() => toggleNodeLike(node.id)} className={cn("rounded px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider", node.hasLiked ? "bg-burgundy/20 text-burgundy-light" : "border border-stone-border text-stone-light")}>{L({ en: "Like", es: "Me gusta", pt: "Curtir", fr: "J'aime", it: "Mi piace", uk: "Подобається" })} ({node.counts.likes})</button>
                  <button onClick={() => toggleNodeSave(node.id)} className={cn("rounded px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider", node.hasSaved ? "bg-burgundy/20 text-burgundy-light" : "border border-stone-border text-stone-light")}>{L({ en: "Save", es: "Guardar", pt: "Salvar", fr: "Enregistrer", it: "Salva", uk: "Зберегти" })} ({node.counts.saves})</button>
                  <span className="rounded bg-bg-elevated px-2 py-1 text-[11px] text-stone-light">{L({ en: "Comments", es: "Comentarios", pt: "Comentários", fr: "Commentaires", it: "Commenti", uk: "Коментарі" })}: {node.counts.comments}</span>
                </div>
              </div>
            ))}
            {nodes.length === 0 && (
              <div className="rounded-xl border border-dashed border-stone-border bg-bg-card p-5 text-sm text-stone-text">
                {L({ en: "No technique nodes yet. Add your first knowledge node privately, then share with friends.", es: "Aún no hay nodos de técnica. Añade el primero en privado y compártelo con tus amigos.", pt: "Ainda não há nós de técnica. Adicione o primeiro em modo privado e compartilhe com seus amigos.", fr: "Pas encore de nœuds de technique. Ajoutez le premier en privé, puis partagez-le avec vos amis.", it: "Ancora nessun nodo tecnica. Aggiungi il primo in privato, poi condividilo con i tuoi amici.", uk: "Вузлів техніки ще немає. Додайте перший приватно, а потім поділіться з друзями." })}
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
          L({ en: "Message", es: "Mensaje", pt: "Mensagem", fr: "Message", it: "Messaggio", uk: "Повідомлення" })
        }
        className="max-w-md"
      >
        <div className="flex h-[420px] flex-col">
          <div className="flex-1 space-y-2 overflow-y-auto p-4">
            {chatLoading && <p className="text-sm text-stone-text">{L({ en: "Loading...", es: "Cargando...", pt: "Carregando...", fr: "Chargement...", it: "Caricamento...", uk: "Завантаження..." })}</p>}
            {!chatLoading && chatMessages.length === 0 && (
              <p className="text-sm text-stone-text">{L({ en: "No messages yet. Say hi!", es: "Aún no hay mensajes. ¡Saluda!", pt: "Ainda não há mensagens. Diga oi!", fr: "Pas encore de messages. Dites bonjour !", it: "Ancora nessun messaggio. Saluta!", uk: "Повідомлень ще немає. Привітайся!" })}</p>
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
                      {new Date(message.createdAt).toLocaleTimeString(
                        { en: "en-US", es: "es-ES", pt: "pt-BR", fr: "fr-FR", it: "it-IT", uk: "uk-UA" }[locale] ?? "en-US",
                        { hour: "2-digit", minute: "2-digit" }
                      )}
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
              placeholder={L({ en: "Write a message...", es: "Escribe un mensaje...", pt: "Escreva uma mensagem...", fr: "Écrivez un message...", it: "Scrivi un messaggio...", uk: "Напишіть повідомлення..." })}
              className="flex-1 rounded-lg border border-stone-border bg-bg-elevated px-3 py-2 text-sm text-white placeholder:text-stone-text focus:border-burgundy-light focus:outline-none"
            />
            <button
              onClick={sendChatMessage}
              disabled={sendingChat || !chatInput.trim()}
              className="rounded-lg bg-burgundy px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-burgundy-light disabled:opacity-60"
            >
              {L({ en: "Send", es: "Enviar", pt: "Enviar", fr: "Envoyer", it: "Invia", uk: "Надіслати" })}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
