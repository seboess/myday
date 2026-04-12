import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import type { Subject, TimetableSlot, Grade, Deadline, GymCourse, Material, MyGymDay, Todo, AbiExam, Day, Semester, GradeType, DeadlineType } from './types';
import { supabase, isSupabaseConfigured } from './supabase';
import { loadUserData } from './supabase-sync';

interface AppState {
  // Auth / sync
  userId: string | null;
  syncing: boolean;
  loadFromSupabase: (userId: string) => Promise<void>;

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
  completeDeadline: (id: string) => void;
  uncompleteDeadline: (id: string) => void;

  // Gym
  gymCourses: GymCourse[];
  myGymDays: MyGymDay[];
  toggleGymCourse: (date: string, courseId: string) => void;

  // Materials (metadata only, blobs in Supabase Storage)
  materials: Material[];
  addMaterial: (material: Omit<Material, 'id' | 'createdAt'>) => string;
  removeMaterial: (id: string) => void;

  // Todos
  todos: Todo[];
  addTodo: (text: string, date: string) => void;
  toggleTodo: (id: string) => void;
  removeTodo: (id: string) => void;

  // Abi Exams
  abiExams: AbiExam[];
  addAbiExam: (subjectId: string, type: 'written' | 'oral') => void;
  updateAbiExam: (id: string, updates: Partial<Omit<AbiExam, 'id'>>) => void;
  removeAbiExam: (id: string) => void;
}

export const useStore = create<AppState>()((set, get) => ({
  // Auth / sync
  userId: null,
  syncing: false,

  loadFromSupabase: async (userId: string) => {
    set({ syncing: true, userId });
    try {
      const data = await loadUserData(userId);
      set({
        subjects: data.subjects,
        timetable: data.timetable,
        grades: data.grades,
        deadlines: data.deadlines,
        materials: data.materials,
        myGymDays: data.myGymDays,
        todos: data.todos ?? [],
        abiExams: data.abiExams ?? [],
        syncing: false,
      });
    } catch {
      set({ syncing: false });
    }
  },

  // Subjects
  subjects: [],
  addSubject: (name, color, type) => {
    const id = uuid();
    set((s) => ({ subjects: [...s.subjects, { id, name, color, type }] }));
    const { userId } = get();
    if (userId && isSupabaseConfigured) {
      supabase.from('subjects').insert({ id, user_id: userId, name, color, type }).then();
    }
  },
  updateSubject: (id, updates) => {
    set((s) => ({ subjects: s.subjects.map((sub) => (sub.id === id ? { ...sub, ...updates } : sub)) }));
    const { userId } = get();
    if (userId && isSupabaseConfigured) {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.color !== undefined) dbUpdates.color = updates.color;
      if (updates.type !== undefined) dbUpdates.type = updates.type;
      supabase.from('subjects').update(dbUpdates).eq('id', id).eq('user_id', userId).then();
    }
  },
  removeSubject: (id) => {
    set((s) => ({ subjects: s.subjects.filter((sub) => sub.id !== id) }));
    const { userId } = get();
    if (userId && isSupabaseConfigured) {
      supabase.from('subjects').delete().eq('id', id).eq('user_id', userId).then();
    }
  },

  // Timetable
  timetable: [],
  setTimetableSlot: (day, period, subjectId) => {
    set((s) => {
      const filtered = s.timetable.filter((t) => !(t.day === day && t.period === period));
      return { timetable: [...filtered, { day, period, subjectId }] };
    });
    const { userId } = get();
    if (userId && isSupabaseConfigured) {
      // Upsert: delete then insert (Supabase upsert needs all unique cols)
      supabase
        .from('timetable_slots')
        .delete()
        .eq('user_id', userId)
        .eq('day', day)
        .eq('period', period)
        .then(() => {
          supabase
            .from('timetable_slots')
            .insert({ user_id: userId, day, period, subject_id: subjectId })
            .then();
        });
    }
  },
  clearTimetableSlot: (day, period) => {
    set((s) => ({ timetable: s.timetable.filter((t) => !(t.day === day && t.period === period)) }));
    const { userId } = get();
    if (userId && isSupabaseConfigured) {
      supabase.from('timetable_slots').delete().eq('user_id', userId).eq('day', day).eq('period', period).then();
    }
  },

  // Grades
  grades: [],
  addGrade: (subjectId, semester, type, points, weight, label) => {
    const id = uuid();
    set((s) => ({ grades: [...s.grades, { id, subjectId, semester, type, points, weight, label }] }));
    const { userId } = get();
    if (userId && isSupabaseConfigured) {
      supabase
        .from('grades')
        .insert({ id, user_id: userId, subject_id: subjectId, semester, type, points, weight, label: label ?? null })
        .then();
    }
  },
  updateGrade: (id, updates) => {
    set((s) => ({ grades: s.grades.map((g) => (g.id === id ? { ...g, ...updates } : g)) }));
    const { userId } = get();
    if (userId && isSupabaseConfigured) {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.subjectId !== undefined) dbUpdates.subject_id = updates.subjectId;
      if (updates.semester !== undefined) dbUpdates.semester = updates.semester;
      if (updates.type !== undefined) dbUpdates.type = updates.type;
      if (updates.points !== undefined) dbUpdates.points = updates.points;
      if (updates.weight !== undefined) dbUpdates.weight = updates.weight;
      if (updates.label !== undefined) dbUpdates.label = updates.label;
      supabase.from('grades').update(dbUpdates).eq('id', id).eq('user_id', userId).then();
    }
  },
  removeGrade: (id) => {
    set((s) => ({ grades: s.grades.filter((g) => g.id !== id) }));
    const { userId } = get();
    if (userId && isSupabaseConfigured) {
      supabase.from('grades').delete().eq('id', id).eq('user_id', userId).then();
    }
  },

  // Deadlines
  deadlines: [],
  addDeadline: (subjectId, title, type, dueDate, notes) => {
    const id = uuid();
    set((s) => ({ deadlines: [...s.deadlines, { id, subjectId, title, type, dueDate, notes }] }));
    const { userId } = get();
    if (userId && isSupabaseConfigured) {
      supabase
        .from('deadlines')
        .insert({ id, user_id: userId, subject_id: subjectId, title, type, due_date: dueDate, notes: notes ?? null })
        .then();
    }
  },
  updateDeadline: (id, updates) => {
    set((s) => ({ deadlines: s.deadlines.map((d) => (d.id === id ? { ...d, ...updates } : d)) }));
    const { userId } = get();
    if (userId && isSupabaseConfigured) {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.subjectId !== undefined) dbUpdates.subject_id = updates.subjectId;
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.type !== undefined) dbUpdates.type = updates.type;
      if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
      supabase.from('deadlines').update(dbUpdates).eq('id', id).eq('user_id', userId).then();
    }
  },
  removeDeadline: (id: string) => {
    set((s) => ({ deadlines: s.deadlines.filter((d: Deadline) => d.id !== id) }));
    const { userId } = get();
    if (userId && isSupabaseConfigured) {
      supabase.from('deadlines').delete().eq('id', id).eq('user_id', userId).then();
    }
  },
  completeDeadline: (id: string) => {
    set((s) => ({ deadlines: s.deadlines.map((d: Deadline) => (d.id === id ? { ...d, done: true } : d)) }));
    const { userId } = get();
    if (userId && isSupabaseConfigured) {
      supabase.from('deadlines').update({ done: true }).eq('id', id).eq('user_id', userId).then();
    }
  },
  uncompleteDeadline: (id: string) => {
    set((s) => ({ deadlines: s.deadlines.map((d: Deadline) => (d.id === id ? { ...d, done: false } : d)) }));
    const { userId } = get();
    if (userId && isSupabaseConfigured) {
      supabase.from('deadlines').update({ done: false }).eq('id', id).eq('user_id', userId).then();
    }
  },

  // Gym
  gymCourses: defaultGymCourses(),
  myGymDays: [],
  toggleGymCourse: (date, courseId) => {
    const state = get();
    const existing = state.myGymDays.find((d) => d.date === date);
    const isRemoving = existing?.courseIds.includes(courseId) ?? false;

    set((s) => {
      const existingDay = s.myGymDays.find((d) => d.date === date);
      if (existingDay) {
        const has = existingDay.courseIds.includes(courseId);
        return {
          myGymDays: s.myGymDays.map((d) =>
            d.date === date
              ? { ...d, courseIds: has ? d.courseIds.filter((c) => c !== courseId) : [...d.courseIds, courseId] }
              : d
          ),
        };
      }
      return { myGymDays: [...s.myGymDays, { date, courseIds: [courseId] }] };
    });

    const { userId } = get();
    if (userId && isSupabaseConfigured) {
      if (isRemoving) {
        supabase.from('my_gym_days').delete().eq('user_id', userId).eq('date', date).eq('course_id', courseId).then();
      } else {
        supabase.from('my_gym_days').insert({ user_id: userId, date, course_id: courseId }).then();
      }
    }
  },

  // Materials
  materials: [],
  addMaterial: (material) => {
    const id = uuid();
    const createdAt = new Date().toISOString();
    set((s) => ({ materials: [...s.materials, { ...material, id, createdAt }] }));
    const { userId } = get();
    if (userId && isSupabaseConfigured) {
      supabase
        .from('materials')
        .insert({
          id,
          user_id: userId,
          name: material.name,
          mime_type: material.mimeType,
          size: material.size,
          linked_type: material.linkedTo.type,
          linked_id: material.linkedTo.id,
          storage_path: `${userId}/${id}/${material.name}`,
        })
        .then();
    }
    return id;
  },
  removeMaterial: (id: string) => {
    set((s) => ({ materials: s.materials.filter((m: Material) => m.id !== id) }));
    const { userId } = get();
    if (userId && isSupabaseConfigured) {
      supabase.from('materials').delete().eq('id', id).eq('user_id', userId).then();
    }
  },

  // Todos
  todos: [],
  addTodo: (text: string, date: string) => {
    const id = uuid();
    set((s) => ({ todos: [...s.todos, { id, text, done: false, date }] }));
    const { userId } = get();
    if (userId && isSupabaseConfigured) {
      supabase.from('todos').insert({ id, user_id: userId, text, done: false, date }).then();
    }
  },
  toggleTodo: (id: string) => {
    const todo = get().todos.find((t: Todo) => t.id === id);
    if (!todo) return;
    const newDone = !todo.done;
    set((s) => ({ todos: s.todos.map((t: Todo) => (t.id === id ? { ...t, done: newDone } : t)) }));
    const { userId } = get();
    if (userId && isSupabaseConfigured) {
      supabase.from('todos').update({ done: newDone }).eq('id', id).eq('user_id', userId).then();
    }
  },
  removeTodo: (id: string) => {
    set((s) => ({ todos: s.todos.filter((t: Todo) => t.id !== id) }));
    const { userId } = get();
    if (userId && isSupabaseConfigured) {
      supabase.from('todos').delete().eq('id', id).eq('user_id', userId).then();
    }
  },

  // Abi Exams
  abiExams: [],
  addAbiExam: (subjectId: string, type: 'written' | 'oral') => {
    const id = uuid();
    set((s) => ({ abiExams: [...s.abiExams, { id, subjectId, type, points: null }] }));
    const { userId } = get();
    if (userId && isSupabaseConfigured) {
      supabase.from('abi_exams').insert({ id, user_id: userId, subject_id: subjectId, type, points: null }).then();
    }
  },
  updateAbiExam: (id: string, updates: Partial<Omit<AbiExam, 'id'>>) => {
    set((s) => ({ abiExams: s.abiExams.map((e: AbiExam) => (e.id === id ? { ...e, ...updates } : e)) }));
    const { userId } = get();
    if (userId && isSupabaseConfigured) {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.subjectId !== undefined) dbUpdates.subject_id = updates.subjectId;
      if (updates.type !== undefined) dbUpdates.type = updates.type;
      if (updates.points !== undefined) dbUpdates.points = updates.points;
      supabase.from('abi_exams').update(dbUpdates).eq('id', id).eq('user_id', userId).then();
    }
  },
  removeAbiExam: (id: string) => {
    set((s) => ({ abiExams: s.abiExams.filter((e: AbiExam) => e.id !== id) }));
    const { userId } = get();
    if (userId && isSupabaseConfigured) {
      supabase.from('abi_exams').delete().eq('id', id).eq('user_id', userId).then();
    }
  },
}));

function defaultGymCourses(): GymCourse[] {
  // Real course data from John Reed Womens Club Prenzlauer Berg (April 2026)
  return [
    // MONTAG
    { id: 'gym-mo-1', name: 'PILATES', time: '10:00-10:50', day: 'mo', trainer: 'Katharina', room: 'Kursraum 2' },
    { id: 'gym-mo-2', name: 'PUMP IT', time: '11:00-11:50', day: 'mo', trainer: 'Katharina', room: 'Kursraum 2' },

    // DIENSTAG
    { id: 'gym-di-1', name: 'JR: HATHA YOGA', time: '08:00-08:50', day: 'di', trainer: 'Karl Henrik', room: 'Kursraum 2' },
    { id: 'gym-di-2', name: 'TOTAL BODY WORKOUT', time: '09:00-09:50', day: 'di', trainer: 'Andrea', room: 'Kursraum 2' },
    { id: 'gym-di-3', name: 'PILATES', time: '10:00-10:50', day: 'di', trainer: 'Andrea', room: 'Kursraum 2' },
    { id: 'gym-di-4', name: 'BIKES & BEATS', time: '11:00-11:50', day: 'di', trainer: 'Irene', room: 'Cycling' },
    { id: 'gym-di-5', name: 'JRW: BIKES & BEATS', time: '12:00-12:50', day: 'di', trainer: 'Irene', room: 'Cycling' },
    { id: 'gym-di-6', name: 'TANTRA YOGA', time: '17:00-17:50', day: 'di', trainer: 'Nazhat', room: 'Kursraum' },
    { id: 'gym-di-7', name: 'SIXPACK', time: '18:00-18:20', day: 'di', trainer: 'Katharina', room: 'Kursraum 2' },
    { id: 'gym-di-8', name: 'JRW: BIKES & BEATS', time: '18:00-18:50', day: 'di', trainer: 'Mike', room: 'Cycling' },
    { id: 'gym-di-9', name: 'JRW: Mobility x Pelvic Floor', time: '18:30-18:50', day: 'di', trainer: 'Katharina', room: 'Kursraum 2' },
    { id: 'gym-di-10', name: 'PILATES', time: '19:00-19:50', day: 'di', trainer: 'Laura', room: 'Kursraum 2' },
    { id: 'gym-di-11', name: 'JR SALSATION', time: '20:00-20:50', day: 'di', room: 'Kursraum' },
    { id: 'gym-di-12', name: 'BARRE', time: '20:00-20:50', day: 'di', trainer: 'Laura', room: 'Kursraum 2' },

    // MITTWOCH
    { id: 'gym-mi-1', name: 'TOTAL BODY WORKOUT', time: '08:30-09:20', day: 'mi', trainer: 'Andrea', room: 'Kursraum 2' },
    { id: 'gym-mi-2', name: 'JR: BACK', time: '09:30-09:50', day: 'mi', trainer: 'Andrea', room: 'Kursraum 2' },
    { id: 'gym-mi-3', name: 'PILATES', time: '10:00-10:50', day: 'mi', trainer: 'Andrea', room: 'Kursraum 2' },
    { id: 'gym-mi-4', name: 'JR: POWER PILATES', time: '11:10-12:00', day: 'mi', trainer: 'Marina', room: 'Kursraum 2' },
    { id: 'gym-mi-5', name: 'JRW: BIKES & BEATS', time: '12:00-12:50', day: 'mi', trainer: 'Irene', room: 'Cycling' },
    { id: 'gym-mi-6', name: 'BOOTY BOOST', time: '13:00-13:20', day: 'mi', trainer: 'Adina', room: 'Kursraum 2' },
    { id: 'gym-mi-7', name: 'SIXPACK', time: '13:30-13:50', day: 'mi', trainer: 'Adina', room: 'Kursraum 2' },
    { id: 'gym-mi-8', name: 'TOTAL BODY WORKOUT', time: '17:00-17:50', day: 'mi', trainer: 'Katharina', room: 'Kursraum 2' },
    { id: 'gym-mi-9', name: 'PILATES', time: '18:00-18:50', day: 'mi', trainer: 'Daniela', room: 'Kursraum 2' },
    { id: 'gym-mi-10', name: 'JRW: BIKES & BEATS', time: '18:00-18:50', day: 'mi', trainer: 'Irene', room: 'Cycling' },
    { id: 'gym-mi-11', name: 'JRW: TWERKOUT', time: '18:00-18:50', day: 'mi', trainer: 'Alex W.', room: 'Kursraum' },
    { id: 'gym-mi-12', name: 'MOBILITY ZONE', time: '19:00-19:20', day: 'mi', trainer: 'Alex W.', room: 'Kursraum' },
    { id: 'gym-mi-13', name: 'BARRE', time: '19:00-19:50', day: 'mi', trainer: 'Lu', room: 'Kursraum 2' },
    { id: 'gym-mi-14', name: 'PILATES', time: '20:00-20:50', day: 'mi', trainer: 'Lu', room: 'Kursraum 2' },

    // DONNERSTAG
    { id: 'gym-do-1', name: 'JR: HATHA YOGA', time: '08:00-08:50', day: 'do', trainer: 'Karl Henrik', room: 'Kursraum 2' },
    { id: 'gym-do-2', name: 'JR: POWER PILATES', time: '09:00-09:50', day: 'do', trainer: 'Andrea', room: 'Kursraum 2' },
    { id: 'gym-do-3', name: 'JR: BACK', time: '10:00-10:20', day: 'do', trainer: 'Andrea', room: 'Kursraum 2' },
    { id: 'gym-do-4', name: 'JR: DANCE', time: '10:00-10:50', day: 'do', trainer: 'Alex W.', room: 'Kursraum' },
    { id: 'gym-do-5', name: 'BOOTY BOOST', time: '11:00-11:20', day: 'do', trainer: 'Alex W.', room: 'Kursraum' },
    { id: 'gym-do-6', name: 'PILATES', time: '11:10-12:00', day: 'do', trainer: 'Shumaila', room: 'Kursraum 2' },
    { id: 'gym-do-7', name: 'SIXPACK', time: '11:30-11:50', day: 'do', trainer: 'Alex W.', room: 'Kursraum' },
    { id: 'gym-do-8', name: 'KETTLEBELL WO', time: '16:30-16:50', day: 'do', trainer: 'Adina', room: 'Kursraum 2' },
    { id: 'gym-do-9', name: 'PUMP IT', time: '17:00-17:50', day: 'do', trainer: 'Adina', room: 'Kursraum 2' },
    { id: 'gym-do-10', name: 'JRW: BIKES & BEATS', time: '18:00-18:50', day: 'do', trainer: 'Daniela', room: 'Cycling' },
    { id: 'gym-do-11', name: 'PUMP IT', time: '18:00-18:50', day: 'do', trainer: 'Katja', room: 'Kursraum 2' },
    { id: 'gym-do-12', name: 'JR: YOGILATES', time: '19:00-19:50', day: 'do', trainer: 'Sandra', room: 'Kursraum 2' },
    { id: 'gym-do-13', name: 'JR: HATHA YOGA', time: '20:00-20:50', day: 'do', trainer: 'Sandra', room: 'Kursraum 2' },

    // FREITAG
    { id: 'gym-fr-1', name: 'JRW: BIKES & BEATS', time: '08:00-08:50', day: 'fr', trainer: 'Irene', room: 'Cycling' },
    { id: 'gym-fr-2', name: 'PUMP IT', time: '09:00-09:50', day: 'fr', trainer: 'Adina', room: 'Kursraum 2' },
    { id: 'gym-fr-3', name: 'JRW: BIKES & BEATS', time: '09:05-09:55', day: 'fr', trainer: 'Irene', room: 'Cycling' },
    { id: 'gym-fr-4', name: 'PILATES', time: '09:10-10:00', day: 'fr', trainer: 'Katharina', room: 'Kursraum 2' },
    { id: 'gym-fr-5', name: 'LATIN BEATS', time: '10:00-10:50', day: 'fr', trainer: 'Alex W.', room: 'Kursraum' },
    { id: 'gym-fr-6', name: 'JR SALSATION', time: '12:00-12:50', day: 'fr', room: 'Kursraum' },
    { id: 'gym-fr-7', name: 'VINYASA YOGA', time: '17:00-17:50', day: 'fr', trainer: 'Karl Henrik', room: 'Kursraum 2' },
    { id: 'gym-fr-8', name: 'JRW: BIKES & BEATS', time: '18:00-18:50', day: 'fr', trainer: 'Irene', room: 'Cycling' },
    { id: 'gym-fr-9', name: 'LATIN BEATS', time: '19:00-19:50', day: 'fr', trainer: 'Tanya', room: 'Kursraum' },

    // SAMSTAG
    { id: 'gym-sa-1', name: 'JRW: BIKES & BEATS', time: '10:00-10:50', day: 'sa', trainer: 'Irene', room: 'Cycling' },
    { id: 'gym-sa-2', name: 'PILATES', time: '10:00-10:50', day: 'sa', trainer: 'Katrin', room: 'Kursraum 2' },
    { id: 'gym-sa-3', name: 'BARRE', time: '10:30-11:20', day: 'sa', trainer: 'Daria', room: 'Kursraum' },
    { id: 'gym-sa-4', name: 'TOTAL BODY WORKOUT', time: '11:00-11:50', day: 'sa', trainer: 'Katrin', room: 'Kursraum 2' },
    { id: 'gym-sa-5', name: 'JRW: BIKES & BEATS', time: '11:00-11:50', day: 'sa', trainer: 'Irene', room: 'Cycling' },
    { id: 'gym-sa-6', name: 'ZUMBA', time: '11:30-12:20', day: 'sa', trainer: 'Daria', room: 'Kursraum' },
    { id: 'gym-sa-7', name: 'STRONG 30', time: '12:30-13:00', day: 'sa', trainer: 'Daria', room: 'Kursraum' },
    { id: 'gym-sa-8', name: 'JRW: BIKES & BEATS', time: '12:00-12:50', day: 'sa', trainer: 'Irene', room: 'Cycling' },
    { id: 'gym-sa-9', name: 'LATIN BEATS', time: '17:00-17:50', day: 'sa', trainer: 'Laura P', room: 'Kursraum 2' },
    { id: 'gym-sa-10', name: 'PILATES', time: '18:00-18:50', day: 'sa', trainer: 'Laura P', room: 'Kursraum 2' },
    { id: 'gym-sa-11', name: 'YIN YOGA', time: '19:00-19:50', day: 'sa', trainer: 'Sandra', room: 'Kursraum 2' },

    // SONNTAG
    { id: 'gym-so-1', name: 'PILATES', time: '09:30-10:20', day: 'so', trainer: 'Shumaila', room: 'Kursraum 2' },
    { id: 'gym-so-2', name: 'JRW: TWERKOUT', time: '11:00-11:50', day: 'so', trainer: 'Alex W.', room: 'Kursraum' },
    { id: 'gym-so-3', name: 'PILATES', time: '12:00-12:50', day: 'so', trainer: 'Shumaila', room: 'Kursraum 2' },
    { id: 'gym-so-4', name: 'TANTRA YOGA', time: '13:00-13:50', day: 'so', trainer: 'Nazhat', room: 'Kursraum 2' },
    { id: 'gym-so-5', name: 'JR: POWER PILATES', time: '16:50-17:40', day: 'so', trainer: 'Sara', room: 'Kursraum 2' },
    { id: 'gym-so-6', name: 'PUMP IT', time: '18:00-18:50', day: 'so', trainer: 'Katharina', room: 'Kursraum 2' },
    { id: 'gym-so-7', name: 'JRW: BIKES & BEATS', time: '18:00-18:50', day: 'so', trainer: 'Mike', room: 'Cycling' },
    { id: 'gym-so-8', name: 'BOOTY BOOST', time: '19:00-19:20', day: 'so', trainer: 'Katharina', room: 'Kursraum 2' },
    { id: 'gym-so-9', name: 'TANTRA YOGA', time: '19:00-19:50', day: 'so', trainer: 'Nazhat', room: 'Kursraum' },
    { id: 'gym-so-10', name: 'SIXPACK', time: '19:30-19:50', day: 'so', trainer: 'Katharina', room: 'Kursraum 2' },
    { id: 'gym-so-11', name: 'CHOREOLOGY BY SALSATION', time: '20:00-20:50', day: 'so', room: 'Kursraum' },
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
