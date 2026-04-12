'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import {
  getTodayDay,
  getTodaySchoolDay,
  DAY_OF_WEEK_LABELS,
  DEADLINE_TYPE_LABELS,
  SCHEDULE,
} from '@/lib/types';
import type { Day, DayOfWeek } from '@/lib/types';
import { Plus, X, Check } from 'lucide-react';


function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export default function Home() {
  const subjects = useStore((s) => s.subjects);
  const timetable = useStore((s) => s.timetable);
  const grades = useStore((s) => s.grades);
  const deadlines = useStore((s) => s.deadlines);
  const gymCourses = useStore((s) => s.gymCourses);
  const myGymDays = useStore((s) => s.myGymDays);
  const toggleGymCourse = useStore((s) => s.toggleGymCourse);
  const syncing = useStore((s) => s.syncing);
  const todos = useStore((s) => s.todos);
  const addTodo = useStore((s) => s.addTodo);
  const toggleTodo = useStore((s) => s.toggleTodo);
  const removeTodo = useStore((s) => s.removeTodo);

  const [newTodoText, setNewTodoText] = useState('');

  const todayDayOfWeek: DayOfWeek = getTodayDay();
  const todaySchoolDay: Day | null = getTodaySchoolDay();
  const isWeekend = todaySchoolDay === null;
  const dateString = todayISO();

  const todaySlots = useMemo(() => {
    if (!todaySchoolDay) return [];
    return timetable
      .filter((slot) => slot.day === todaySchoolDay)
      .sort((a, b) => a.period - b.period);
  }, [timetable, todaySchoolDay]);

  const todayGymDay = useMemo(
    () => myGymDays.find((d) => d.date === dateString),
    [myGymDays, dateString]
  );

  const todayGymCourses = useMemo(() => {
    const allToday = gymCourses.filter((c) => c.day === todayDayOfWeek);
    // If a course is selected for today, only show that one
    if (todayGymDay && todayGymDay.courseIds.length > 0) {
      return allToday.filter((c) => todayGymDay.courseIds.includes(c.id));
    }
    return allToday;
  }, [gymCourses, todayDayOfWeek, todayGymDay]);

  const hasSelectedGymCourse = (todayGymDay?.courseIds.length ?? 0) > 0;

  const upcomingDeadlines = useMemo(() => {
    return deadlines
      .filter((d) => {
        if (d.done) return false;
        const days = daysUntil(d.dueDate);
        return days >= 0 && days <= 7;
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [deadlines]);

  const urgentDeadlines = useMemo(() => {
    return deadlines.filter((d) => {
      if (d.done) return false;
      const days = daysUntil(d.dueDate);
      return days >= 0 && days <= 3;
    });
  }, [deadlines]);

  const abiSchnitt = useMemo(() => {
    if (grades.length === 0) return null;
    const totalWeight = grades.reduce((sum, g) => sum + g.weight, 0);
    if (totalWeight === 0) return null;
    const weightedSum = grades.reduce((sum, g) => sum + g.points * g.weight, 0);
    const avgPoints = weightedSum / totalWeight;
    const grade = (17 - avgPoints) / 3;
    return Math.max(1.0, Math.min(6.0, Math.round(grade * 10) / 10));
  }, [grades]);

  const subjectMap = useMemo(() => {
    const map: Record<string, (typeof subjects)[0]> = {};
    for (const s of subjects) {
      map[s.id] = s;
    }
    return map;
  }, [subjects]);

  const todayTodos = useMemo(() => {
    return todos.filter((t) => t.date === dateString);
  }, [todos, dateString]);

  function handleAddTodo() {
    const text = newTodoText.trim();
    if (!text) return;
    addTodo(text, dateString);
    setNewTodoText('');
  }

  // --- Loading screen while syncing from Supabase ---
  if (syncing) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-stone-900" />
      </div>
    );
  }

  // --- Onboarding screen (no subjects yet) ---
  if (subjects.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-20">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-stone-50 text-3xl">
            <span className="text-4xl">&#x1F393;</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-900">
            Willkommen bei MyDay!
          </h1>
          <p className="max-w-xs text-stone-500">
            Dein Schulplaner, Notentracker und Gym-Begleiter &mdash; alles an einem Ort.
          </p>
          <Link href="/einstellungen">
            <button className="mt-2 bg-stone-900 px-8 py-3 text-base font-medium text-white rounded-xl hover:bg-stone-800 transition-colors">
              Richte zuerst deine F&auml;cher ein
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // --- Morning Briefing ---
  return (
    <div className="flex flex-col gap-4 px-4 pb-24 pt-4">
      {/* Tagesuebersicht Header */}
      <div className="mb-1">
        <h2 className="text-2xl font-semibold text-stone-900">
          Heute: {DAY_OF_WEEK_LABELS[todayDayOfWeek]},{' '}
          {new Date().toLocaleDateString('de-DE', {
            day: 'numeric',
            month: 'long',
          })}
        </h2>
      </div>

      {/* Warn-Banner: Urgent deadlines */}
      {urgentDeadlines.length > 0 && (
        <div className="flex flex-col gap-2">
          {urgentDeadlines.map((dl) => {
            const days = daysUntil(dl.dueDate);
            const subj = subjectMap[dl.subjectId];
            const isRed = days <= 1;
            return (
              <div
                key={dl.id}
                className={`flex items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-medium ${
                  isRed
                    ? 'bg-red-50 text-red-800'
                    : 'bg-amber-50 text-amber-800'
                }`}
              >
                <span className="text-base">{isRed ? '\u26A0\uFE0F' : '\u26A0\uFE0F'}</span>
                <span className="flex-1">
                  {subj?.name ?? 'Fach'}: {dl.title} in{' '}
                  {days === 0
                    ? 'heute!'
                    : days === 1
                    ? '1 Tag'
                    : `${days} Tagen`}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* To-Do Liste */}
      <div className="bg-stone-50 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-stone-500"
          >
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
          <h3 className="text-base font-medium text-stone-800">To-Do heute</h3>
        </div>
        <div className="flex flex-col gap-0">
          {todayTodos.map((todo, idx) => (
            <div
              key={todo.id}
              className={`flex items-center gap-3 py-2 ${
                idx > 0 ? 'border-t border-stone-100' : ''
              }`}
            >
              <button
                onClick={() => toggleTodo(todo.id)}
                className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  todo.done
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-stone-300 hover:border-stone-400'
                }`}
              >
                {todo.done && <Check className="h-3.5 w-3.5" />}
              </button>
              <span
                className={`flex-1 text-sm ${
                  todo.done
                    ? 'text-stone-400 line-through'
                    : 'text-stone-800'
                }`}
              >
                {todo.text}
              </span>
              <button
                onClick={() => removeTodo(todo.id)}
                className="h-6 w-6 flex-shrink-0 flex items-center justify-center rounded-full text-stone-300 hover:text-red-500 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <input
            type="text"
            value={newTodoText}
            onChange={(e) => setNewTodoText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
            placeholder="Neues To-Do..."
            className="flex-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-300"
          />
          <button
            onClick={handleAddTodo}
            disabled={!newTodoText.trim()}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-900 text-white hover:bg-stone-800 transition-colors disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Naechste Deadlines */}
      <div className="bg-stone-50 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-stone-500"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <h3 className="text-base font-medium text-stone-800">N&auml;chste Deadlines</h3>
        </div>
        {upcomingDeadlines.length === 0 ? (
          <p className="py-4 text-center text-stone-400">
            Keine Deadlines in den n&auml;chsten 7 Tagen
          </p>
        ) : (
          <div className="flex flex-col gap-0">
            {upcomingDeadlines.map((dl, idx) => {
              const days = daysUntil(dl.dueDate);
              const subj = subjectMap[dl.subjectId];
              const dateLabel = new Date(dl.dueDate).toLocaleDateString(
                'de-DE',
                { weekday: 'short', day: 'numeric', month: 'short' }
              );
              const urgencyColor =
                days <= 2
                  ? 'text-red-700'
                  : days <= 5
                  ? 'text-amber-700'
                  : 'text-stone-500';
              const urgencyBg =
                days <= 2
                  ? 'bg-red-100'
                  : days <= 5
                  ? 'bg-amber-50'
                  : 'bg-stone-100';

              return (
                <div
                  key={dl.id}
                  className={`flex items-start gap-3 py-2.5 ${
                    idx > 0 ? 'border-t border-stone-100' : ''
                  }`}
                >
                  {/* Date badge */}
                  <div
                    className={`flex flex-shrink-0 flex-col items-center rounded-xl px-2.5 py-1.5 ${urgencyBg}`}
                  >
                    <span className={`text-[10px] font-medium ${urgencyColor}`}>
                      {dateLabel}
                    </span>
                  </div>
                  {/* Content */}
                  <div className="flex flex-1 flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="bg-stone-200 text-stone-700 text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                        {DEADLINE_TYPE_LABELS[dl.type]}
                      </span>
                      {subj && (
                        <span className="flex items-center gap-1 text-xs text-stone-500">
                          <span
                            className="inline-block h-2 w-2 rounded-full"
                            style={{ backgroundColor: subj.color }}
                          />
                          {subj.name}
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-medium text-stone-800">
                      {dl.title}
                    </span>
                  </div>
                  {/* Days indicator */}
                  <span
                    className={`flex-shrink-0 text-xs font-semibold tabular-nums ${urgencyColor}`}
                  >
                    {days === 0
                      ? 'Heute'
                      : days === 1
                      ? 'Morgen'
                      : `${days}d`}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Gym-Kurse heute */}
      <div className="bg-stone-50 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-stone-500"
          >
            <path d="M6.5 6.5h11" />
            <path d="M6.5 17.5h11" />
            <path d="M12 6.5v11" />
            <rect x="2" y="8" width="4" height="8" rx="1" />
            <rect x="18" y="8" width="4" height="8" rx="1" />
            <rect x="5" y="6" width="2" height="12" rx="0.5" />
            <rect x="17" y="6" width="2" height="12" rx="0.5" />
          </svg>
          <h3 className="text-base font-medium text-stone-800">
            Gym-Kurse heute
            {hasSelectedGymCourse && (
              <span className="ml-2 text-xs font-normal text-stone-400">
                (dein Kurs)
              </span>
            )}
          </h3>
        </div>
        {todayGymCourses.length === 0 ? (
          <p className="py-4 text-center text-stone-400">
            Keine Kurse heute
          </p>
        ) : (
          <div className="flex flex-col gap-0">
            {todayGymCourses.map((course, idx) => {
              const isAdded =
                todayGymDay?.courseIds.includes(course.id) ?? false;
              return (
                <div
                  key={course.id}
                  className={`flex items-center justify-between py-2.5 ${
                    idx > 0 ? 'border-t border-stone-100' : ''
                  }`}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-stone-800">
                      {course.name}
                    </span>
                    <span className="text-xs text-stone-400">
                      {course.time}
                      {course.trainer ? ` \u00B7 ${course.trainer}` : ''}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleGymCourse(dateString, course.id)}
                    className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                      isAdded
                        ? 'bg-stone-900 text-white'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {isAdded ? 'Entfernen' : 'Hinzuf\u00FCgen'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Heutiger Stundenplan */}
      <div className="bg-stone-50 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-stone-500"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <h3 className="text-base font-medium text-stone-800">Heutiger Stundenplan</h3>
        </div>
        {isWeekend ? (
          <div className="py-4 text-center text-stone-500">
            <span className="text-2xl">&#x1F389;</span>
            <p className="mt-1 font-medium">Heute ist Wochenende!</p>
          </div>
        ) : todaySlots.length === 0 ? (
          <p className="py-4 text-center text-stone-400">
            Keine Stunden heute
          </p>
        ) : (
          <div className="flex flex-col gap-0">
            {todaySlots.map((slot, idx) => {
              const subj = subjectMap[slot.subjectId];
              return (
                <div
                  key={`${slot.day}-${slot.period}`}
                  className={`flex items-center gap-3 py-2.5 ${
                    idx > 0 ? 'border-t border-stone-100' : ''
                  }`}
                >
                  {/* Period number */}
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-stone-100 text-sm font-medium text-stone-600">
                    {slot.period}
                  </div>
                  {/* Time */}
                  <span className="w-[110px] flex-shrink-0 text-xs text-stone-400">
                    {todaySchoolDay ? (SCHEDULE[todaySchoolDay].times[slot.period] ?? '') : ''}
                  </span>
                  {/* Subject */}
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: subj?.color ?? '#9ca3af' }}
                    />
                    <span className="text-sm font-medium text-stone-800">
                      {subj?.name ?? 'Unbekannt'}
                    </span>
                    {subj?.type === 'LK' && (
                      <span className="bg-stone-200 text-stone-700 text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                        LK
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Noten-Trend */}
      <div className="bg-stone-50 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-stone-500"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <h3 className="text-base font-medium text-stone-800">Noten-Trend</h3>
        </div>
        {abiSchnitt === null ? (
          <p className="py-4 text-center text-stone-400">
            Noch keine Noten eingetragen
          </p>
        ) : (
          <div className="flex flex-col items-center gap-1 py-2">
            <span className="text-xs font-medium uppercase tracking-wider text-stone-500">
              Abi-Schnitt Prognose
            </span>
            <span
              className={`text-4xl font-bold tabular-nums ${
                abiSchnitt <= 2.0
                  ? 'text-green-600'
                  : abiSchnitt <= 3.0
                  ? 'text-amber-500'
                  : 'text-red-500'
              }`}
            >
              {abiSchnitt.toFixed(1)}
            </span>
            <span className="text-xs text-stone-400">
              basierend auf {grades.length} Note{grades.length !== 1 ? 'n' : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
