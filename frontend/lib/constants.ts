export const INTERVIEW_MODES = [
  {
    id: "TRAINING",
    label: "Training Mode",
    description:
      "AI provides detailed feedback, explains correct answers, and gives tips after each question.",
    emoji: "📚",
  },
  {
    id: "REALISTIC",
    label: "Realistic Mode",
    description:
      "AI behaves like a real interviewer — brief responses, follow-up questions, no answer reveals.",
    emoji: "💼",
  },
] as const;

export const INTERACTION_TYPES = [
  {
    id: "TEXT",
    label: "Text Chat",
    description: "Type your answers",
    emoji: "💬",
  },
  {
    id: "SPEECH_TO_SPEECH",
    label: "Voice Chat",
    description: "Speak and listen",
    emoji: "🎤",
  },
  {
    id: "SPEECH_TO_TEXT",
    label: "Voice + Text",
    description: "AI speaks, you type",
    emoji: "🎧",
  },
] as const;

export const CURATED_TOPICS = [
  { id: "react", label: "React", emoji: "⚛️" },
  { id: "javascript", label: "JavaScript", emoji: "🟨" },
  { id: "typescript", label: "TypeScript", emoji: "🔷" },
  { id: "python", label: "Python", emoji: "🐍" },
  { id: "dsa", label: "DSA", emoji: "🧮" },
  { id: "system-design", label: "System Design", emoji: "🏗️" },
  { id: "sql", label: "SQL & Databases", emoji: "🗄️" },
  { id: "java", label: "Java", emoji: "☕" },
  { id: "nodejs", label: "Node.js", emoji: "🟢" },
  { id: "devops", label: "DevOps & CI/CD", emoji: "🔧" },
  { id: "behavioral", label: "Behavioral", emoji: "🗣️" },
  { id: "ml-ai", label: "ML / AI", emoji: "🤖" },
] as const;
