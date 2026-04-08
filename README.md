# LearnJourney: Intelligent Tutoring System with Adaptive Learning Paths

**Author:** Tan Wei Yi (163210)  
**Institution:** Universiti Sains Malaysia (USM) | CAT405 Intelligent Computing Major Project  
**Supervisors:** Assoc. Prof. Ts. Dr. Chew XinYing | Examiner: Dr. Azleena Mohd Kassim  

---

## 📖 What is LearnJourney?
LearnJourney is an advanced, AI-driven Intelligent Tutoring System (ITS) designed to solve the rigid, linear sequence of traditional Learning Management Systems (LMS). By automating curriculum design and creating dynamic, personalized learning pathways, it transforms both how educators create content and how students consume it.

---

## 🚀 The LearnJourney Advantage vs. Traditional LMS

Traditional LMS platforms struggle with high authoring bottlenecks, forcing educators to manually build out long, linear course modules. Furthermore, students are often forced to take "one-size-fits-all" paths consisting of static question banks that encourage rote memorization rather than actual mastery. 

**LearnJourney changes the paradigm in several meaningful ways:**
- **Automated Curriculum Structuring:** Automatically translates unstructured skills and descriptions into logical prerequisite graphs using NLP and Semantic Analysis, solving the authoring bottleneck.
- **Dynamic Structural Adaptability:** Replaces rigid, linear modules with an evolving "Knowledge Frontier" that unlocks topics logically based on what the student has mastered, preventing cognitive overload.
- **Solving the Cold Start Problem:** Instead of forcing students to start from zero or relying heavily on historical data, LearnJourney features an opt-in Diagnostic Engine that evaluates prior knowledge to rapidly advance students past what they already know.
- **Generative Assessments:** Bypasses stale, static question banks by utilizing GenAI (Gemini) to craft on-the-fly, context-aware quizzes for precise mastery verification. No two quizzes are identical.

---

## ✨ Main Features & Logic Architecture

### 🎓 For Educators: Smart Administration & Analytics

#### 1. AI Curriculum Architect
Educators simply input a set of skills and their definitions. Under the hood, LearnJourney uses **Sentence-BERT (SBERT)** and heuristic complexity algorithms. It extracts semantic similarity and applies Zipf distribution logic to figure out complexity, automatically graphing a Directed Acyclic Graph (DAG) that maps out skill prerequisites. Educators can visually review and tweak these dependencies via an interactive **Graph Editor** built on React Flow.

#### 2. Advanced Educator Analytics
The dashboard is not just about raw numbers. It tracks real-time student traversal of the skill graph. Educators can see overall progress, pinpoint specific nodes where students struggle, and review **detailed quiz attempt logs** (including the full text of dynamically generated questions and the student's exact responses) to craft targeted pedagogical interventions.

### 🧑‍🎓 For Students: Personalized Knowledge Pathways

#### 1. The Diagnostic Engine
Upon joining a course, students can opt into a smart diagnostic assessment. The engine algorithmically probes key nodes in the prerequisite graph. Based on their performance, it maps out a foundational understanding, successfully "fast-forwarding" their learning state and hiding introductory topics they've already mastered.

#### 2. Adaptive Learning Paths (The Knowledge Frontier)
Instead of infinite scrolling through modules, students are presented with their "Knowledge Frontier". A Topological State Machine tracks their mastery profile, unlocking only the specific skill nodes they are functionally ready to tackle next. As they pass topics, the frontier dynamically shifts forward.

#### 3. Generative AI Verification Quizzes
To actually prove mastery, a student can take a quiz for unlocked nodes. Instead of relying on predefined options, the AI Personal Tutor prompts the **Gemini model** to generate relevant verification questions factoring in the depth of the skill. This prevents memorization, encourages critical thinking, and ensures true comprehension.

---

## 🛠️ Tech Stack

- **Frontend:** React.js, Tailwind CSS (v4), Shadcn UI, React Flow (Graph Visualizations)
- **Backend:** Python FastAPI
- **Database & Auth:** Supabase (PostgreSQL, Row Level Security, Auth)
- **AI Core Logics:** 
  - `sentence-transformers` (SBERT) & NLTK (Semantic Analysis)
  - Google Gemini API (Generative Quizzes)

---

## 💻 Local Development Setup

This project uses a monorepo approach, meaning both the frontend and backend live in this repository. Follow these steps to get everything running locally.

### Prerequisites
- Node.js (v18+)
- Python (v3.9+)
- A Supabase Project (Database & Authentication)
- Google Gemini API Key

### 1. Database Setup
1. Create a Supabase project.
2. Apply any required database schemas or migrations (tables for users, courses, nodes, edges, state tracker logs, etc.).

### 2. Backend (FastAPI) Setup
```bash
# Navigate to the backend directory
cd backend

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create an env file based on your keys
# Add SUPABASE_URL, SUPABASE_KEY, and GEMINI_API_KEY to backend/.env

# Run the API server
uvicorn app.main:app --reload
```
The FastAPI backend will now be running on `http://localhost:8000`.

### 3. Frontend (React/Vite) Setup
```bash
# Open a new terminal and navigate to the frontend directory
cd frontend

# Install Node dependencies
npm install

# Setup environment variables
# Add VITE_API_URL, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY to frontend/.env

# Start the Vite development server
npm run dev
```
The React frontend will be accessible at `http://localhost:5173`.

---

## ⚡ Quick Command Reference (Windows)
For day-to-day development, you can use these quick commands from the root directory:

**Start Backend:**
```bash
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload
```

**Start Frontend:**
```bash
cd frontend
npm run dev
```
