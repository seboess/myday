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
import { Trash2, Plus, BookOpen } from "lucide-react";

const SEMESTERS: Semester[] = ["Q1", "Q2", "Q3", "Q4"];

function getPointsColor(points: number | null): string {
  if (points === null) return "";
  if (points >= 10) return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300";
  if (points >= 5) return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300";
  return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300";
}

function getAbiColor(grade: number): string {
  if (grade <= 2.0) return "text-emerald-600 dark:text-emerald-400";
  if (grade <= 3.0) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
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

    // Collect all semester averages
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

    // Need at least some data
    if (gkAverages.length === 0 && lkAverages.length === 0) return null;

    // Take best 24 GK results (or all if fewer)
    const sortedGK = [...gkAverages].sort((a, b) => b - a);
    const bestGK = sortedGK.slice(0, 24);

    // Take best 8 LK results (or all if fewer), doubled
    const sortedLK = [...lkAverages].sort((a, b) => b - a);
    const bestLK = sortedLK.slice(0, 8);

    const gkSum = bestGK.reduce((s, v) => s + v, 0);
    const lkSum = bestLK.reduce((s, v) => s + v * 2, 0);

    return gkSum + lkSum;
  }

  const blockIPoints = computeBlockI();
  // For projection, assume Block II adds ~100 points (5 exams * 4x * 5 average = 100)
  // We'll project from Block I alone scaled to 600 max, then project total
  const projectedTotal = blockIPoints !== null ? Math.round(blockIPoints * (900 / 600)) : null;
  const abiGrade = projectedTotal !== null ? calculateAbiGrade(projectedTotal) : null;

  if (subjects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8 text-center min-h-[60vh]">
        <BookOpen className="h-16 w-16 text-muted-foreground/40" />
        <h1 className="text-2xl font-bold">Noten-Tracker</h1>
        <p className="text-muted-foreground max-w-sm">
          Erstelle zuerst deine F&auml;cher in den Einstellungen
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 space-y-6">
      <h1 className="text-2xl font-bold">Noten-Tracker</h1>

      {/* Grade Table */}
      <div className="overflow-x-auto -mx-4 px-4">
        <table className="w-full min-w-[480px] border-collapse">
          <thead>
            <tr>
              <th className="text-left py-2 px-3 text-sm font-semibold text-muted-foreground border-b">
                Fach
              </th>
              {SEMESTERS.map((sem) => (
                <th
                  key={sem}
                  className="text-center py-2 px-3 text-sm font-semibold text-muted-foreground border-b w-[70px]"
                >
                  {sem}
                </th>
              ))}
              <th className="text-center py-2 px-3 text-sm font-semibold text-muted-foreground border-b w-[70px]">
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
                <tr key={subject.id} className="border-b last:border-b-0 hover:bg-muted/30">
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: subject.color }}
                      />
                      <span className="text-sm font-medium truncate">{subject.name}</span>
                      {subject.type === "LK" && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
                          LK
                        </Badge>
                      )}
                    </div>
                  </td>
                  {SEMESTERS.map((sem, i) => {
                    const avg = semesterAverages[i];
                    return (
                      <td key={sem} className="py-1.5 px-1.5 text-center">
                        <button
                          onClick={() => openDialog(subject.id, sem)}
                          className={`w-full rounded-md py-1.5 px-2 text-sm font-semibold transition-colors hover:ring-2 hover:ring-ring/20 ${
                            avg !== null
                              ? getPointsColor(avg)
                              : "bg-muted/50 text-muted-foreground/40 hover:bg-muted"
                          }`}
                        >
                          {avg !== null ? avg.toFixed(1) : "-"}
                        </button>
                      </td>
                    );
                  })}
                  <td className="py-1.5 px-1.5 text-center">
                    <span
                      className={`text-sm font-bold ${
                        overallAvg !== null ? getPointsColor(overallAvg).replace(/bg-\S+/g, "") : "text-muted-foreground/40"
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
      <Card>
        <CardContent className="pt-6 pb-5 text-center space-y-2">
          {blockIPoints !== null && abiGrade !== null ? (
            <>
              <p className="text-sm text-muted-foreground">Voraussichtlicher Abi-Schnitt</p>
              <p className={`text-5xl font-bold tracking-tight ${getAbiColor(abiGrade)}`}>
                {abiGrade.toFixed(1)}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Block I: ~{blockIPoints} Punkte (basierend auf aktuellen Noten)
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">Abi-Schnitt Prognose</p>
              <p className="text-muted-foreground/60 text-sm mt-1">
                Noch nicht genug Noten f&uuml;r eine Prognose
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Grade Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedSubject && (
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: selectedSubject.color }}
                />
              )}
              <span className="truncate">{selectedSubject?.name}</span>
              {selectedSubject?.type === "LK" && (
                <Badge variant="secondary" className="text-xs">LK</Badge>
              )}
              <span className="text-muted-foreground font-normal text-sm ml-auto">
                {selectedSemester && SEMESTER_LABELS[selectedSemester]}
              </span>
            </DialogTitle>
          </DialogHeader>

          {/* Existing grades */}
          <div className="space-y-2">
            {dialogGrades.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Noch keine Noten eingetragen
              </p>
            ) : (
              dialogGrades.map((grade) => (
                <div
                  key={grade.id}
                  className="flex items-center gap-2 rounded-lg border p-2.5"
                >
                  <Badge
                    variant={grade.type === "klausur" ? "default" : "secondary"}
                    className="text-[10px] shrink-0"
                  >
                    {grade.type === "klausur" ? "Klausur" : "Allgemein"}
                  </Badge>
                  {grade.label && (
                    <span className="text-xs text-muted-foreground truncate">
                      {grade.label}
                    </span>
                  )}
                  <span className="ml-auto font-semibold text-sm shrink-0">
                    {grade.points} P
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {grade.weight}%
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeGrade(grade.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))
            )}
          </div>

          {/* Semester average */}
          {dialogAverage !== null && (
            <div
              className={`rounded-lg p-3 text-center ${getPointsColor(dialogAverage)}`}
            >
              <span className="text-xs font-medium">Halbjahresschnitt</span>
              <span className="text-lg font-bold ml-2">{dialogAverage.toFixed(1)} Punkte</span>
            </div>
          )}

          {/* Add grade form */}
          <div className="border-t pt-4 space-y-3">
            <p className="text-sm font-semibold flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Note hinzuf&uuml;gen
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Typ</Label>
                <Select value={newType} onValueChange={(v) => setNewType(v as GradeType)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="allgemein">Allgemein</SelectItem>
                    <SelectItem value="klausur">Klausur</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Punkte (0-15)</Label>
                <Input
                  type="number"
                  min={0}
                  max={15}
                  value={newPoints}
                  onChange={(e) => setNewPoints(e.target.value)}
                  placeholder="0-15"
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Gewichtung (%)</Label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  placeholder="50"
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Bezeichnung</Label>
                <Input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="Optional"
                  className="h-9"
                />
              </div>
            </div>

            <Button onClick={handleAddGrade} className="w-full" size="sm">
              <Plus className="h-4 w-4 mr-1.5" />
              Hinzuf&uuml;gen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
