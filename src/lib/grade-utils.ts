import type { Grade, Semester } from './types';

export function calculateAbiGrade(totalPoints: number): number | null {
  if (!Number.isFinite(totalPoints)) return null;
  if (totalPoints < 300) return null; // nicht bestanden
  if (totalPoints > 900) return 1.0;
  const grade = 17 / 3 - totalPoints / 180;
  return Math.max(1.0, Math.min(4.0, Math.round(grade * 10) / 10));
}

export function getSubjectSemesterAverage(grades: Grade[], subjectId: string, semester: Semester): number | null {
  const semGrades = grades.filter((g) => g.subjectId === subjectId && g.semester === semester);
  if (semGrades.length === 0) return null;
  const totalWeight = semGrades.reduce((sum, g) => sum + g.weight, 0);
  if (!totalWeight || !Number.isFinite(totalWeight)) return null;
  const weightedSum = semGrades.reduce((sum, g) => sum + g.points * g.weight, 0);
  return Math.round((weightedSum / totalWeight) * 10) / 10;
}
