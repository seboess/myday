import { describe, it, expect } from 'vitest'
import { calculateAbiGrade, getSubjectSemesterAverage } from '@/lib/grade-utils'
import type { Grade } from '@/lib/types'

describe('calculateAbiGrade', () => {
  it('returns null for points below 300', () => {
    expect(calculateAbiGrade(299)).toBeNull()
    expect(calculateAbiGrade(0)).toBeNull()
  })

  it('returns 1.0 for points above 900', () => {
    expect(calculateAbiGrade(901)).toBe(1.0)
  })

  it('returns 1.0 for exactly 900 points', () => {
    expect(calculateAbiGrade(900)).toBe(1.0)
  })

  it('returns correct grade for 300 points (minimum passing)', () => {
    const result = calculateAbiGrade(300)
    expect(result).not.toBeNull()
    expect(result).toBe(4.0)
  })

  it('returns a grade between 1.0 and 4.0 for mid-range points', () => {
    const result = calculateAbiGrade(600)
    expect(result).not.toBeNull()
    expect(result!).toBeGreaterThanOrEqual(1.0)
    expect(result!).toBeLessThanOrEqual(4.0)
  })

  it('higher points produce better (lower) grade', () => {
    const grade600 = calculateAbiGrade(600)!
    const grade700 = calculateAbiGrade(700)!
    expect(grade700).toBeLessThan(grade600)
  })
})

describe('getSubjectSemesterAverage', () => {
  const makeGrade = (points: number, weight: number, subjectId = 'math', semester = 'Q1' as const): Grade => ({
    id: `g-${Math.random()}`,
    subjectId,
    semester,
    type: 'klausur',
    points,
    weight,
  })

  it('returns null when no grades exist for subject+semester', () => {
    expect(getSubjectSemesterAverage([], 'math', 'Q1')).toBeNull()
  })

  it('returns null when grades exist for different subject', () => {
    const grades = [makeGrade(10, 1, 'english', 'Q1')]
    expect(getSubjectSemesterAverage(grades, 'math', 'Q1')).toBeNull()
  })

  it('returns null when grades exist for different semester', () => {
    const grades = [makeGrade(10, 1, 'math', 'Q2')]
    expect(getSubjectSemesterAverage(grades, 'math', 'Q1')).toBeNull()
  })

  it('returns exact points for a single grade', () => {
    const grades = [makeGrade(12, 1)]
    expect(getSubjectSemesterAverage(grades, 'math', 'Q1')).toBe(12)
  })

  it('computes weighted average correctly', () => {
    const grades = [
      makeGrade(10, 2), // weight 2
      makeGrade(14, 1), // weight 1
    ]
    // (10*2 + 14*1) / (2+1) = 34/3 = 11.333... → rounded to 11.3
    expect(getSubjectSemesterAverage(grades, 'math', 'Q1')).toBe(11.3)
  })

  it('returns null when total weight is zero', () => {
    const grades = [makeGrade(10, 0)]
    expect(getSubjectSemesterAverage(grades, 'math', 'Q1')).toBeNull()
  })
})
