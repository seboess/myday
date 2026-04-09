"use client";

import { useState, useMemo } from "react";
import { useStore, getSubjectSemesterAverage, calculateAbiGrade } from "@/lib/store";
import type { Semester, GradeType, AbiExam } from "@/lib/types";
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
import { Trash2, Plus, BookOpen, GraduationCap } from "lucide-react";

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
  const abiExams = useStore((s) => s.abiExams);
  const addAbiExam = useStore((s) => s.addAbiExam);
  const updateAbiExam = useStore((s) => s.updateAbiExam);
  const removeAbiExam = useStore((s) => s.removeAbiExam);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<Semester | null>(null);

  // Form state
  const [newType, setNewType] = useState<GradeType>("allgemein");
  const [newPoints, setNewPoints] = useState("");
  const [newWeight, setNewWeight] = useState("50");
  const [newLabel, setNewLabel] = useState("");

  // Abi exam form
  const [examDialogOpen, setExamDialogOpen] = useState(false);
  const [examSubjectId, setExamSubjectId] = useState("");
  const [examType, setExamType] = useState<"written" | "oral">("written");

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

  function openExamDialog() {
    setExamSubjectId(subjects[0]?.id ?? "");
    setExamType("written");
    setExamDialogOpen(true);
  }

  function handleAddExam() {
    if (!examSubjectId) return;
    if (abiExams.length >= 5) return;
    addAbiExam(examSubjectId, examType);
    setExamDialogOpen(false);
  }

  // --- Block I calculation ---
  // LKs are double weighted, user can drop 2 worst GK grades per semester
  // 10 courses total (2 LK + 8 GK), keep 8 per semester (drop 2 worst GK)
  const blockIResult = useMemo(() => {
    const gkSubjects = subjects.filter((s) => s.type === "GK");
    const lkSubjects = subjects.filter((s) => s.type === "LK");

    let totalPoints = 0;
    let totalEntries = 0;

    for (const sem of SEMESTERS) {
      // LK grades: all must be brought in, double weighted
      for (const sub of lkSubjects) {
        const avg = getSubjectSemesterAverage(grades, sub.id, sem);
        if (avg !== null) {
          totalPoints += Math.round(avg) * 2;
          totalEntries += 2;
        }
      }

      // GK grades: drop the 2 worst per semester
      const gkGrades: { subId: string; avg: number }[] = [];
      for (const sub of gkSubjects) {
        const avg = getSubjectSemesterAverage(grades, sub.id, sem);
        if (avg !== null) {
          gkGrades.push({ subId: sub.id, avg: Math.round(avg) });
        }
      }

      // Sort ascending (worst first) and drop up to 2
      gkGrades.sort((a, b) => a.avg - b.avg);
      const dropCount = Math.min(2, Math.max(0, gkGrades.length - 6));
      const keptGK = gkGrades.slice(dropCount);

      for (const g of keptGK) {
        totalPoints += g.avg;
        totalEntries += 1;
      }
    }

    if (totalEntries === 0) return null;
    return { points: totalPoints, entries: totalEntries };
  }, [subjects, grades]);

  // --- Block II calculation (Abiturpruefungen) ---
  const blockIIResult = useMemo(() => {
    const withPoints = abiExams.filter((e): e is AbiExam & { points: number } => e.points !== null);
    if (withPoints.length === 0) return null;
    const points = withPoints.reduce((sum, e) => sum + e.points * 4, 0);
    return { points, count: withPoints.length };
  }, [abiExams]);

  // --- Total Abi grade ---
  const abiGrade = useMemo(() => {
    if (!blockIResult) return null;
    // If we have exam results, use them; otherwise project from Block I only
    const blockI = blockIResult.points;
    const blockII = blockIIResult?.points ?? 0;

    if (blockIIResult && blockIIResult.count === 5) {
      // Full calculation with both blocks
      const total = blockI + blockII;
      return calculateAbiGrade(total);
    }

    // Projection: scale Block I to 600 max and estimate total
    // Max Block I: 40 entries × 15 = 600 (8 GK×4 semesters × 1 + 2 LK×4 semesters × 2)
    const maxBlockI = blockIResult.entries * 15;
    if (maxBlockI === 0) return null;
    const scaledBlockI = Math.round((blockI / maxBlockI) * 600);
    const projectedTotal = scaledBlockI + (blockIIResult?.points ?? Math.round(scaledBlockI * 0.5));
    return calculateAbiGrade(projectedTotal);
  }, [blockIResult, blockIIResult]);

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

      {/* Abiturpruefungen (Block II) */}
      <div className="bg-stone-50 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-stone-500" />
            <h2 className="text-base font-medium text-stone-800">Abiturpr&uuml;fungen</h2>
          </div>
          {abiExams.length < 5 && (
            <button
              onClick={openExamDialog}
              className="bg-stone-900 text-white rounded-xl px-3 py-1.5 text-xs font-medium hover:bg-stone-800 transition-colors flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              Pr&uuml;fung
            </button>
          )}
        </div>

        {abiExams.length === 0 ? (
          <p className="text-sm text-stone-400 text-center py-4">
            Noch keine Abiturpr&uuml;fungen eingetragen
          </p>
        ) : (
          <div className="space-y-2">
            {abiExams.map((exam, idx) => {
              const subject = subjects.find((s) => s.id === exam.subjectId);
              return (
                <div
                  key={exam.id}
                  className="flex items-center gap-3 rounded-xl bg-white p-3"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-100 text-xs font-bold text-stone-600">
                    {idx + 1}
                  </div>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {subject && (
                      <>
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: subject.color }}
                        />
                        <span className="text-sm font-medium text-stone-800 truncate">
                          {subject.name}
                        </span>
                        {subject.type === "LK" && (
                          <span className="bg-stone-200 text-stone-700 text-[9px] font-bold px-1.5 py-0.5 rounded-md shrink-0">
                            LK
                          </span>
                        )}
                      </>
                    )}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      exam.type === "written"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-purple-50 text-purple-700"
                    }`}>
                      {exam.type === "written" ? "Schriftlich" : "M\u00FCndlich"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="number"
                      min={0}
                      max={15}
                      value={exam.points ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "") {
                          updateAbiExam(exam.id, { points: null });
                        } else {
                          const pts = parseInt(val);
                          if (!isNaN(pts) && pts >= 0 && pts <= 15) {
                            updateAbiExam(exam.id, { points: pts });
                          }
                        }
                      }}
                      placeholder="-"
                      className="w-14 rounded-lg border border-stone-200 bg-white px-2 py-1 text-center text-sm font-semibold tabular-nums text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300"
                    />
                    <span className="text-xs text-stone-400">P</span>
                    {exam.points !== null && (
                      <span className="text-xs text-stone-500 tabular-nums w-8 text-right">
                        ={exam.points * 4}
                      </span>
                    )}
                    <button
                      className="h-7 w-7 flex items-center justify-center rounded-full text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      onClick={() => removeAbiExam(exam.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {blockIIResult && (
          <div className="text-center text-xs text-stone-500">
            Block II: {blockIIResult.points} / 300 Punkte ({blockIIResult.count}/5 Pr&uuml;fungen)
          </div>
        )}
      </div>

      {/* Abi-Schnitt Projection */}
      <div className="bg-stone-50 rounded-2xl p-6 text-center space-y-2">
        {blockIResult !== null && abiGrade !== null ? (
          <>
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">
              {blockIIResult && blockIIResult.count === 5
                ? "Abi-Schnitt"
                : "Voraussichtlicher Abi-Schnitt"}
            </p>
            <p className={`text-5xl font-bold tracking-tight tabular-nums ${getAbiColor(abiGrade)}`}>
              {abiGrade.toFixed(1)}
            </p>
            <div className="flex flex-col gap-1 mt-2">
              <p className="text-xs text-stone-400">
                Block I: {blockIResult.points} Punkte
                <span className="text-stone-300"> &middot; </span>
                LK doppelt, 2 schlechteste GK/Halbjahr gestrichen
              </p>
              {blockIIResult && (
                <p className="text-xs text-stone-400">
                  Block II: {blockIIResult.points} Punkte
                </p>
              )}
            </div>
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

      {/* Add Exam Dialog */}
      <Dialog open={examDialogOpen} onOpenChange={setExamDialogOpen}>
        <DialogContent className="max-w-xs rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-stone-900">Abiturpr&uuml;fung hinzuf&uuml;gen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-xs text-stone-500">Fach</Label>
              <Select value={examSubjectId} onValueChange={(v) => v && setExamSubjectId(v)}>
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
                        {s.type === "LK" && " (LK)"}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-stone-500">Pr&uuml;fungsart</Label>
              <div className="flex gap-2">
                <button
                  className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                    examType === "written"
                      ? "bg-stone-900 text-white"
                      : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                  }`}
                  onClick={() => setExamType("written")}
                >
                  Schriftlich
                </button>
                <button
                  className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                    examType === "oral"
                      ? "bg-stone-900 text-white"
                      : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                  }`}
                  onClick={() => setExamType("oral")}
                >
                  M&uuml;ndlich
                </button>
              </div>
            </div>

            <button
              onClick={handleAddExam}
              disabled={!examSubjectId || abiExams.length >= 5}
              className="w-full bg-stone-900 text-white rounded-xl px-5 py-2.5 font-medium hover:bg-stone-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Hinzuf&uuml;gen
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
