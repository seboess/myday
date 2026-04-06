"use client";

import { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import type { DayOfWeek } from "@/lib/types";
import { DAY_OF_WEEK_LABELS, getTodayDay } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Gym-Kurse</h1>
        <p className="text-sm text-muted-foreground">
          John Reed Womens Club — Prenzlauer Berg
        </p>
      </div>

      {/* Day tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-lg bg-muted p-1">
        {DAYS_ORDER.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              selectedDay === day
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {DAY_SHORT[day]}
          </button>
        ))}
      </div>

      <p className="text-sm font-medium text-muted-foreground">
        {DAY_OF_WEEK_LABELS[selectedDay]}
        {selectedDay === getTodayDay() && (
          <Badge variant="secondary" className="ml-2 text-xs">
            Heute
          </Badge>
        )}
      </p>

      {/* Course list */}
      {coursesForDay.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <Dumbbell className="h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">
            Keine Kurse an diesem Tag
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {coursesForDay.map((course) => {
            const isAdded = addedCourseIds.has(course.id);
            return (
              <Card
                key={course.id}
                className={
                  isAdded
                    ? "border-emerald-300 bg-emerald-50/50 dark:border-emerald-700 dark:bg-emerald-950/20"
                    : ""
                }
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex-1 space-y-1">
                    <p className="font-semibold">{course.name}</p>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
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

                  <Button
                    variant={isAdded ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => toggleGymCourse(todayISO, course.id)}
                    className={
                      isAdded
                        ? "border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-300"
                        : ""
                    }
                  >
                    {isAdded ? (
                      <>
                        <CheckCircle2 className="mr-1.5 h-4 w-4" />
                        Hinzugefuegt
                      </>
                    ) : (
                      "Hinzufuegen"
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
