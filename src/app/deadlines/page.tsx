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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus, CheckCircle2, CalendarClock, Paperclip, ChevronDown, Undo2 } from "lucide-react";
import { MaterialUpload } from "@/components/material-upload";

const DEADLINE_TYPES: DeadlineType[] = [
  "klausur",
  "test",
  "lek",
  "hausaufgabe",
  "referat",
  "abgabe",
];

const TYPE_COLORS: Record<DeadlineType, string> = {
  klausur: "bg-red-50 text-red-700",
  test: "bg-orange-50 text-orange-700",
  lek: "bg-pink-50 text-pink-700",
  hausaufgabe: "bg-blue-50 text-blue-700",
  referat: "bg-purple-50 text-purple-700",
  abgabe: "bg-amber-50 text-amber-700",
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

function urgencyAccent(dateStr: string): string {
  const days = daysUntil(dateStr);
  if (days < 0) return "opacity-60";
  if (days < 3) return "border-l-4 border-l-red-400 rounded-l-2xl";
  if (days < 7) return "border-l-4 border-l-amber-400 rounded-l-2xl";
  return "";
}

export default function DeadlinesPage() {
  const subjects = useStore((s) => s.subjects);
  const deadlines = useStore((s) => s.deadlines);
  const addDeadline = useStore((s) => s.addDeadline);
  const removeDeadline = useStore((s) => s.removeDeadline);
  const completeDeadline = useStore((s) => s.completeDeadline);
  const uncompleteDeadline = useStore((s) => s.uncompleteDeadline);
  const materials = useStore((s) => s.materials);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [expandedMaterials, setExpandedMaterials] = useState<Set<string>>(new Set());
  const [showCompleted, setShowCompleted] = useState(false);

  // Filters
  const [filterType, setFilterType] = useState<DeadlineType | "all">("all");
  const [filterSubject, setFilterSubject] = useState<string>("all");

  // Form state
  const [formSubjectId, setFormSubjectId] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formType, setFormType] = useState<DeadlineType>("hausaufgabe");
  const [formDate, setFormDate] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const activeDeadlines = useMemo(() => {
    let list = deadlines.filter((d) => !d.done);
    if (filterType !== "all") list = list.filter((d) => d.type === filterType);
    if (filterSubject !== "all")
      list = list.filter((d) => d.subjectId === filterSubject);
    list.sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
    return list;
  }, [deadlines, filterType, filterSubject]);

  const completedDeadlines = useMemo(() => {
    let list = deadlines.filter((d) => d.done);
    if (filterType !== "all") list = list.filter((d) => d.type === filterType);
    if (filterSubject !== "all")
      list = list.filter((d) => d.subjectId === filterSubject);
    list.sort(
      (a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
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
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center px-4">
        <CalendarClock className="h-12 w-12 text-stone-300" />
        <p className="text-stone-500">
          Erstelle zuerst Faecher, um Deadlines anlegen zu koennen.
        </p>
        <a href="/einstellungen">
          <button className="bg-stone-100 text-stone-700 rounded-xl px-5 py-2.5 font-medium hover:bg-stone-200 transition-colors">
            Zu den Einstellungen
          </button>
        </a>
      </div>
    );
  }

  return (
    <div className="px-4 pb-24 pt-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-stone-900">Deadlines</h1>
        <button
          onClick={openNewDialog}
          className="bg-stone-900 text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-stone-800 transition-colors flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Neue Deadline
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select
          value={filterType}
          onValueChange={(v) => v && setFilterType(v as DeadlineType | "all")}
        >
          <SelectTrigger className="w-[160px] rounded-xl border-stone-200">
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
          <SelectTrigger className="w-[180px] rounded-xl border-stone-200">
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

      {/* Active deadline list */}
      {activeDeadlines.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <CalendarClock className="h-10 w-10 text-stone-300" />
          <p className="text-stone-400">
            Keine offenen Deadlines. Erstelle eine neue!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeDeadlines.map((d) => {
            const subject = subjects.find((s) => s.id === d.subjectId);
            const days = daysUntil(d.dueDate);
            return (
              <div key={d.id} className={`bg-stone-50 rounded-2xl p-4 ${urgencyAccent(d.dueDate)}`}>
                <div className="flex items-start gap-4">
                  {/* Date badge */}
                  <div className="flex min-w-[70px] flex-col items-center rounded-xl bg-stone-100 px-3 py-2 text-center">
                    <span className="text-xs text-stone-500">
                      {days < 0
                        ? "Vorbei"
                        : days === 0
                        ? "Heute"
                        : days === 1
                        ? "Morgen"
                        : `${days} Tage`}
                    </span>
                    <span className="text-sm font-semibold text-stone-800 tabular-nums">
                      {new Date(d.dueDate + "T00:00:00").toLocaleDateString(
                        "de-DE",
                        { day: "numeric", month: "short" }
                      )}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TYPE_COLORS[d.type]}`}
                      >
                        {DEADLINE_TYPE_LABELS[d.type]}
                      </span>
                      {subject && (
                        <span className="flex items-center gap-1.5 text-sm text-stone-500">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: subject.color }}
                          />
                          {subject.name}
                        </span>
                      )}
                    </div>
                    <p className="font-medium text-stone-800">{d.title}</p>
                    {d.notes && (
                      <p className="text-sm text-stone-500 line-clamp-2">
                        {d.notes}
                      </p>
                    )}
                    <p className="text-xs text-stone-400">
                      {formatDate(d.dueDate)}
                    </p>

                    {/* Materials toggle */}
                    <button
                      type="button"
                      onClick={() => toggleMaterials(d.id)}
                      className="mt-1.5 flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800"
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
                    <button
                      className="h-8 w-8 flex items-center justify-center rounded-full text-green-600 hover:bg-green-50 transition-colors"
                      title="Erledigt"
                      onClick={() => completeDeadline(d.id)}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </button>
                    <button
                      className="h-8 w-8 flex items-center justify-center rounded-full text-red-500 hover:bg-red-50 transition-colors"
                      title="Loeschen"
                      onClick={() => setConfirmDeleteId(d.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Completed deadlines section */}
      {completedDeadlines.length > 0 && (
        <div className="space-y-3">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-stone-700 transition-colors"
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform ${showCompleted ? "rotate-180" : ""}`}
            />
            Erledigt ({completedDeadlines.length})
          </button>

          {showCompleted && (
            <div className="space-y-3">
              {completedDeadlines.map((d) => {
                const subject = subjects.find((s) => s.id === d.subjectId);
                return (
                  <div key={d.id} className="bg-stone-50/60 rounded-2xl p-4 opacity-70">
                    <div className="flex items-start gap-4">
                      <div className="flex min-w-[70px] flex-col items-center rounded-xl bg-green-50 px-3 py-2 text-center">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-xs font-medium text-green-700 mt-0.5">
                          Erledigt
                        </span>
                      </div>

                      <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TYPE_COLORS[d.type]}`}
                          >
                            {DEADLINE_TYPE_LABELS[d.type]}
                          </span>
                          {subject && (
                            <span className="flex items-center gap-1.5 text-sm text-stone-500">
                              <span
                                className="inline-block h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: subject.color }}
                              />
                              {subject.name}
                            </span>
                          )}
                        </div>
                        <p className="font-medium text-stone-600 line-through">{d.title}</p>
                        <p className="text-xs text-stone-400">
                          {formatDate(d.dueDate)}
                        </p>
                      </div>

                      <div className="flex flex-col gap-1">
                        <button
                          className="h-8 w-8 flex items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 transition-colors"
                          title="Wiederherstellen"
                          onClick={() => uncompleteDeadline(d.id)}
                        >
                          <Undo2 className="h-4 w-4" />
                        </button>
                        <button
                          className="h-8 w-8 flex items-center justify-center rounded-full text-red-400 hover:bg-red-50 transition-colors"
                          title="Endgueltig loeschen"
                          onClick={() => setConfirmDeleteId(d.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* New Deadline Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-stone-900">Neue Deadline</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-xs text-stone-500">Fach</Label>
              <Select value={formSubjectId} onValueChange={(v) => v && setFormSubjectId(v)}>
                <SelectTrigger className="rounded-xl border-stone-200">
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
              <Label className="text-xs text-stone-500">Titel</Label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="z.B. Mathe Klausur Kapitel 5"
                className="rounded-xl border-stone-200"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-stone-500">Typ</Label>
              <Select
                value={formType}
                onValueChange={(v) => v && setFormType(v as DeadlineType)}
              >
                <SelectTrigger className="rounded-xl border-stone-200">
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
              <Label className="text-xs text-stone-500">Datum</Label>
              <Input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="rounded-xl border-stone-200"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-stone-500">Notizen (optional)</Label>
              <Textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Weitere Details..."
                rows={3}
                className="rounded-xl border-stone-200"
              />
            </div>

            <button
              onClick={handleAdd}
              disabled={!formSubjectId || !formTitle.trim() || !formDate}
              className="w-full bg-stone-900 text-white rounded-xl px-5 py-2.5 font-medium hover:bg-stone-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Deadline erstellen
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog
        open={!!confirmDeleteId}
        onOpenChange={() => setConfirmDeleteId(null)}
      >
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-stone-900">Deadline loeschen?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-stone-500">
            Diese Deadline wird unwiderruflich geloescht.
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <button
              className="bg-stone-100 text-stone-700 rounded-xl px-4 py-2 font-medium hover:bg-stone-200 transition-colors"
              onClick={() => setConfirmDeleteId(null)}
            >
              Abbrechen
            </button>
            <button
              className="bg-red-50 text-red-700 rounded-xl px-4 py-2 font-medium hover:bg-red-100 transition-colors"
              onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}
            >
              Loeschen
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
