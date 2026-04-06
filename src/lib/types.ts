export type Day = 'mo' | 'di' | 'mi' | 'do' | 'fr';
export type DayOfWeek = Day | 'sa' | 'so';
export type Semester = 'Q1' | 'Q2' | 'Q3' | 'Q4';
export type CourseType = 'GK' | 'LK';
export type GradeType = 'allgemein' | 'klausur';
export type DeadlineType = 'klausur' | 'hausaufgabe' | 'referat' | 'abgabe';

export interface Subject {
  id: string;
  name: string;
  color: string;
  type: CourseType;
}

export interface TimetableSlot {
  day: Day;
  period: number;
  subjectId: string;
}

export interface Grade {
  id: string;
  subjectId: string;
  semester: Semester;
  type: GradeType;
  points: number;
  weight: number;
  label?: string;
}

export interface Deadline {
  id: string;
  subjectId: string;
  title: string;
  type: DeadlineType;
  dueDate: string;
  notes?: string;
}

export interface GymCourse {
  id: string;
  name: string;
  time: string;
  day: DayOfWeek;
  trainer?: string;
  room?: string;
}

export interface Material {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  linkedTo: {
    type: 'timetable' | 'deadline';
    id: string;
  };
  createdAt: string;
}

export interface MyGymDay {
  date: string; // ISO date
  courseIds: string[];
}

export const DAY_LABELS: Record<Day, string> = {
  mo: 'Montag',
  di: 'Dienstag',
  mi: 'Mittwoch',
  do: 'Donnerstag',
  fr: 'Freitag',
};

export const DAY_OF_WEEK_LABELS: Record<DayOfWeek, string> = {
  mo: 'Montag',
  di: 'Dienstag',
  mi: 'Mittwoch',
  do: 'Donnerstag',
  fr: 'Freitag',
  sa: 'Samstag',
  so: 'Sonntag',
};

export const SEMESTER_LABELS: Record<Semester, string> = {
  Q1: '1. Halbjahr',
  Q2: '2. Halbjahr',
  Q3: '3. Halbjahr',
  Q4: '4. Halbjahr',
};

export const DEADLINE_TYPE_LABELS: Record<DeadlineType, string> = {
  klausur: 'Klausur',
  hausaufgabe: 'Hausaufgabe',
  referat: 'Referat',
  abgabe: 'Abgabe',
};

export const SUBJECT_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280', '#14b8a6',
];

export function getTodayDay(): DayOfWeek {
  const days: DayOfWeek[] = ['so', 'mo', 'di', 'mi', 'do', 'fr', 'sa'];
  return days[new Date().getDay()];
}

export function getTodaySchoolDay(): Day | null {
  const day = getTodayDay();
  if (day === 'sa' || day === 'so') return null;
  return day;
}
