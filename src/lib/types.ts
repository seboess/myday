export type Day = 'mo' | 'di' | 'mi' | 'do' | 'fr';
export type DayOfWeek = Day | 'sa' | 'so';
export type Semester = 'Q1' | 'Q2' | 'Q3' | 'Q4';
export type CourseType = 'GK' | 'LK';
export type GradeType = 'allgemein' | 'klausur';
export type DeadlineType = 'klausur' | 'hausaufgabe' | 'referat' | 'abgabe' | 'test' | 'lek';

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
  done?: boolean;
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

export interface Todo {
  id: string;
  text: string;
  done: boolean;
  date: string; // ISO date
}

export interface AbiExam {
  id: string;
  subjectId: string;
  type: 'written' | 'oral';
  points: number | null;
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
  test: 'Test',
  lek: 'LEK',
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

export const MAX_PERIODS = 9;

export const SCHEDULE: Record<Day, { periods: number; times: Record<number, string> }> = {
  mo: {
    periods: 8,
    times: {
      1: '09:30 - 10:15', 2: '10:15 - 11:00',
      3: '11:15 - 12:00', 4: '12:00 - 12:45',
      5: '13:05 - 13:50', 6: '13:50 - 14:35',
      7: '14:50 - 15:35', 8: '15:35 - 16:20',
    },
  },
  di: {
    periods: 9,
    times: {
      1: '08:00 - 08:45', 2: '08:45 - 09:30',
      3: '09:50 - 10:35', 4: '10:35 - 11:20',
      5: '11:45 - 12:30', 6: '12:30 - 13:15',
      7: '13:40 - 14:25', 8: '14:25 - 15:10', 9: '15:10 - 15:55',
    },
  },
  mi: {
    periods: 8,
    times: {
      1: '08:00 - 08:45', 2: '08:45 - 09:30',
      3: '09:50 - 10:35', 4: '10:35 - 11:20',
      5: '11:45 - 12:30', 6: '12:30 - 13:15',
      7: '13:40 - 14:25', 8: '14:25 - 15:10',
    },
  },
  do: {
    periods: 9,
    times: {
      1: '08:00 - 08:45', 2: '08:45 - 09:30',
      3: '09:50 - 10:35', 4: '10:35 - 11:20',
      5: '11:20 - 12:05', 6: '12:05 - 12:50',
      7: '13:40 - 14:25', 8: '14:25 - 15:10', 9: '15:10 - 15:55',
    },
  },
  fr: {
    periods: 9,
    times: {
      1: '08:00 - 08:45', 2: '08:45 - 09:30',
      3: '09:50 - 10:35', 4: '10:35 - 11:20',
      5: '11:45 - 12:30', 6: '12:30 - 13:15',
      7: '13:40 - 14:25', 8: '14:25 - 15:10', 9: '15:10 - 15:55',
    },
  },
};
