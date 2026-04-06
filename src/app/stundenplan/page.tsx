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
        <BookOpen className="h-12 w-12 text-stone-300" />
        <h1 className="text-2xl font-semibold text-stone-900">Stundenplan</h1>
        <p className="text-stone-500">
          Erstelle zuerst deine F&auml;cher in den Einstellungen
        </p>
        <Link href="/einstellungen">
          <button className="bg-stone-900 text-white rounded-xl px-5 py-2.5 font-medium hover:bg-stone-800 transition-colors">
            Zu den Einstellungen
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24">
      <h1 className="mb-4 text-2xl font-semibold text-stone-900">Stundenplan</h1>

      {/* Scrollable grid wrapper */}
      <div className="overflow-x-auto rounded-2xl bg-stone-50">
        <table className="w-full min-w-[600px] border-collapse">
          <thead>
            <tr>
              {/* Time column header */}
              <th className="w-[100px] px-2 py-2.5 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                Stunde
              </th>
              {DAYS.map((day) => (
                <th
                  key={day}
                  className="px-2 py-2.5 text-center text-sm font-medium text-stone-800"
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
                <td className="px-2 py-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-sm font-medium text-stone-600">
                    {period}
                  </div>
                </td>

                {DAYS.map((day) => {
                  const daySchedule = SCHEDULE[day];
                  const isDisabled = period > daySchedule.periods;

                  if (isDisabled) {
                    return (
                      <td
                        key={day}
                        className="p-1"
                      >
                        <div className="flex min-h-[56px] items-center justify-center rounded-xl bg-stone-100/50 text-stone-300">
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
                      backgroundColor: `rgba(${r}, ${g}, ${b}, 0.12)`,
                    };
                  }

                  return (
                    <td
                      key={day}
                      className="p-1"
                    >
                      <button
                        type="button"
                        onClick={() => handleCellClick(day, period)}
                        className={`flex h-full min-h-[56px] w-full flex-col items-center justify-center rounded-xl px-1 py-1.5 transition-colors ${
                          subject ? '' : 'bg-white hover:bg-stone-100'
                        }`}
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
                              <span className="mt-0.5 bg-stone-200 text-stone-700 text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase leading-none">
                                LK
                              </span>
                            )}
                          </>
                        ) : (
                          <Plus className="h-4 w-4 text-stone-300" />
                        )}
                        {timeLabel && (
                          <span className="mt-0.5 text-[9px] leading-tight text-stone-400">
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
        <DialogContent className="max-w-xs rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-stone-900">
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
                  className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all hover:scale-[1.02] ${
                    isActive
                      ? "ring-2 ring-stone-900 ring-offset-1"
                      : ""
                  }`}
                  style={{
                    backgroundColor: `rgba(${r}, ${g}, ${b}, 0.12)`,
                  }}
                >
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: subject.color }}
                  />
                  <span className="truncate text-stone-800">{subject.name}</span>
                  {subject.type === "LK" && (
                    <span className="ml-auto shrink-0 bg-stone-200 text-stone-700 text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase leading-none">
                      LK
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {selectedSlot && (
            <button
              className="mt-2 w-full flex items-center justify-center gap-2 bg-red-50 text-red-700 rounded-xl px-4 py-2.5 font-medium hover:bg-red-100 transition-colors"
              onClick={handleClear}
            >
              <X className="h-4 w-4" />
              Fach entfernen
            </button>
          )}

          {selectedCell && selectedSlot && (
            <>
              <Separator className="my-3 bg-stone-100" />
              <div>
                <h4 className="mb-2 text-sm font-medium text-stone-800">
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
