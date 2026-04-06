"use client";

import { useState } from "react";
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
  AlertTriangle,
  BookOpen,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";

export default function EinstellungenPage() {
  const subjects = useStore((s) => s.subjects);
  const addSubject = useStore((s) => s.addSubject);
  const updateSubject = useStore((s) => s.updateSubject);
  const removeSubject = useStore((s) => s.removeSubject);
  const { user, signOut } = useAuth();

  // Subject dialog
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formName, setFormName] = useState("");
  const [formColor, setFormColor] = useState(SUBJECT_COLORS[0]);
  const [formType, setFormType] = useState<"GK" | "LK">("GK");

  // Delete subject confirm
  const [deleteSubjectId, setDeleteSubjectId] = useState<string | null>(null);

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

      {/* --- Section: Account --- */}
      <section className="space-y-4">
        <h2 className="text-xs font-medium text-stone-500 uppercase tracking-wider">Konto</h2>

        <div className="bg-stone-50 rounded-xl p-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-900 text-sm font-medium text-white">
            {user?.email?.charAt(0).toUpperCase() ?? "?"}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-stone-800">{user?.email ?? "Nicht angemeldet"}</p>
            <p className="text-xs text-stone-400">Deine Daten werden automatisch in der Cloud gespeichert.</p>
          </div>
        </div>

        <button
          className="bg-red-50 text-red-700 rounded-xl px-5 py-2.5 font-medium hover:bg-red-100 transition-colors flex items-center gap-2"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4" />
          Abmelden
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

    </div>
  );
}
