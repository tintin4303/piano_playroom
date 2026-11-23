// Teacher color palette: Microsoft Teams-style calm pastel background with solid border & bold text
export interface TeacherTheme {
  bg: string;
  border: string;
  text: string;
  dot: string;
}

export const TEACHER_THEMES: Record<string, TeacherTheme> = {
  Mozart: {
    bg: 'bg-[#EEF2FC]',
    border: 'border-[#204CB4]',
    text: 'text-[#1B3F96]',
    dot: 'bg-[#204CB4]',
  },
  Beethoven: {
    bg: 'bg-[#EDF7EE]',
    border: 'border-[#2E7D32]',
    text: 'text-[#1E5622]',
    dot: 'bg-[#2E7D32]',
  },
  Chopin: {
    bg: 'bg-[#FFF6E5]',
    border: 'border-[#D97706]',
    text: 'text-[#92400E]',
    dot: 'bg-[#D97706]',
  },
  Administrator: {
    bg: 'bg-[#F3E8FF]',
    border: 'border-[#7C3AED]',
    text: 'text-[#5B21B6]',
    dot: 'bg-[#7C3AED]',
  },
  Default: {
    bg: 'bg-[#F1F5F9]',
    border: 'border-[#64748B]',
    text: 'text-[#334155]',
    dot: 'bg-[#64748B]',
  },
};

export function getTeacherTheme(teacherName: string): TeacherTheme {
  for (const key of Object.keys(TEACHER_THEMES)) {
    if (teacherName.toLowerCase().includes(key.toLowerCase())) {
      return TEACHER_THEMES[key];
    }
  }
  return TEACHER_THEMES.Default;
}
