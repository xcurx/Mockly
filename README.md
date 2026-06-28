# Mockly: Agentic AI Mock Interviewer ⚡

Mockly is an AI-powered Mock Interview platform designed to help developers ace their technical interviews. By leveraging an agentic workflow, real-time web research, and resume parsing, Mockly generates tailored, context-aware interview questions and provides detailed, structured feedback.

---

## 🚀 Key Features

*   **📄 Intelligent Resume Parsing:** Extract skills, experience level, projects, and education directly from uploaded PDF and Word (`.docx`) documents to personalize the interview experience.
*   **🔍 Web-Augmented Research:** Performs live web searches (via Tavily) to fetch the latest industry-relevant technical questions and trends.
*   **⚡ Smart-Fast LLM Routing:** Dynamic model routing optimizes latency and costs:
    *   **Fast Model:** Summarization and search query generation.
    *   **Smart Model:** Complex question generation and detailed answer evaluations.
*   **💾 Query Caching:** In-memory caching for web research results to save Tavily API credits and improve API response times.
*   **📝 Interactive Chat Sandbox:** Responsive, sticky chat interface with isolated scroll areas for questions and evaluations.
*   **🗣️ Voice Capabilities:** Integrated STS (Speech-to-Speech) and TTS (Text-to-Speech) features for an immersive and realistic interview experience.
*   **🔐 NextAuth Integration:** Out-of-the-box support for Google & GitHub social logins.
*   **📊 Database Integration:** Prisma Client connected to a PostgreSQL database for session management.

---

## 🛠️ Tech Stack

### Frontend
*   **Framework:** Next.js (App Router, React 19)
*   **Styling:** Tailwind CSS, Shadcn UI
*   **Icons:** Phosphor Icons
*   **ORM:** Prisma with PostgreSQL

### Backend
*   **Framework:** FastAPI (Python 3.10+)
*   **Agentic Orchestration:** LangGraph & LangChain
*   **Models:** NVIDIA NIMs (Llama 3.1 8B/70B Instruct)
*   **Search Engine:** Tavily Search API
*   **Text Extraction:** PyMuPDF (fitz) & python-docx
*   **Parsing Resiliency:** `json-repair`

---

## 📂 Project Structure

```
Mockly/
├── backend/                # FastAPI backend & LangGraph agents
│   ├── app/
│   │   ├── agents/         # Graph definitions, nodes, and prompts
│   │   ├── api/            # API endpoints (resume parsing, interview)
│   │   ├── tools/          # Web search cache, resume text extraction
│   │   └── utils/          # State serialization helpers
│   ├── main.py             # FastAPI entrypoint
│   └── requirements.txt
├── frontend/               # Next.js web application
│   ├── app/                # App router pages (dashboard, sandbox)
│   ├── components/         # React components (interview panel, inputs)
│   ├── prisma/             # Schema definitions and migrations
│   └── package.json
└── README.md               # Project documentation (this file)
```

---

## ⚙️ Getting Started

### Prerequisites
*   Node.js 18+ & pnpm (or npm/yarn)
*   Python 3.10+
*   PostgreSQL database (or Prisma Postgres/Accelerate connection string)

---

### 1. Backend Setup

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Create and activate a virtual environment:
    ```bash
    python3 -m venv .venv
    source .venv/bin/activate
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Configure environment variables in a `.env` file inside the `backend/` directory:
    ```env
    NVIDIA_BASE_URL="https://integrate.api.nvidia.com/v1"
    NVIDIA_API_KEY="your-nvidia-api-key"
    NVIDIA_FAST_MODEL="meta/llama-3.1-8b-instruct"
    NVIDIA_SMART_MODEL="meta/llama-3.1-70b-instruct"
    TAVILY_API_KEY="your-tavily-api-key"
    CORS_ORIGINS="http://localhost:3000"
    ```
5.  Start the FastAPI server:
    ```bash
    fastapi dev main.py
    # or
    uvicorn main:app --reload --port 8000
    ```

---

### 2. Frontend Setup

1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install packages:
    ```bash
    pnpm install
    # or npm install
    ```
3.  Configure environment variables in a `.env` file inside the `frontend/` directory:
    ```env
    DATABASE_URL="postgresql://username:password@localhost:5432/mockly"
    AUTH_SECRET="your-generated-secret"

    # Social Login OAuth Credentials
    AUTH_GOOGLE_ID="google-client-id"
    AUTH_GOOGLE_SECRET="google-client-secret"
    AUTH_GITHUB_ID="github-client-id"
    AUTH_GITHUB_SECRET="github-client-secret"

    NEXT_PUBLIC_API_URL="http://localhost:8000"
    ```
4.  Run Prisma migrations & database setup:
    ```bash
    pnpx prisma db push
    # optionally run the studio to view your tables:
    pnpx prisma studio
    ```
5.  Start the development server:
    ```bash
    pnpm dev
    # or npm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) to start preparing with Mockly!
