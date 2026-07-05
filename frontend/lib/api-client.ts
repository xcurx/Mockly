import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function startInterview(config: {
  topics: string[];
  customTopics: string[];
  mode: string;
  interactionType: string;
  maxQuestions: number;
  difficultyMode?: string;
  manualDifficulty?: number | null;
  role?: string | null;
  resumeData?: Record<string, unknown> | null;
  bookmarked_questions?: string[];
  userId?: string;
}) {
  try {
    const { data } = await axios.post(`${API_URL}/api/interview/start`, {
      topics: config.topics,
      custom_topics: config.customTopics,
      mode: config.mode,
      interaction_type: config.interactionType,
      max_questions: config.maxQuestions,
      difficulty_mode: config.difficultyMode || "ADAPTIVE",
      manual_difficulty: config.manualDifficulty ?? null,
      role: config.role ?? null,
      resume_data: config.resumeData || null,
      bookmarked_questions: config.bookmarked_questions || [],
      user_id: config.userId || "",
    });
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.detail || "Failed to start interview"
      );
    }
    throw error;
  }
}

export async function sendAnswer(
  userAnswer: string,
  interviewState: Record<string, unknown>,
  hintsUsed: number = 0,
  userId: string = ""
) {
  try {
    const { data } = await axios.post(`${API_URL}/api/interview/respond`, {
      user_answer: userAnswer,
      interview_state: interviewState,
      hints_used: hintsUsed,
      user_id: userId,
    });
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.detail || "Failed to process answer"
      );
    }
    throw error;
  }
}

export async function summarizeInterview(
  interviewState: Record<string, unknown>
) {
  try {
    const { data } = await axios.post(`${API_URL}/api/interview/summarize`, {
      user_answer: "",
      interview_state: interviewState,
    });
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.detail || "Failed to summarize interview"
      );
    }
    throw error;
  }
}

export async function requestHint(
  interviewState: Record<string, unknown>,
  hintsUsed: number
) {
  try {
    const { data } = await axios.post(`${API_URL}/api/interview/hint`, {
      interview_state: interviewState,
      hints_used: hintsUsed,
    });
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.detail || "Failed to request hint"
      );
    }
    throw error;
  }
}

export async function parseResume(file: File) {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await axios.post(`${API_URL}/api/resume/parse`, formData);
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.detail || "Failed to parse resume"
      );
    }
    throw error;
  }
}