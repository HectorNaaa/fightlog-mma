"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type TabKey = "feed" | "fighters" | "partners" | "nodes";

interface Friend {
  id: string;
  friendshipId: string;
  name: string;
  gymName?: string | null;
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

export default function CommunityPage() {
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
      setFeed(feedData);
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

  const filteredFighters = useMemo(() => {
    if (!search.trim()) return fighters;
    const q = search.toLowerCase();
    return fighters.filter((fighter) => {
      const display = fighter.profile?.displayName || fighter.name;
      return (
        fighter.name.toLowerCase().includes(q) ||
        display.toLowerCase().includes(q) ||
        (fighter.profile?.username || "").toLowerCase().includes(q) ||
        fighter.primaryDiscipline.toLowerCase().includes(q)
      );
    });
  }, [fighters, search]);

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
        <h1 className="font-condensed text-2xl font-black uppercase tracking-[0.14em] text-white">Community</h1>
        <p className="mt-1 text-sm text-stone-light">Train smarter. Build your fight brain.</p>
        <p className="text-xs text-stone-text">Learning network for fighters, not vanity engagement.</p>
      </header>

      <div className="grid gap-2 rounded-xl border border-stone-border bg-bg-card p-2 sm:grid-cols-4">
        {([
          { key: "feed", label: "Learning Feed" },
          { key: "fighters", label: "Find Fighters" },
          { key: "partners", label: "Partners" },
          { key: "nodes", label: "Technique Graph" },
        ] as Array<{ key: TabKey; label: string }>).map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={cn(
              "rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition-colors",
              tab === item.key
                ? "bg-burgundy text-white"
                : "text-stone-light hover:bg-bg-elevated hover:text-white"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error && <div className="rounded-lg border border-red-900/40 bg-red-950/30 px-3 py-2 text-sm text-red-300">{error}</div>}
      {loading && <div className="text-sm text-stone-text">Loading community intelligence...</div>}

      {!loading && tab === "feed" && (
        <section className="space-y-4">
          <div className="rounded-xl border border-stone-border bg-bg-card p-4">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-stone-light">Network Activity</h2>
            <div className="space-y-2">
              {(feed?.events || []).slice(0, 12).map((event) => (
                <div key={event.id} className="rounded-lg border border-stone-border/70 bg-bg-elevated p-3">
                  <p className="text-sm text-white">
                    <span className="font-semibold text-burgundy-light">{event.user.profile?.displayName || event.user.name}</span>{" "}
                    {event.message}
                  </p>
                  <p className="mt-1 text-[11px] uppercase tracking-wider text-stone-text">{new Date(event.createdAt).toLocaleString()}</p>
                </div>
              ))}
              {(!feed?.events || feed.events.length === 0) && (
                <div className="rounded-lg border border-dashed border-stone-border p-4 text-sm text-stone-text">
                  No activity yet. Add friends and share a technique node to kickstart your learning network.
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-stone-border bg-bg-card p-4">
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-light">Fighters You May Know</h3>
              <div className="mt-3 space-y-2">
                {(feed?.recommendations.fightersYouMayKnow || []).slice(0, 5).map((fighter) => (
                  <div key={fighter.id} className="rounded-lg border border-stone-border/70 bg-bg-elevated p-3">
                    <p className="text-sm font-semibold text-white">{fighter.profile?.displayName || fighter.name}</p>
                    <p className="text-xs text-stone-light">{fighter.primaryDiscipline} · {fighter.gymName || "Independent"}</p>
                  </div>
                ))}
                {(feed?.recommendations.fightersYouMayKnow || []).length === 0 && (
                  <p className="text-sm text-stone-text">Recommendations appear as your network grows.</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-stone-border bg-bg-card p-4">
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-light">Popular In Your Network</h3>
              <div className="mt-3 space-y-2">
                {(feed?.recommendations.popularTechniqueNodes || []).slice(0, 5).map((node) => (
                  <div key={node.id} className="rounded-lg border border-stone-border/70 bg-bg-elevated p-3">
                    <p className="text-sm font-semibold text-white">{node.title}</p>
                    <p className="text-xs text-stone-light">{node.discipline || "General"} · {node.saves} saves · {node.likes} likes</p>
                  </div>
                ))}
                {(feed?.recommendations.popularTechniqueNodes || []).length === 0 && (
                  <p className="text-sm text-stone-text">No popular nodes yet. Add your first one in Technique Graph.</p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {!loading && tab === "fighters" && (
        <section className="space-y-4">
          <div className="rounded-xl border border-stone-border bg-bg-card p-4">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-stone-light">Search fighters</label>
            <div className="flex gap-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name, username, discipline"
                className="flex-1 rounded-lg border border-stone-border bg-bg-elevated px-3 py-2 text-sm text-white placeholder:text-stone-text focus:border-burgundy-light focus:outline-none"
              />
              <button
                onClick={() => loadAll(search)}
                className="rounded-lg bg-burgundy px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-burgundy-light"
              >
                Search
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
                      @{fighter.profile?.username || fighter.name.toLowerCase().replace(/\s+/g, "")}
                      {" · "}
                      {fighter.primaryDiscipline}
                    </p>
                    <p className="mt-1 text-xs text-stone-text">
                      {fighter.gymName || "No gym listed"}
                      {fighter.profile?.city ? ` · ${fighter.profile.city}` : ""}
                    </p>
                  </div>

                  {fighter.isFriend ? (
                    <span className="rounded-md border border-burgundy/50 bg-burgundy/20 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-burgundy-light">Connected</span>
                  ) : (
                    <button
                      onClick={() => sendRequest(fighter.id)}
                      className="rounded-md border border-stone-border bg-bg-elevated px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white hover:border-burgundy-light"
                    >
                      Send Request
                    </button>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-stone-light">
                  <span className="rounded bg-bg-elevated px-2 py-1">Mutual friends: {fighter.mutualFriends}</span>
                  <span className="rounded bg-bg-elevated px-2 py-1">Shared disciplines: {fighter.sharedDisciplines.length}</span>
                  <span className="rounded bg-bg-elevated px-2 py-1">Shared gyms: {fighter.sharedGyms.length}</span>
                </div>
              </div>
            ))}
            {filteredFighters.length === 0 && (
              <div className="rounded-xl border border-dashed border-stone-border bg-bg-card p-5 text-sm text-stone-text">
                No fighters found yet. Try a discipline or username search.
              </div>
            )}
          </div>
        </section>
      )}

      {!loading && tab === "partners" && (
        <section className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-stone-border bg-bg-card p-4">
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-light">Incoming Requests</h3>
              <div className="mt-3 space-y-2">
                {incomingRequests.map((request) => (
                  <div key={request.id} className="rounded-lg border border-stone-border/70 bg-bg-elevated p-3">
                    <p className="text-sm text-white">{request.requester?.profile?.displayName || request.requester?.name}</p>
                    <p className="text-xs text-stone-light">{request.requester?.discipline} · {request.requester?.gymName || "No gym"}</p>
                    <div className="mt-2 flex gap-2">
                      <button onClick={() => processRequest(request.id, "accept")} className="rounded bg-burgundy px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">Accept</button>
                      <button onClick={() => processRequest(request.id, "reject")} className="rounded border border-stone-border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-stone-light">Reject</button>
                    </div>
                  </div>
                ))}
                {incomingRequests.length === 0 && <p className="text-sm text-stone-text">No incoming requests.</p>}
              </div>
            </div>

            <div className="rounded-xl border border-stone-border bg-bg-card p-4">
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-light">Outgoing Requests</h3>
              <div className="mt-3 space-y-2">
                {outgoingRequests.map((request) => (
                  <div key={request.id} className="rounded-lg border border-stone-border/70 bg-bg-elevated p-3">
                    <p className="text-sm text-white">{request.receiver?.profile?.displayName || request.receiver?.name}</p>
                    <p className="text-xs text-stone-light">{request.receiver?.discipline} · {request.receiver?.gymName || "No gym"}</p>
                    <button onClick={() => processRequest(request.id, "cancel")} className="mt-2 rounded border border-stone-border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-stone-light">Cancel</button>
                  </div>
                ))}
                {outgoingRequests.length === 0 && <p className="text-sm text-stone-text">No outgoing requests.</p>}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-stone-border bg-bg-card p-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-light">Connected Fighters</h3>
            <div className="mt-3 grid gap-2">
              {friends.map((friend) => (
                <div key={friend.friendshipId} className="rounded-lg border border-stone-border/70 bg-bg-elevated p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{friend.name}</p>
                      <p className="text-xs text-stone-light">{friend.primaryDiscipline} · {friend.gymName || "No gym"}</p>
                    </div>
                    <button
                      onClick={() => toggleTrainingPartner(friend.friendshipId, friend.isTrainingPartner)}
                      className={cn(
                        "rounded px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider",
                        friend.isTrainingPartner
                          ? "border border-burgundy/50 bg-burgundy/20 text-burgundy-light"
                          : "border border-stone-border text-stone-light"
                      )}
                    >
                      {friend.isTrainingPartner ? "Training Partner" : "Mark Partner"}
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-stone-light">
                    <span className="rounded bg-bg-card px-2 py-1">Mutual: {friend.mutualFriends}</span>
                    <span className="rounded bg-bg-card px-2 py-1">Shared disciplines: {friend.sharedDisciplines.length}</span>
                    <span className="rounded bg-bg-card px-2 py-1">Shared gyms: {friend.sharedGyms.length}</span>
                    <span className="rounded bg-bg-card px-2 py-1">Weekly sessions: {friend.weeklySessionCount}</span>
                  </div>
                </div>
              ))}
              {friends.length === 0 && (
                <div className="rounded-lg border border-dashed border-stone-border p-4 text-sm text-stone-text">
                  No connections yet. Start by sending requests to fighters in your discipline.
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {!loading && tab === "nodes" && (
        <section className="space-y-4">
          <div className="rounded-xl border border-stone-border bg-bg-card p-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-light">Add Technique Node</h3>
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
                title="Technique node visibility"
                className="rounded-lg border border-stone-border bg-bg-elevated px-3 py-2 text-sm text-white focus:border-burgundy-light focus:outline-none"
              >
                <option value="private">Private</option>
                <option value="friends">Friends</option>
                <option value="public">Public</option>
              </select>
              <textarea
                value={nodeForm.description}
                onChange={(e) => setNodeForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Key details, cues, and tactical references..."
                className="sm:col-span-2 rounded-lg border border-stone-border bg-bg-elevated px-3 py-2 text-sm text-white placeholder:text-stone-text focus:border-burgundy-light focus:outline-none"
                rows={3}
              />
            </div>
            <button
              onClick={createNode}
              disabled={creatingNode}
              className="mt-3 rounded-lg bg-burgundy px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-burgundy-light disabled:opacity-60"
            >
              {creatingNode ? "Saving..." : "Create Node"}
            </button>
          </div>

          <div className="grid gap-3">
            {nodes.map((node) => (
              <div key={node.id} className="rounded-xl border border-stone-border bg-bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{node.title}</p>
                    <p className="text-xs text-stone-light">
                      {node.discipline || "General"}
                      {node.position ? ` · ${node.position}` : ""}
                      {" · "}
                      {node.visibility}
                    </p>
                    {node.description && <p className="mt-2 text-sm text-stone-light">{node.description}</p>}
                  </div>
                  <span className="rounded bg-bg-elevated px-2 py-1 text-[11px] uppercase tracking-wider text-stone-light">{node.createdBy.profile?.displayName || node.createdBy.name}</span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button onClick={() => toggleNodeLike(node.id)} className={cn("rounded px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider", node.hasLiked ? "bg-burgundy/20 text-burgundy-light" : "border border-stone-border text-stone-light")}>Like ({node.counts.likes})</button>
                  <button onClick={() => toggleNodeSave(node.id)} className={cn("rounded px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider", node.hasSaved ? "bg-burgundy/20 text-burgundy-light" : "border border-stone-border text-stone-light")}>Save ({node.counts.saves})</button>
                  <span className="rounded bg-bg-elevated px-2 py-1 text-[11px] text-stone-light">Comments: {node.counts.comments}</span>
                </div>
              </div>
            ))}
            {nodes.length === 0 && (
              <div className="rounded-xl border border-dashed border-stone-border bg-bg-card p-5 text-sm text-stone-text">
                No technique nodes yet. Add your first knowledge node privately, then share with friends.
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
