"use client";

import { useState, useRef } from "react";
import { useStore } from "@/lib/store";
import { SUBJECT_COLORS } from "@/lib/types";
import type { Subject } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Trash2,
  Plus,
  Pencil,
  Download,
  Upload,
  AlertTriangle,
  BookOpen,
} from "lucide-react";

export default function EinstellungenPage() {
  const subjects = useStore((s) => s.subjects);
  const addSubject = useStore((s) => s.addSubject);
  const updateSubject = useStore((s) => s.updateSubject);
  const removeSubject = useStore((s) => s.removeSubject);
  const lastBackupDate = useStore((s) => s.lastBackupDate);
  const setLastBackupDate = useStore((s) => s.setLastBackupDate);

  // Subject dialog
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formName, setFormName] = useState("");
  const [formColor, setFormColor] = useState(SUBJECT_COLORS[0]);
  const [formType, setFormType] = useState<"GK" | "LK">("GK");

  // Delete subject confirm
  const [deleteSubjectId, setDeleteSubjectId] = useState<string | null>(null);

  // Import
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importConfirmData, setImportConfirmData] = useState<string | null>(
    null
  );

  // Reset confirm
  const [resetStep, setResetStep] = useState(0);

  // --- Subject CRUD ---

  function openNewSubject() {
    setEditingSubject(null);
    setFormName("");
    setFormColor(SUBJECT_COLORS[0]);
    setFormType("GK");
    setSubjectDialogOpen(true);
  }

  function openEditSubject(subject: Subject) {
    setEditingSubject(subject);
    setFormName(subject.name);
    setFormColor(subject.color);
    setFormType(subject.type);
    setSubjectDialogOpen(true);
  }

  function handleSaveSubject() {
    if (!formName.trim()) return;
    if (editingSubject) {
      updateSubject(editingSubject.id, {
        name: formName.trim(),
        color: formColor,
        type: formType,
      });
    } else {
      addSubject(formName.trim(), formColor, formType);
    }
    setSubjectDialogOpen(false);
  }

  function handleDeleteSubject(id: string) {
    removeSubject(id);
    setDeleteSubjectId(null);
  }

  // --- Backup ---

  function handleExport() {
    const state = localStorage.getItem("myday-store");
    if (!state) return;
    const blob = new Blob([state], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `myday-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    const now = new Date().toISOString();
    setLastBackupDate(now);
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      try {
        JSON.parse(text); // validate
        setImportConfirmData(text);
      } catch {
        alert("Ungueltige JSON-Datei.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function confirmImport() {
    if (!importConfirmData) return;
    localStorage.setItem("myday-store", importConfirmData);
    setImportConfirmData(null);
    window.location.reload();
  }

  // --- Reset ---

  async function handleReset() {
    localStorage.removeItem("myday-store");
    const dbs = await window.indexedDB.databases();
    for (const db of dbs) {
      if (db.name) window.indexedDB.deleteDatabase(db.name);
    }
    window.location.reload();
  }

  return (
    <div className="px-4 pb-24 pt-4 space-y-8">
      <h1 className="text-2xl font-semibold text-stone-900">Einstellungen</h1>

      {/* --- Section: Faecher --- */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-medium text-stone-500 uppercase tracking-wider">Faecher verwalten</h2>
          <button
            onClick={openNewSubject}
            className="bg-stone-900 text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-stone-800 transition-colors flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Neues Fach
          </button>
        </div>

        {subjects.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <BookOpen className="h-10 w-10 text-stone-300" />
            <p className="text-sm text-stone-400">
              Noch keine Faecher angelegt.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {subjects.map((s) => (
              <div key={s.id} className="bg-stone-50 rounded-xl p-3 flex items-center gap-3">
                <span
                  className="inline-block h-4 w-4 rounded-full shrink-0"
                  style={{ backgroundColor: s.color }}
                />
                <span className="flex-1 font-medium text-stone-800">{s.name}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    s.type === "LK"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-stone-200 text-stone-600"
                  }`}
                >
                  {s.type}
                </span>
                <button
                  className="h-8 w-8 flex items-center justify-center rounded-full text-stone-400 hover:bg-stone-200 hover:text-stone-700 transition-colors"
                  onClick={() => openEditSubject(s)}
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  className="h-8 w-8 flex items-center justify-center rounded-full text-stone-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                  onClick={() => setDeleteSubjectId(s.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="border-t border-stone-100" />

      {/* --- Section: Backup --- */}
      <section className="space-y-4">
        <h2 className="text-xs font-medium text-stone-500 uppercase tracking-wider">Daten-Backup</h2>

        <div className="flex flex-wrap gap-3">
          <button
            className="bg-stone-100 text-stone-700 rounded-xl px-4 py-2 font-medium hover:bg-stone-200 transition-colors flex items-center gap-2"
            onClick={handleExport}
          >
            <Download className="h-4 w-4" />
            Daten exportieren
          </button>
          <button
            className="bg-stone-100 text-stone-700 rounded-xl px-4 py-2 font-medium hover:bg-stone-200 transition-colors flex items-center gap-2"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            Daten importieren
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImportFile}
          />
        </div>

        <p className="text-sm text-stone-400">
          Letztes Backup:{" "}
          {lastBackupDate
            ? new Date(lastBackupDate).toLocaleDateString("de-DE", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "Noch nie"}
        </p>
      </section>

      <div className="border-t border-stone-100" />

      {/* --- Section: Reset --- */}
      <section className="space-y-4">
        <h2 className="text-xs font-medium text-stone-500 uppercase tracking-wider">Daten zuruecksetzen</h2>
        <p className="text-sm text-stone-500">
          Loescht alle gespeicherten Daten unwiderruflich. Erstelle vorher ein
          Backup!
        </p>
        <button
          className="bg-red-50 text-red-700 rounded-xl px-5 py-2.5 font-medium hover:bg-red-100 transition-colors flex items-center gap-2"
          onClick={() => setResetStep(1)}
        >
          <Trash2 className="h-4 w-4" />
          Alle Daten loeschen
        </button>
      </section>

      {/* --- Dialogs --- */}

      {/* New/Edit Subject */}
      <Dialog open={subjectDialogOpen} onOpenChange={setSubjectDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-stone-900">
              {editingSubject ? "Fach bearbeiten" : "Neues Fach"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-xs text-stone-500">Name</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="z.B. Mathematik"
                className="rounded-xl border-stone-200"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-stone-500">Farbe</Label>
              <div className="flex flex-wrap gap-2">
                {SUBJECT_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setFormColor(color)}
                    className={`h-8 w-8 rounded-full transition-transform ${
                      formColor === color
                        ? "scale-110 ring-2 ring-offset-2 ring-stone-900"
                        : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-stone-500">Kursart</Label>
              <div className="flex gap-2">
                <button
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                    formType === "GK"
                      ? "bg-stone-900 text-white"
                      : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                  }`}
                  onClick={() => setFormType("GK")}
                >
                  GK (Grundkurs)
                </button>
                <button
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                    formType === "LK"
                      ? "bg-stone-900 text-white"
                      : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                  }`}
                  onClick={() => setFormType("LK")}
                >
                  LK (Leistungskurs)
                </button>
              </div>
            </div>

            <button
              onClick={handleSaveSubject}
              disabled={!formName.trim()}
              className="w-full bg-stone-900 text-white rounded-xl px-5 py-2.5 font-medium hover:bg-stone-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {editingSubject ? "Speichern" : "Fach erstellen"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Subject Confirm */}
      <Dialog
        open={!!deleteSubjectId}
        onOpenChange={() => setDeleteSubjectId(null)}
      >
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-stone-900">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Fach loeschen?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-stone-500">
            Alle Noten und Stundenplan-Eintraege fuer dieses Fach werden
            geloescht. Diese Aktion kann nicht rueckgaengig gemacht werden.
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <button
              className="bg-stone-100 text-stone-700 rounded-xl px-4 py-2 font-medium hover:bg-stone-200 transition-colors"
              onClick={() => setDeleteSubjectId(null)}
            >
              Abbrechen
            </button>
            <button
              className="bg-red-50 text-red-700 rounded-xl px-4 py-2 font-medium hover:bg-red-100 transition-colors"
              onClick={() =>
                deleteSubjectId && handleDeleteSubject(deleteSubjectId)
              }
            >
              Fach loeschen
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Confirm */}
      <Dialog
        open={!!importConfirmData}
        onOpenChange={() => setImportConfirmData(null)}
      >
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-stone-900">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Daten importieren?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-stone-500">
            Alle aktuellen Daten werden mit dem Backup ueberschrieben. Die App
            wird danach neu geladen.
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <button
              className="bg-stone-100 text-stone-700 rounded-xl px-4 py-2 font-medium hover:bg-stone-200 transition-colors"
              onClick={() => setImportConfirmData(null)}
            >
              Abbrechen
            </button>
            <button
              className="bg-stone-900 text-white rounded-xl px-4 py-2 font-medium hover:bg-stone-800 transition-colors"
              onClick={confirmImport}
            >
              Importieren
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset - Step 1 */}
      <Dialog open={resetStep === 1} onOpenChange={() => setResetStep(0)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-stone-900">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Alle Daten loeschen?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-stone-500">
            Alle Faecher, Noten, Deadlines und Einstellungen werden
            unwiderruflich geloescht.
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <button
              className="bg-stone-100 text-stone-700 rounded-xl px-4 py-2 font-medium hover:bg-stone-200 transition-colors"
              onClick={() => setResetStep(0)}
            >
              Abbrechen
            </button>
            <button
              className="bg-red-50 text-red-700 rounded-xl px-4 py-2 font-medium hover:bg-red-100 transition-colors"
              onClick={() => setResetStep(2)}
            >
              Ja, wirklich loeschen
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset - Step 2 (double confirm) */}
      <Dialog open={resetStep === 2} onOpenChange={() => setResetStep(0)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Letzte Warnung!
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-stone-500">
            Dieser Schritt kann nicht rueckgaengig gemacht werden. Bist du dir
            wirklich sicher?
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <button
              className="bg-stone-100 text-stone-700 rounded-xl px-4 py-2 font-medium hover:bg-stone-200 transition-colors"
              onClick={() => setResetStep(0)}
            >
              Abbrechen
            </button>
            <button
              className="bg-red-50 text-red-700 rounded-xl px-4 py-2 font-medium hover:bg-red-100 transition-colors"
              onClick={handleReset}
            >
              Endgueltig loeschen
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
