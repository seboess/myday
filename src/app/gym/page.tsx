"use client";

import { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import type { DayOfWeek } from "@/lib/types";
import { DAY_OF_WEEK_LABELS, getTodayDay } from "@/lib/types";
import { CheckCircle2, Clock, MapPin, User, Dumbbell } from "lucide-react";

const DAYS_ORDER: DayOfWeek[] = ["mo", "di", "mi", "do", "fr", "sa", "so"];
const DAY_SHORT: Record<DayOfWeek, string> = {
  mo: "Mo",
  di: "Di",
  mi: "Mi",
  do: "Do",
  fr: "Fr",
  sa: "Sa",
  so: "So",
};

function getTodayISO(): string {
  return new Date().toISOString().split("T")[0];
}

export default function GymPage() {
  const gymCourses = useStore((s) => s.gymCourses);
  const myGymDays = useStore((s) => s.myGymDays);
  const toggleGymCourse = useStore((s) => s.toggleGymCourse);

  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(getTodayDay());
  const todayISO = getTodayISO();

  const todayGymDay = myGymDays.find((d) => d.date === todayISO);
  const addedCourseIds = new Set(todayGymDay?.courseIds ?? []);

  const coursesForDay = useMemo(() => {
    return gymCourses
      .filter((c) => c.day === selectedDay)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [gymCourses, selectedDay]);

  return (
    <div className="px-4 pb-24 pt-4 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">Gym-Kurse</h1>
        <p className="text-sm text-stone-500 mt-0.5">
          John Reed Womens Club — Prenzlauer Berg
        </p>
      </div>

      {/* Day tabs — Material You segmented button */}
      <div className="flex gap-1.5 overflow-x-auto py-1">
        {DAYS_ORDER.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              selectedDay === day
                ? "bg-stone-900 text-white"
                : "text-stone-500 hover:bg-stone-100"
            }`}
          >
            {DAY_SHORT[day]}
          </button>
        ))}
      </div>

      <p className="text-sm font-medium text-stone-500">
        {DAY_OF_WEEK_LABELS[selectedDay]}
        {selectedDay === getTodayDay() && (
          <span className="ml-2 inline-block bg-stone-200 text-stone-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
            Heute
          </span>
        )}
      </p>

      {/* Course list */}
      {coursesForDay.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <Dumbbell className="h-10 w-10 text-stone-300" />
          <p className="text-stone-400">
            Keine Kurse an diesem Tag
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {coursesForDay.map((course) => {
            const isAdded = addedCourseIds.has(course.id);
            return (
              <div
                key={course.id}
                className={`rounded-2xl p-4 transition-colors ${
                  isAdded
                    ? "bg-emerald-50"
                    : "bg-stone-50"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex-1 space-y-1">
                    <p className="font-medium text-stone-900">{course.name}</p>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-stone-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {course.time}
                      </span>
                      {course.trainer && (
                        <span className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5" />
                          {course.trainer}
                        </span>
                      )}
                      {course.room && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {course.room}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => toggleGymCourse(todayISO, course.id)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      isAdded
                        ? "bg-stone-900 text-white"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Dabei
                      </>
                    ) : (
                      "Hinzufuegen"
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
