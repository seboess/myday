"use client";

import { useState } from "react";
import { useStore, getSubjectSemesterAverage, calculateAbiGrade } from "@/lib/store";
import type { Semester, GradeType, Grade } from "@/lib/types";
import { SEMESTER_LABELS } from "@/lib/types";
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
import { Trash2, Plus, BookOpen } from "lucide-react";

const SEMESTERS: Semester[] = ["Q1", "Q2", "Q3", "Q4"];

function getPointsColor(points: number | null): string {
  if (points === null) return "";
  if (points >= 10) return "bg-green-50 text-green-800";
  if (points >= 5) return "bg-amber-50 text-amber-800";
  return "bg-red-50 text-red-800";
}

function getAbiColor(grade: number): string {
  if (grade <= 2.0) return "text-green-600";
  if (grade <= 3.0) return "text-amber-600";
  return "text-red-600";
}

export default function NotenPage() {
  const subjects = useStore((s) => s.subjects);
  const grades = useStore((s) => s.grades);
  const addGrade = useStore((s) => s.addGrade);
  const removeGrade = useStore((s) => s.removeGrade);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<Semester | null>(null);

  // Form state
  const [newType, setNewType] = useState<GradeType>("allgemein");
  const [newPoints, setNewPoints] = useState("");
  const [newWeight, setNewWeight] = useState("50");
  const [newLabel, setNewLabel] = useState("");

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);
  const dialogGrades = grades.filter(
    (g) => g.subjectId === selectedSubjectId && g.semester === selectedSemester
  );
  const dialogAverage =
    selectedSubjectId && selectedSemester
      ? getSubjectSemesterAverage(grades, selectedSubjectId, selectedSemester)
      : null;

  function openDialog(subjectId: string, semester: Semester) {
    setSelectedSubjectId(subjectId);
    setSelectedSemester(semester);
    setNewType("allgemein");
    setNewPoints("");
    setNewWeight("50");
    setNewLabel("");
    setDialogOpen(true);
  }

  function handleAddGrade() {
    if (!selectedSubjectId || !selectedSemester) return;
    const pts = parseInt(newPoints);
    const wt = parseInt(newWeight);
    if (isNaN(pts) || pts < 0 || pts > 15) return;
    if (isNaN(wt) || wt <= 0 || wt > 100) return;
    addGrade(selectedSubjectId, selectedSemester, newType, pts, wt, newLabel || undefined);
    setNewPoints("");
    setNewWeight("50");
    setNewLabel("");
    setNewType("allgemein");
  }

  // Abi-Schnitt calculation
  function computeBlockI(): number | null {
    const gkSubjects = subjects.filter((s) => s.type === "GK");
    const lkSubjects = subjects.filter((s) => s.type === "LK");

    const gkAverages: number[] = [];
    for (const sub of gkSubjects) {
      for (const sem of SEMESTERS) {
        const avg = getSubjectSemesterAverage(grades, sub.id, sem);
        if (avg !== null) gkAverages.push(Math.round(avg));
      }
    }

    const lkAverages: number[] = [];
    for (const sub of lkSubjects) {
      for (const sem of SEMESTERS) {
        const avg = getSubjectSemesterAverage(grades, sub.id, sem);
        if (avg !== null) lkAverages.push(Math.round(avg));
      }
    }

    if (gkAverages.length === 0 && lkAverages.length === 0) return null;

    const sortedGK = [...gkAverages].sort((a, b) => b - a);
    const bestGK = sortedGK.slice(0, 24);

    const sortedLK = [...lkAverages].sort((a, b) => b - a);
    const bestLK = sortedLK.slice(0, 8);

    const gkSum = bestGK.reduce((s, v) => s + v, 0);
    const lkSum = bestLK.reduce((s, v) => s + v * 2, 0);

    return gkSum + lkSum;
  }

  const blockIPoints = computeBlockI();
  const projectedTotal = blockIPoints !== null ? Math.round(blockIPoints * (900 / 600)) : null;
  const abiGrade = projectedTotal !== null ? calculateAbiGrade(projectedTotal) : null;

  if (subjects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8 text-center min-h-[60vh]">
        <BookOpen className="h-16 w-16 text-stone-300" />
        <h1 className="text-2xl font-semibold text-stone-900">Noten-Tracker</h1>
        <p className="text-stone-500 max-w-sm">
          Erstelle zuerst deine F&auml;cher in den Einstellungen
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 space-y-6">
      <h1 className="text-2xl font-semibold text-stone-900">Noten-Tracker</h1>

      {/* Grade Table */}
      <div className="overflow-x-auto -mx-4 px-4">
        <table className="w-full min-w-[480px] border-collapse">
          <thead>
            <tr>
              <th className="text-left py-2.5 px-3 text-xs font-medium text-stone-500 uppercase tracking-wider border-b border-stone-100">
                Fach
              </th>
              {SEMESTERS.map((sem) => (
                <th
                  key={sem}
                  className="text-center py-2.5 px-3 text-xs font-medium text-stone-500 uppercase tracking-wider border-b border-stone-100 w-[70px]"
                >
                  {sem}
                </th>
              ))}
              <th className="text-center py-2.5 px-3 text-xs font-medium text-stone-500 uppercase tracking-wider border-b border-stone-100 w-[70px]">
                &Oslash;
              </th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((subject) => {
              const semesterAverages = SEMESTERS.map((sem) =>
                getSubjectSemesterAverage(grades, subject.id, sem)
              );
              const validAverages = semesterAverages.filter((a): a is number => a !== null);
              const overallAvg =
                validAverages.length > 0
                  ? Math.round((validAverages.reduce((s, v) => s + v, 0) / validAverages.length) * 10) / 10
                  : null;

              return (
                <tr key={subject.id} className="border-b border-stone-100 last:border-b-0">
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: subject.color }}
                      />
                      <span className="text-sm font-medium text-stone-800 truncate">{subject.name}</span>
                      {subject.type === "LK" && (
                        <span className="bg-stone-200 text-stone-700 text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0">
                          LK
                        </span>
                      )}
                    </div>
                  </td>
                  {SEMESTERS.map((sem, i) => {
                    const avg = semesterAverages[i];
                    return (
                      <td key={sem} className="py-1.5 px-1.5 text-center">
                        <button
                          onClick={() => openDialog(subject.id, sem)}
                          className={`w-full rounded-xl py-1.5 px-2 text-sm font-semibold tabular-nums transition-colors ${
                            avg !== null
                              ? getPointsColor(avg)
                              : "bg-stone-50 text-stone-300 hover:bg-stone-100"
                          }`}
                        >
                          {avg !== null ? avg.toFixed(1) : "-"}
                        </button>
                      </td>
                    );
                  })}
                  <td className="py-1.5 px-1.5 text-center">
                    <span
                      className={`text-sm font-bold tabular-nums ${
                        overallAvg !== null ? (overallAvg >= 10 ? "text-green-700" : overallAvg >= 5 ? "text-amber-700" : "text-red-700") : "text-stone-300"
                      }`}
                    >
                      {overallAvg !== null ? overallAvg.toFixed(1) : "-"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Abi-Schnitt Projection */}
      <div className="bg-stone-50 rounded-2xl p-6 text-center space-y-2">
        {blockIPoints !== null && abiGrade !== null ? (
          <>
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">Voraussichtlicher Abi-Schnitt</p>
            <p className={`text-5xl font-bold tracking-tight tabular-nums ${getAbiColor(abiGrade)}`}>
              {abiGrade.toFixed(1)}
            </p>
            <p className="text-xs text-stone-400 mt-2">
              Block I: ~{blockIPoints} Punkte (basierend auf aktuellen Noten)
            </p>
          </>
        ) : (
          <>
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">Abi-Schnitt Prognose</p>
            <p className="text-stone-400 text-sm mt-1">
              Noch nicht genug Noten f&uuml;r eine Prognose
            </p>
          </>
        )}
      </div>

      {/* Grade Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-stone-900">
              {selectedSubject && (
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: selectedSubject.color }}
                />
              )}
              <span className="truncate">{selectedSubject?.name}</span>
              {selectedSubject?.type === "LK" && (
                <span className="bg-stone-200 text-stone-700 text-[10px] font-bold px-1.5 py-0.5 rounded-md">LK</span>
              )}
              <span className="text-stone-400 font-normal text-sm ml-auto">
                {selectedSemester && SEMESTER_LABELS[selectedSemester]}
              </span>
            </DialogTitle>
          </DialogHeader>

          {/* Existing grades */}
          <div className="space-y-2">
            {dialogGrades.length === 0 ? (
              <p className="text-sm text-stone-400 text-center py-4">
                Noch keine Noten eingetragen
              </p>
            ) : (
              dialogGrades.map((grade) => (
                <div
                  key={grade.id}
                  className="flex items-center gap-2 rounded-xl bg-stone-50 p-2.5"
                >
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      grade.type === "klausur"
                        ? "bg-red-50 text-red-700"
                        : "bg-blue-50 text-blue-700"
                    }`}
                  >
                    {grade.type === "klausur" ? "Klausur" : "Allgemein"}
                  </span>
                  {grade.label && (
                    <span className="text-xs text-stone-500 truncate">
                      {grade.label}
                    </span>
                  )}
                  <span className="ml-auto font-semibold text-sm text-stone-800 shrink-0 tabular-nums">
                    {grade.points} P
                  </span>
                  <span className="text-xs text-stone-400 shrink-0">
                    {grade.weight}%
                  </span>
                  <button
                    className="h-7 w-7 shrink-0 flex items-center justify-center rounded-full text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    onClick={() => removeGrade(grade.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Semester average */}
          {dialogAverage !== null && (
            <div
              className={`rounded-xl p-3 text-center ${getPointsColor(dialogAverage)}`}
            >
              <span className="text-xs font-medium">Halbjahresschnitt</span>
              <span className="text-lg font-bold ml-2 tabular-nums">{dialogAverage.toFixed(1)} Punkte</span>
            </div>
          )}

          {/* Add grade form */}
          <div className="border-t border-stone-100 pt-4 space-y-3">
            <p className="text-sm font-medium text-stone-800 flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Note hinzuf&uuml;gen
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-stone-500">Typ</Label>
                <Select value={newType} onValueChange={(v) => setNewType(v as GradeType)}>
                  <SelectTrigger className="h-9 rounded-xl border-stone-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="allgemein">Allgemein</SelectItem>
                    <SelectItem value="klausur">Klausur</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-stone-500">Punkte (0-15)</Label>
                <Input
                  type="number"
                  min={0}
                  max={15}
                  value={newPoints}
                  onChange={(e) => setNewPoints(e.target.value)}
                  placeholder="0-15"
                  className="h-9 rounded-xl border-stone-200"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-stone-500">Gewichtung (%)</Label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  placeholder="50"
                  className="h-9 rounded-xl border-stone-200"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-stone-500">Bezeichnung</Label>
                <Input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="Optional"
                  className="h-9 rounded-xl border-stone-200"
                />
              </div>
            </div>

            <button
              onClick={handleAddGrade}
              className="w-full bg-stone-900 text-white rounded-xl px-5 py-2.5 font-medium hover:bg-stone-800 transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Hinzuf&uuml;gen
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
