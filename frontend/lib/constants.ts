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
  {
    id: "BEHAVIORAL",
    label: "Behavioral Mode",
    description:
      "STAR-method questions about leadership, teamwork, and past experiences. Great with a resume uploaded.",
    emoji: "🗣️",
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
  { id: "ml-ai", label: "ML / AI", emoji: "🤖" },
] as const;

export const BEHAVIORAL_CATEGORIES = [
  { id: "leadership", label: "Leadership", emoji: "👑" },
  { id: "teamwork", label: "Teamwork", emoji: "🤝" },
  { id: "conflict-resolution", label: "Conflict Resolution", emoji: "⚖️" },
  { id: "problem-solving", label: "Problem Solving", emoji: "🧩" },
  { id: "communication", label: "Communication", emoji: "💬" },
  { id: "adaptability", label: "Adaptability", emoji: "🔄" },
  { id: "time-management", label: "Time Management", emoji: "⏰" },
  { id: "initiative", label: "Initiative", emoji: "🚀" },
  { id: "failure-learning", label: "Failure & Learning", emoji: "📈" },
  { id: "decision-making", label: "Decision Making", emoji: "🎯" },
] as const;

export const DIFFICULTY_MODES = [
  {
    id: "ADAPTIVE",
    label: "Adaptive",
    description: "AI adjusts difficulty based on your performance",
    emoji: "🎯",
  },
  {
    id: "MANUAL",
    label: "Manual",
    description: "You choose a fixed difficulty level",
    emoji: "🎚️",
  },
] as const;

export const DIFFICULTY_LEVELS = [
  { level: 1, label: "Foundational", description: "Core definitions, basic syntax" },
  { level: 2, label: "Intermediate", description: "Apply concepts, compare trade-offs" },
  { level: 3, label: "Advanced", description: "Edge cases, design decisions" },
  { level: 4, label: "Expert", description: "System-level thinking, production gotchas" },
  { level: 5, label: "Staff+", description: "Architecture-level, cross-system trade-offs" },
] as const;

export const EXPERIENCE_LEVELS = [
  { id: "INTERN", label: "Intern", emoji: "🌱", description: "Fundamentals & basic application" },
  { id: "JUNIOR", label: "Junior", emoji: "🟢", description: "Solid fundamentals with some depth" },
  { id: "MID", label: "Mid-Level", emoji: "🔵", description: "Deeper trade-offs & real-world problem solving" },
  { id: "SENIOR", label: "Senior", emoji: "🟣", description: "Architecture, system design & leadership" },
  { id: "STAFF", label: "Staff+", emoji: "⭐", description: "Cross-system thinking & domain expertise" },
] as const;

