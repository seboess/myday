import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';
import type { Subject, TimetableSlot, Grade, Deadline, GymCourse, Material, MyGymDay, Day, Semester, GradeType, DeadlineType, DayOfWeek } from './types';

interface AppState {
  // Subjects
  subjects: Subject[];
  addSubject: (name: string, color: string, type: 'GK' | 'LK') => void;
  updateSubject: (id: string, updates: Partial<Omit<Subject, 'id'>>) => void;
  removeSubject: (id: string) => void;

  // Timetable
  timetable: TimetableSlot[];
  setTimetableSlot: (day: Day, period: number, subjectId: string) => void;
  clearTimetableSlot: (day: Day, period: number) => void;

  // Grades
  grades: Grade[];
  addGrade: (subjectId: string, semester: Semester, type: GradeType, points: number, weight: number, label?: string) => void;
  updateGrade: (id: string, updates: Partial<Omit<Grade, 'id'>>) => void;
  removeGrade: (id: string) => void;

  // Deadlines
  deadlines: Deadline[];
  addDeadline: (subjectId: string, title: string, type: DeadlineType, dueDate: string, notes?: string) => void;
  updateDeadline: (id: string, updates: Partial<Omit<Deadline, 'id'>>) => void;
  removeDeadline: (id: string) => void;

  // Gym
  gymCourses: GymCourse[];
  myGymDays: MyGymDay[];
  toggleGymCourse: (date: string, courseId: string) => void;

  // Materials (metadata only, blobs in IndexedDB)
  materials: Material[];
  addMaterial: (material: Omit<Material, 'id' | 'createdAt'>) => string;
  removeMaterial: (id: string) => void;

  // Backup
  lastBackupDate: string | null;
  setLastBackupDate: (date: string) => void;

  // Onboarding
  onboardingComplete: boolean;
  completeOnboarding: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Subjects
      subjects: [],
      addSubject: (name, color, type) =>
        set((s) => ({ subjects: [...s.subjects, { id: uuid(), name, color, type }] })),
      updateSubject: (id, updates) =>
        set((s) => ({ subjects: s.subjects.map((sub) => (sub.id === id ? { ...sub, ...updates } : sub)) })),
      removeSubject: (id) =>
        set((s) => ({ subjects: s.subjects.filter((sub) => sub.id !== id) })),

      // Timetable
      timetable: [],
      setTimetableSlot: (day, period, subjectId) =>
        set((s) => {
          const filtered = s.timetable.filter((t) => !(t.day === day && t.period === period));
          return { timetable: [...filtered, { day, period, subjectId }] };
        }),
      clearTimetableSlot: (day, period) =>
        set((s) => ({ timetable: s.timetable.filter((t) => !(t.day === day && t.period === period)) })),

      // Grades
      grades: [],
      addGrade: (subjectId, semester, type, points, weight, label) =>
        set((s) => ({ grades: [...s.grades, { id: uuid(), subjectId, semester, type, points, weight, label }] })),
      updateGrade: (id, updates) =>
        set((s) => ({ grades: s.grades.map((g) => (g.id === id ? { ...g, ...updates } : g)) })),
      removeGrade: (id) =>
        set((s) => ({ grades: s.grades.filter((g) => g.id !== id) })),

      // Deadlines
      deadlines: [],
      addDeadline: (subjectId, title, type, dueDate, notes) =>
        set((s) => ({ deadlines: [...s.deadlines, { id: uuid(), subjectId, title, type, dueDate, notes }] })),
      updateDeadline: (id, updates) =>
        set((s) => ({ deadlines: s.deadlines.map((d) => (d.id === id ? { ...d, ...updates } : d)) })),
      removeDeadline: (id) =>
        set((s) => ({ deadlines: s.deadlines.filter((d) => d.id !== id) })),

      // Gym
      gymCourses: defaultGymCourses(),
      myGymDays: [],
      toggleGymCourse: (date, courseId) =>
        set((s) => {
          const existing = s.myGymDays.find((d) => d.date === date);
          if (existing) {
            const has = existing.courseIds.includes(courseId);
            return {
              myGymDays: s.myGymDays.map((d) =>
                d.date === date
                  ? { ...d, courseIds: has ? d.courseIds.filter((c) => c !== courseId) : [...d.courseIds, courseId] }
                  : d
              ),
            };
          }
          return { myGymDays: [...s.myGymDays, { date, courseIds: [courseId] }] };
        }),

      // Materials
      materials: [],
      addMaterial: (material) => {
        const id = uuid();
        set((s) => ({ materials: [...s.materials, { ...material, id, createdAt: new Date().toISOString() }] }));
        return id;
      },
      removeMaterial: (id) =>
        set((s) => ({ materials: s.materials.filter((m) => m.id !== id) })),

      // Backup
      lastBackupDate: null,
      setLastBackupDate: (date) => set({ lastBackupDate: date }),

      // Onboarding
      onboardingComplete: false,
      completeOnboarding: () => set({ onboardingComplete: true }),
    }),
    { name: 'myday-store' }
  )
);

function defaultGymCourses(): GymCourse[] {
  return [
    { id: 'gym-1', name: 'Yoga Flow', time: '09:00-10:00', day: 'mo', trainer: 'Lisa', room: 'Kursraum 1' },
    { id: 'gym-2', name: 'Pilates', time: '10:30-11:30', day: 'mo', trainer: 'Anna', room: 'Kursraum 2' },
    { id: 'gym-3', name: 'HIIT', time: '17:00-17:45', day: 'mo', trainer: 'Sarah', room: 'Kursraum 1' },
    { id: 'gym-4', name: 'Spinning', time: '18:00-18:45', day: 'mo', trainer: 'Maria', room: 'Spinning-Raum' },
    { id: 'gym-5', name: 'Body Pump', time: '09:00-10:00', day: 'di', trainer: 'Julia', room: 'Kursraum 1' },
    { id: 'gym-6', name: 'Yoga Basics', time: '12:00-13:00', day: 'di', trainer: 'Lisa', room: 'Kursraum 2' },
    { id: 'gym-7', name: 'Zumba', time: '17:30-18:30', day: 'di', trainer: 'Carmen', room: 'Kursraum 1' },
    { id: 'gym-8', name: 'Stretching', time: '19:00-19:45', day: 'di', trainer: 'Anna', room: 'Kursraum 2' },
    { id: 'gym-9', name: 'Functional Training', time: '08:00-09:00', day: 'mi', trainer: 'Sarah', room: 'Kursraum 1' },
    { id: 'gym-10', name: 'Pilates', time: '10:00-11:00', day: 'mi', trainer: 'Anna', room: 'Kursraum 2' },
    { id: 'gym-11', name: 'Boxing Fitness', time: '17:00-18:00', day: 'mi', trainer: 'Kim', room: 'Kursraum 1' },
    { id: 'gym-12', name: 'Yoga Flow', time: '18:30-19:30', day: 'mi', trainer: 'Lisa', room: 'Kursraum 2' },
    { id: 'gym-13', name: 'HIIT', time: '09:00-09:45', day: 'do', trainer: 'Sarah', room: 'Kursraum 1' },
    { id: 'gym-14', name: 'Barre', time: '10:30-11:30', day: 'do', trainer: 'Julia', room: 'Kursraum 2' },
    { id: 'gym-15', name: 'Spinning', time: '17:30-18:15', day: 'do', trainer: 'Maria', room: 'Spinning-Raum' },
    { id: 'gym-16', name: 'Body Pump', time: '18:30-19:30', day: 'do', trainer: 'Julia', room: 'Kursraum 1' },
    { id: 'gym-17', name: 'Yoga Flow', time: '09:00-10:00', day: 'fr', trainer: 'Lisa', room: 'Kursraum 1' },
    { id: 'gym-18', name: 'Zumba', time: '10:30-11:30', day: 'fr', trainer: 'Carmen', room: 'Kursraum 1' },
    { id: 'gym-19', name: 'Functional Training', time: '16:00-17:00', day: 'fr', trainer: 'Sarah', room: 'Kursraum 1' },
    { id: 'gym-20', name: 'Yoga Basics', time: '10:00-11:00', day: 'sa', trainer: 'Lisa', room: 'Kursraum 1' },
    { id: 'gym-21', name: 'HIIT', time: '11:30-12:15', day: 'sa', trainer: 'Sarah', room: 'Kursraum 1' },
    { id: 'gym-22', name: 'Pilates', time: '10:00-11:00', day: 'so', trainer: 'Anna', room: 'Kursraum 2' },
  ];
}

// Abi calculation helper
export function calculateAbiGrade(totalPoints: number): number | null {
  if (totalPoints < 300) return null; // nicht bestanden
  if (totalPoints > 900) return 1.0;
  const grade = 17 / 3 - totalPoints / 180;
  return Math.max(1.0, Math.min(4.0, Math.round(grade * 10) / 10));
}

export function getSubjectSemesterAverage(grades: Grade[], subjectId: string, semester: Semester): number | null {
  const semGrades = grades.filter((g) => g.subjectId === subjectId && g.semester === semester);
  if (semGrades.length === 0) return null;
  const totalWeight = semGrades.reduce((sum, g) => sum + g.weight, 0);
  if (totalWeight === 0) return null;
  const weightedSum = semGrades.reduce((sum, g) => sum + g.points * g.weight, 0);
  return Math.round((weightedSum / totalWeight) * 10) / 10;
}
