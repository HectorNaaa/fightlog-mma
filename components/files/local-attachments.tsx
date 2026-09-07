"use client";
import { useEffect, useRef, useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import { getDeviceId, getDeviceName } from "@/lib/device";
import { saveLocalFile, getLocalFile, deleteLocalFile } from "@/lib/local-files";
import { formatDateInput } from "@/lib/utils";

type Section = "training" | "social" | "technical" | "performance" | "account";

interface AttachmentItem {
  id: string;
  kind: "document" | "media";
  fileName: string;
  fileType: string;
  fileSize: number;
  date: string;
  note?: string | null;
  deviceId: string;
  deviceName: string;
  hasFile?: boolean;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

// Only PDF/Excel are allowed for the routine document (small, uploaded to
// the server so it's available on every device). Photos/videos are always
// media, saved only on this device.
const DOC_ACCEPT =
  ".pdf,.xls,.xlsx,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const MEDIA_ACCEPT = "image/*,video/*";
const MAX_DOC_BYTES = 15 * 1024 * 1024;

/**
 * Lets the user attach a routine file (PDF/Excel) or exercise photos/videos
 * to one of the app's 5 sections, with a date and a note. Routine documents
 * are small so their actual bytes ARE uploaded and stored server-side
 * (available on every device). Photos/videos are saved ONLY in this
 * browser's IndexedDB (see lib/local-files.ts) — never uploaded — so they
 * cost zero Vercel storage no matter how many/large they are. Media saves
 * ask the user to confirm the device first; each media entry shows which
 * device holds it.
 */
export function LocalAttachments({ section }: { section: Section }) {
  const { t } = useLanguage();
  const at = t.attachments;
  const [items, setItems] = useState<AttachmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [availability, setAvailability] = useState<Record<string, boolean>>({});
  const blobUrlsRef = useRef<Record<string, string>>({});
  const docInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const deviceIdRef = useRef<string>("");
  const deviceNameRef = useRef<string>("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/attachments?section=${section}`);
      const data = await res.json();
      const list: AttachmentItem[] = Array.isArray(data) ? data : [];
      setItems(list);
      const avail: Record<string, boolean> = {};
      for (const item of list) {
        if (item.kind === "document" && item.hasFile) continue; // stored server-side, no local lookup needed
        if (item.deviceId === deviceIdRef.current) {
          const blob = await getLocalFile(item.id);
          avail[item.id] = !!blob;
        } else {
          avail[item.id] = false;
        }
      }
      setAvailability(avail);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    deviceIdRef.current = getDeviceId();
    deviceNameRef.current = getDeviceName();
    load();
    const urls = blobUrlsRef.current;
    return () => {
      Object.values(urls).forEach((u) => URL.revokeObjectURL(u));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section]);

  const handleDocumentFile = async (file: File) => {
    const lower = file.name.toLowerCase();
    if (!/\.(pdf|xls|xlsx)$/.test(lower)) {
      window.alert(at.docTypeError);
      return;
    }
    if (file.size > MAX_DOC_BYTES) {
      window.alert(at.docSizeError);
      return;
    }
    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("section", section);
      form.append("date", formatDateInput(new Date()));
      form.append("deviceId", deviceIdRef.current);
      form.append("deviceName", deviceNameRef.current);
      const res = await fetch("/api/attachments", { method: "POST", body: form });
      if (!res.ok) throw new Error("Failed to upload document");
      await load();
    } catch {
      window.alert(at.saveError);
    } finally {
      setBusy(false);
    }
  };

  const handleMediaFile = async (file: File) => {
    const confirmMsg = at.confirmLocalSave.replace("{device}", deviceNameRef.current);
    if (!window.confirm(confirmMsg)) return;

    setBusy(true);
    try {
      const res = await fetch("/api/attachments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section,
          kind: "media",
          fileName: file.name,
          fileType: file.type || "application/octet-stream",
          fileSize: file.size,
          date: formatDateInput(new Date()),
          deviceId: deviceIdRef.current,
          deviceName: deviceNameRef.current,
        }),
      });
      if (!res.ok) throw new Error("Failed to save attachment metadata");
      const created = await res.json();
      try {
        await saveLocalFile(created.id, file);
      } catch (err) {
        await fetch(`/api/attachments/${created.id}`, { method: "DELETE" });
        const isQuota = err instanceof DOMException && err.name === "QuotaExceededError";
        window.alert(isQuota ? at.quotaError : at.saveError);
        return;
      }
      await load();
    } catch {
      window.alert(at.saveError);
    } finally {
      setBusy(false);
    }
  };

  const openFile = async (item: AttachmentItem) => {
    if (item.kind === "document" && item.hasFile) {
      window.open(`/api/attachments/${item.id}/download`, "_blank", "noopener,noreferrer");
      return;
    }
    let url = blobUrlsRef.current[item.id];
    if (!url) {
      const blob = await getLocalFile(item.id);
      if (!blob) return;
      url = URL.createObjectURL(blob);
      blobUrlsRef.current[item.id] = url;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const updateField = async (id: string, patch: { date?: string; note?: string }) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
    await fetch(`/api/attachments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  };

  const remove = async (item: AttachmentItem) => {
    if (!window.confirm(at.deleteConfirm)) return;
    await fetch(`/api/attachments/${item.id}`, { method: "DELETE" });
    await deleteLocalFile(item.id);
    setItems((prev) => prev.filter((i) => i.id !== item.id));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-stone-text">{at.title}</h2>
            <p className="text-[11px] text-stone-text/70 mt-0.5 max-w-md">{at.subtitle}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="secondary" size="sm" disabled={busy} onClick={() => docInputRef.current?.click()}>
              {at.addDocument}
            </Button>
            <Button variant="secondary" size="sm" disabled={busy} onClick={() => mediaInputRef.current?.click()}>
              {at.addMedia}
            </Button>
          </div>
          <input
            ref={docInputRef}
            type="file"
            accept={DOC_ACCEPT}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleDocumentFile(file);
              e.target.value = "";
            }}
          />
          <input
            ref={mediaInputRef}
            type="file"
            accept={MEDIA_ACCEPT}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleMediaFile(file);
              e.target.value = "";
            }}
          />
        </div>
      </CardHeader>
      <CardBody>
        {loading ? (
          <div className="text-xs text-stone-text">…</div>
        ) : items.length === 0 ? (
          <div className="text-xs text-stone-text py-4 text-center">{at.empty}</div>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map((item) => {
              const isServerFile = item.kind === "document" && !!item.hasFile;
              const isThisDevice = item.deviceId === deviceIdRef.current;
              const canView = isServerFile || !!availability[item.id];
              return (
                <div key={item.id} className="border border-stone-border rounded-sm p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-beige-warm truncate">{item.fileName}</div>
                      <div className="text-[11px] text-stone-text">
                        {at.size}: {formatSize(item.fileSize)} · {item.fileType || "—"}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {canView && (
                        <Button variant="ghost" size="sm" onClick={() => openFile(item)}>{at.view}</Button>
                      )}
                      <Button variant="danger" size="sm" onClick={() => remove(item)}>{at.delete}</Button>
                    </div>
                  </div>
                  <div className="text-[11px]">
                    {isServerFile ? (
                      <span className="text-stone-text">{at.storedOnServer}</span>
                    ) : isThisDevice ? (
                      <span className="text-stone-text">{at.savedOn}: {item.deviceName} ({at.thisDevice})</span>
                    ) : (
                      <span className="text-burgundy-light">{at.notAvailableDevice.replace("{device}", item.deviceName)}</span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={formatDateInput(item.date)}
                      onChange={(e) => updateField(item.id, { date: e.target.value })}
                      className="bg-bg-elevated border border-stone-border rounded-sm px-2 py-1 text-xs text-beige-warm focus:outline-none focus:border-amber"
                    />
                    <input
                      type="text"
                      defaultValue={item.note ?? ""}
                      placeholder={at.notePlaceholder}
                      onBlur={(e) => {
                        if (e.target.value !== (item.note ?? "")) updateField(item.id, { note: e.target.value });
                      }}
                      className="bg-bg-elevated border border-stone-border rounded-sm px-2 py-1 text-xs text-beige-warm placeholder:text-stone-text/50 focus:outline-none focus:border-amber"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
