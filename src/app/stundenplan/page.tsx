"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, X, BookOpen } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Day } from "@/lib/types";
import { DAY_LABELS, SCHEDULE, MAX_PERIODS } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MaterialUpload } from "@/components/material-upload";

const DAYS: Day[] = ["mo", "di", "mi", "do", "fr"];
const DAY_SHORT: Record<Day, string> = {
  mo: "Mo",
  di: "Di",
  mi: "Mi",
  do: "Do",
  fr: "Fr",
};

const PERIODS = Array.from({ length: MAX_PERIODS }, (_, i) => i + 1);

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

export default function StundenplanPage() {
  const subjects = useStore((s) => s.subjects);
  const timetable = useStore((s) => s.timetable);
  const setTimetableSlot = useStore((s) => s.setTimetableSlot);
  const clearTimetableSlot = useStore((s) => s.clearTimetableSlot);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{
    day: Day;
    period: number;
  } | null>(null);

  const getSlot = (day: Day, period: number) =>
    timetable.find((t) => t.day === day && t.period === period);

  const getSubject = (subjectId: string) =>
    subjects.find((s) => s.id === subjectId);

  const handleCellClick = (day: Day, period: number) => {
    setSelectedCell({ day, period });
    setDialogOpen(true);
  };

  const handleSelectSubject = (subjectId: string) => {
    if (selectedCell) {
      setTimetableSlot(selectedCell.day, selectedCell.period, subjectId);
    }
    setDialogOpen(false);
    setSelectedCell(null);
  };

  const handleClear = () => {
    if (selectedCell) {
      clearTimetableSlot(selectedCell.day, selectedCell.period);
    }
    setDialogOpen(false);
    setSelectedCell(null);
  };

  const selectedSlot =
    selectedCell && getSlot(selectedCell.day, selectedCell.period);

  if (subjects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-4 py-20 text-center">
        <BookOpen className="h-12 w-12 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Stundenplan</h1>
        <p className="text-muted-foreground">
          Erstelle zuerst deine F&auml;cher in den Einstellungen
        </p>
        <Link href="/einstellungen">
          <Button>Zu den Einstellungen</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="mb-4 text-2xl font-bold">Stundenplan</h1>

      {/* Scrollable grid wrapper */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[600px] border-collapse">
          <thead>
            <tr>
              {/* Time column header */}
              <th className="w-[100px] border-b border-r border-border bg-muted/50 px-2 py-2.5 text-left text-xs font-medium text-muted-foreground">
                Stunde
              </th>
              {DAYS.map((day) => (
                <th
                  key={day}
                  className="border-b border-border bg-muted/50 px-2 py-2.5 text-center text-sm font-semibold"
                >
                  <span className="hidden sm:inline">
                    {DAY_LABELS[day]}
                  </span>
                  <span className="sm:hidden">{DAY_SHORT[day]}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERIODS.map((period) => (
              <tr key={period}>
                {/* Period label */}
                <td className="border-b border-r border-border bg-muted/30 px-2 py-1">
                  <div className="text-sm font-semibold">{period}.</div>
                </td>

                {DAYS.map((day) => {
                  const daySchedule = SCHEDULE[day];
                  const isDisabled = period > daySchedule.periods;

                  if (isDisabled) {
                    return (
                      <td
                        key={day}
                        className="border-b border-border bg-muted/20 p-0"
                      >
                        <div className="flex min-h-[56px] items-center justify-center text-muted-foreground/30">
                          &mdash;
                        </div>
                      </td>
                    );
                  }

                  const slot = getSlot(day, period);
                  const subject = slot ? getSubject(slot.subjectId) : null;
                  const timeLabel = daySchedule.times[period];

                  let bgStyle: React.CSSProperties = {};
                  if (subject) {
                    const { r, g, b } = hexToRgb(subject.color);
                    bgStyle = {
                      backgroundColor: `rgba(${r}, ${g}, ${b}, 0.15)`,
                      borderLeft: `3px solid ${subject.color}`,
                    };
                  }

                  return (
                    <td
                      key={day}
                      className="border-b border-border p-0"
                    >
                      <button
                        type="button"
                        onClick={() => handleCellClick(day, period)}
                        className="flex h-full min-h-[56px] w-full flex-col items-center justify-center px-1 py-1.5 transition-colors hover:bg-muted/40"
                        style={bgStyle}
                      >
                        {subject ? (
                          <>
                            <span
                              className="text-xs font-semibold sm:text-sm"
                              style={{ color: subject.color }}
                            >
                              {subject.name}
                            </span>
                            {subject.type === "LK" && (
                              <span
                                className="mt-0.5 inline-block rounded px-1 py-px text-[9px] font-bold uppercase leading-none text-white"
                                style={{ backgroundColor: subject.color }}
                              >
                                LK
                              </span>
                            )}
                          </>
                        ) : (
                          <Plus className="h-4 w-4 text-muted-foreground/40" />
                        )}
                        {timeLabel && (
                          <span className="mt-0.5 text-[9px] leading-tight text-muted-foreground">
                            {timeLabel}
                          </span>
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Subject selection dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>
              {selectedCell
                ? `${DAY_LABELS[selectedCell.day]}, ${selectedCell.period}. Stunde`
                : "Fach w\u00e4hlen"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-2">
            {subjects.map((subject) => {
              const { r, g, b } = hexToRgb(subject.color);
              const isActive = selectedSlot?.subjectId === subject.id;

              return (
                <button
                  key={subject.id}
                  type="button"
                  onClick={() => handleSelectSubject(subject.id)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm font-medium transition-all hover:scale-[1.02] ${
                    isActive
                      ? "ring-2 ring-offset-1"
                      : "border-border"
                  }`}
                  style={{
                    backgroundColor: `rgba(${r}, ${g}, ${b}, 0.12)`,
                    borderColor: isActive ? subject.color : undefined,
                  }}
                >
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: subject.color }}
                  />
                  <span className="truncate">{subject.name}</span>
                  {subject.type === "LK" && (
                    <span
                      className="ml-auto shrink-0 rounded px-1 py-px text-[9px] font-bold uppercase leading-none text-white"
                      style={{ backgroundColor: subject.color }}
                    >
                      LK
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {selectedSlot && (
            <Button
              variant="outline"
              className="mt-2 w-full gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={handleClear}
            >
              <X className="h-4 w-4" />
              Fach entfernen
            </Button>
          )}

          {selectedCell && selectedSlot && (
            <>
              <Separator className="my-3" />
              <div>
                <h4 className="mb-2 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  Materialien
                </h4>
                <MaterialUpload
                  linkedTo={{
                    type: "timetable",
                    id: `${selectedCell.day}-${selectedCell.period}`,
                  }}
                />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
