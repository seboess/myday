"use client";

import { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import type { DeadlineType } from "@/lib/types";
import { DEADLINE_TYPE_LABELS } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus, CheckCircle2, CalendarClock, Paperclip, ChevronDown } from "lucide-react";
import { MaterialUpload } from "@/components/material-upload";

const DEADLINE_TYPES: DeadlineType[] = [
  "klausur",
  "hausaufgabe",
  "referat",
  "abgabe",
];

const TYPE_COLORS: Record<DeadlineType, string> = {
  klausur:
    "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  hausaufgabe:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  referat:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  abgabe:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
};

function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("de-DE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function urgencyBorder(dateStr: string): string {
  const days = daysUntil(dateStr);
  if (days < 0) return "border-l-4 border-l-neutral-400 opacity-60";
  if (days < 3) return "border-l-4 border-l-red-500";
  if (days < 7) return "border-l-4 border-l-orange-400";
  return "border-l-4 border-l-transparent";
}

export default function DeadlinesPage() {
  const subjects = useStore((s) => s.subjects);
  const deadlines = useStore((s) => s.deadlines);
  const addDeadline = useStore((s) => s.addDeadline);
  const removeDeadline = useStore((s) => s.removeDeadline);
  const materials = useStore((s) => s.materials);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [expandedMaterials, setExpandedMaterials] = useState<Set<string>>(new Set());

  // Filters
  const [filterType, setFilterType] = useState<DeadlineType | "all">("all");
  const [filterSubject, setFilterSubject] = useState<string>("all");

  // Form state
  const [formSubjectId, setFormSubjectId] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formType, setFormType] = useState<DeadlineType>("hausaufgabe");
  const [formDate, setFormDate] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const filtered = useMemo(() => {
    let list = [...deadlines];
    if (filterType !== "all") list = list.filter((d) => d.type === filterType);
    if (filterSubject !== "all")
      list = list.filter((d) => d.subjectId === filterSubject);
    list.sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
    return list;
  }, [deadlines, filterType, filterSubject]);

  function openNewDialog() {
    setFormSubjectId(subjects[0]?.id ?? "");
    setFormTitle("");
    setFormType("hausaufgabe");
    setFormDate("");
    setFormNotes("");
    setDialogOpen(true);
  }

  function handleAdd() {
    if (!formSubjectId || !formTitle.trim() || !formDate) return;
    addDeadline(
      formSubjectId,
      formTitle.trim(),
      formType,
      formDate,
      formNotes.trim() || undefined
    );
    setDialogOpen(false);
  }

  function toggleMaterials(id: string) {
    setExpandedMaterials((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function getMaterialCount(deadlineId: string): number {
    return materials.filter(
      (m) => m.linkedTo.type === "deadline" && m.linkedTo.id === deadlineId
    ).length;
  }

  function handleDelete(id: string) {
    removeDeadline(id);
    setConfirmDeleteId(null);
  }

  if (subjects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <CalendarClock className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">
          Erstelle zuerst Faecher, um Deadlines anlegen zu koennen.
        </p>
        <a href="/einstellungen">
          <Button variant="outline">Zu den Einstellungen</Button>
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Deadlines</h1>
        <Button onClick={openNewDialog} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Neue Deadline
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select
          value={filterType}
          onValueChange={(v) => v && setFilterType(v as DeadlineType | "all")}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Typ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Typen</SelectItem>
            {DEADLINE_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {DEADLINE_TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterSubject} onValueChange={(v) => v && setFilterSubject(v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Fach" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Faecher</SelectItem>
            {subjects.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Deadline list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <CalendarClock className="h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">
            Keine Deadlines. Erstelle eine neue!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((d) => {
            const subject = subjects.find((s) => s.id === d.subjectId);
            const days = daysUntil(d.dueDate);
            return (
              <Card key={d.id} className={urgencyBorder(d.dueDate)}>
                <CardContent className="flex items-start gap-4 p-4">
                  {/* Date badge */}
                  <div className="flex min-w-[70px] flex-col items-center rounded-lg bg-muted px-3 py-2 text-center">
                    <span className="text-xs text-muted-foreground">
                      {days < 0
                        ? "Vorbei"
                        : days === 0
                        ? "Heute"
                        : days === 1
                        ? "Morgen"
                        : `${days} Tage`}
                    </span>
                    <span className="text-sm font-semibold">
                      {new Date(d.dueDate + "T00:00:00").toLocaleDateString(
                        "de-DE",
                        { day: "numeric", month: "short" }
                      )}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={TYPE_COLORS[d.type]}
                      >
                        {DEADLINE_TYPE_LABELS[d.type]}
                      </Badge>
                      {subject && (
                        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: subject.color }}
                          />
                          {subject.name}
                        </span>
                      )}
                    </div>
                    <p className="font-medium">{d.title}</p>
                    {d.notes && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {d.notes}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatDate(d.dueDate)}
                    </p>

                    {/* Materials toggle */}
                    <button
                      type="button"
                      onClick={() => toggleMaterials(d.id)}
                      className="mt-1.5 flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                    >
                      <Paperclip className="h-3 w-3" />
                      <span>Materialien ({getMaterialCount(d.id)})</span>
                      <ChevronDown
                        className={`h-3 w-3 transition-transform ${
                          expandedMaterials.has(d.id) ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {expandedMaterials.has(d.id) && (
                      <div className="mt-2">
                        <MaterialUpload
                          linkedTo={{ type: "deadline", id: d.id }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-emerald-600 hover:text-emerald-700"
                      title="Erledigt"
                      onClick={() => removeDeadline(d.id)}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      title="Loeschen"
                      onClick={() => setConfirmDeleteId(d.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* New Deadline Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neue Deadline</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Fach</Label>
              <Select value={formSubjectId} onValueChange={(v) => v && setFormSubjectId(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Fach waehlen" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <span className="flex items-center gap-2">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: s.color }}
                        />
                        {s.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Titel</Label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="z.B. Mathe Klausur Kapitel 5"
              />
            </div>

            <div className="space-y-2">
              <Label>Typ</Label>
              <Select
                value={formType}
                onValueChange={(v) => v && setFormType(v as DeadlineType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEADLINE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {DEADLINE_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Datum</Label>
              <Input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Notizen (optional)</Label>
              <Textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Weitere Details..."
                rows={3}
              />
            </div>

            <Button
              onClick={handleAdd}
              className="w-full"
              disabled={!formSubjectId || !formTitle.trim() || !formDate}
            >
              Deadline erstellen
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog
        open={!!confirmDeleteId}
        onOpenChange={() => setConfirmDeleteId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deadline loeschen?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Diese Deadline wird unwiderruflich geloescht.
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setConfirmDeleteId(null)}
            >
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}
            >
              Loeschen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
