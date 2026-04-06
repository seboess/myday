import { supabase } from './supabase';
import type { Subject, TimetableSlot, Grade, Deadline, Material, MyGymDay } from './types';

export interface UserData {
  subjects: Subject[];
  timetable: TimetableSlot[];
  grades: Grade[];
  deadlines: Deadline[];
  materials: (Material & { storagePath: string })[];
  myGymDays: MyGymDay[];
}

export async function loadUserData(userId: string): Promise<UserData> {
  const [subjects, timetable, grades, deadlines, materials, gymDays] = await Promise.all([
    supabase.from('subjects').select('*').eq('user_id', userId),
    supabase.from('timetable_slots').select('*').eq('user_id', userId),
    supabase.from('grades').select('*').eq('user_id', userId),
    supabase.from('deadlines').select('*').eq('user_id', userId),
    supabase.from('materials').select('*').eq('user_id', userId),
    supabase.from('my_gym_days').select('*').eq('user_id', userId),
  ]);

  return {
    subjects: (subjects.data || []).map((s) => ({
      id: s.id,
      name: s.name,
      color: s.color,
      type: s.type as 'GK' | 'LK',
    })),
    timetable: (timetable.data || []).map((t) => ({
      day: t.day as TimetableSlot['day'],
      period: t.period,
      subjectId: t.subject_id,
    })),
    grades: (grades.data || []).map((g) => ({
      id: g.id,
      subjectId: g.subject_id,
      semester: g.semester as Grade['semester'],
      type: g.type as Grade['type'],
      points: g.points,
      weight: Number(g.weight),
      label: g.label ?? undefined,
    })),
    deadlines: (deadlines.data || []).map((d) => ({
      id: d.id,
      subjectId: d.subject_id,
      title: d.title,
      type: d.type as Deadline['type'],
      dueDate: d.due_date,
      notes: d.notes ?? undefined,
    })),
    materials: (materials.data || []).map((m) => ({
      id: m.id,
      name: m.name,
      mimeType: m.mime_type,
      size: m.size,
      linkedTo: { type: m.linked_type as 'timetable' | 'deadline', id: m.linked_id },
      createdAt: m.created_at,
      storagePath: m.storage_path,
    })),
    myGymDays: groupGymDays(gymDays.data || []),
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
