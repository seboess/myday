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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
    // Reset file input
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
    // Clear IndexedDB
    const dbs = await window.indexedDB.databases();
    for (const db of dbs) {
      if (db.name) window.indexedDB.deleteDatabase(db.name);
    }
    window.location.reload();
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Einstellungen</h1>

      {/* --- Section: Faecher --- */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Faecher verwalten</h2>
          <Button onClick={openNewSubject} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Neues Fach
          </Button>
        </div>

        {subjects.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Noch keine Faecher angelegt.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {subjects.map((s) => (
              <Card key={s.id}>
                <CardContent className="flex items-center gap-3 p-3">
                  <span
                    className="inline-block h-4 w-4 rounded-full shrink-0"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="flex-1 font-medium">{s.name}</span>
                  <Badge
                    variant="outline"
                    className={
                      s.type === "LK"
                        ? "border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300"
                        : ""
                    }
                  >
                    {s.type}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEditSubject(s)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setDeleteSubjectId(s.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Separator />

      {/* --- Section: Backup --- */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Daten-Backup</h2>

        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Daten exportieren
          </Button>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            Daten importieren
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImportFile}
          />
        </div>

        <p className="text-sm text-muted-foreground">
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

      <Separator />

      {/* --- Section: Reset --- */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Daten zuruecksetzen</h2>
        <p className="text-sm text-muted-foreground">
          Loescht alle gespeicherten Daten unwiderruflich. Erstelle vorher ein
          Backup!
        </p>
        <Button
          variant="destructive"
          onClick={() => setResetStep(1)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Alle Daten loeschen
        </Button>
      </section>

      {/* --- Dialogs --- */}

      {/* New/Edit Subject */}
      <Dialog open={subjectDialogOpen} onOpenChange={setSubjectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSubject ? "Fach bearbeiten" : "Neues Fach"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="z.B. Mathematik"
              />
            </div>

            <div className="space-y-2">
              <Label>Farbe</Label>
              <div className="flex flex-wrap gap-2">
                {SUBJECT_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setFormColor(color)}
                    className={`h-8 w-8 rounded-full border-2 transition-transform ${
                      formColor === color
                        ? "scale-110 border-foreground"
                        : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Kursart</Label>
              <div className="flex gap-2">
                <Button
                  variant={formType === "GK" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFormType("GK")}
                >
                  GK (Grundkurs)
                </Button>
                <Button
                  variant={formType === "LK" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFormType("LK")}
                >
                  LK (Leistungskurs)
                </Button>
              </div>
            </div>

            <Button
              onClick={handleSaveSubject}
              className="w-full"
              disabled={!formName.trim()}
            >
              {editingSubject ? "Speichern" : "Fach erstellen"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Subject Confirm */}
      <Dialog
        open={!!deleteSubjectId}
        onOpenChange={() => setDeleteSubjectId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Fach loeschen?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Alle Noten und Stundenplan-Eintraege fuer dieses Fach werden
            geloescht. Diese Aktion kann nicht rueckgaengig gemacht werden.
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteSubjectId(null)}
            >
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                deleteSubjectId && handleDeleteSubject(deleteSubjectId)
              }
            >
              Fach loeschen
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Confirm */}
      <Dialog
        open={!!importConfirmData}
        onOpenChange={() => setImportConfirmData(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Daten importieren?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Alle aktuellen Daten werden mit dem Backup ueberschrieben. Die App
            wird danach neu geladen.
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setImportConfirmData(null)}
            >
              Abbrechen
            </Button>
            <Button onClick={confirmImport}>Importieren</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset - Step 1 */}
      <Dialog open={resetStep === 1} onOpenChange={() => setResetStep(0)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Alle Daten loeschen?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Alle Faecher, Noten, Deadlines und Einstellungen werden
            unwiderruflich geloescht.
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setResetStep(0)}>
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={() => setResetStep(2)}
            >
              Ja, wirklich loeschen
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset - Step 2 (double confirm) */}
      <Dialog open={resetStep === 2} onOpenChange={() => setResetStep(0)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Letzte Warnung!
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Dieser Schritt kann nicht rueckgaengig gemacht werden. Bist du dir
            wirklich sicher?
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setResetStep(0)}>
              Abbrechen
            </Button>
            <Button variant="destructive" onClick={handleReset}>
              Endgueltig loeschen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
