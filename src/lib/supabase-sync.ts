import { supabase } from './supabase';
import type { Subject, TimetableSlot, Grade, Deadline, Material, MyGymDay, Todo, AbiExam } from './types';

export interface UserData {
  subjects: Subject[];
  timetable: TimetableSlot[];
  grades: Grade[];
  deadlines: Deadline[];
  materials: (Material & { storagePath: string })[];
  myGymDays: MyGymDay[];
  todos: Todo[];
  abiExams: AbiExam[];
}

export async function loadUserData(userId: string): Promise<UserData> {
  const [subjects, timetable, grades, deadlines, materials, gymDays, todos, abiExams] = await Promise.all([
    supabase.from('subjects').select('*').eq('user_id', userId),
    supabase.from('timetable_slots').select('*').eq('user_id', userId),
    supabase.from('grades').select('*').eq('user_id', userId),
    supabase.from('deadlines').select('*').eq('user_id', userId),
    supabase.from('materials').select('*').eq('user_id', userId),
    supabase.from('my_gym_days').select('*').eq('user_id', userId),
    supabase.from('todos').select('*').eq('user_id', userId).catch(() => ({ data: null })),
    supabase.from('abi_exams').select('*').eq('user_id', userId).catch(() => ({ data: null })),
  ]);

  return {
    subjects: (subjects.data || []).map((s: Record<string, unknown>) => ({
      id: s.id as string,
      name: s.name as string,
      color: s.color as string,
      type: s.type as 'GK' | 'LK',
    })),
    timetable: (timetable.data || []).map((t: Record<string, unknown>) => ({
      day: t.day as TimetableSlot['day'],
      period: t.period as number,
      subjectId: t.subject_id as string,
    })),
    grades: (grades.data || []).map((g: Record<string, unknown>) => ({
      id: g.id as string,
      subjectId: g.subject_id as string,
      semester: g.semester as Grade['semester'],
      type: g.type as Grade['type'],
      points: g.points as number,
      weight: Number(g.weight),
      label: (g.label as string) ?? undefined,
    })),
    deadlines: (deadlines.data || []).map((d: Record<string, unknown>) => ({
      id: d.id as string,
      subjectId: d.subject_id as string,
      title: d.title as string,
      type: d.type as Deadline['type'],
      dueDate: d.due_date as string,
      notes: (d.notes as string) ?? undefined,
      done: (d.done as boolean) ?? false,
    })),
    materials: (materials.data || []).map((m: Record<string, unknown>) => ({
      id: m.id as string,
      name: m.name as string,
      mimeType: m.mime_type as string,
      size: m.size as number,
      linkedTo: { type: m.linked_type as 'timetable' | 'deadline', id: m.linked_id as string },
      createdAt: m.created_at as string,
      storagePath: m.storage_path as string,
    })),
    myGymDays: groupGymDays(gymDays.data || []),
    todos: (todos.data || []).map((t: Record<string, unknown>) => ({
      id: t.id as string,
      text: t.text as string,
      done: t.done as boolean,
      date: t.date as string,
    })),
    abiExams: (abiExams.data || []).map((e: Record<string, unknown>) => ({
      id: e.id as string,
      subjectId: e.subject_id as string,
      type: e.type as 'written' | 'oral',
      points: (e.points as number) ?? null,
    })),
  };
}

function groupGymDays(rows: Array<{ date: string; course_id: string }>): MyGymDay[] {
  const map = new Map<string, string[]>();
  for (const row of rows) {
    const existing = map.get(row.date) || [];
    existing.push(row.course_id);
    map.set(row.date, existing);
  }
  return Array.from(map.entries()).map(([date, courseIds]) => ({ date, courseIds }));
}
