import os
import json
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
import vertexai
from vertexai.generative_models import GenerativeModel, GenerationConfig

from typing import List, Optional
from app.core.database import get_supabase_client
from supabase import Client

router = APIRouter()

class QuizGenerateRequest(BaseModel):
    course_title: str
    skill_name: str
    skill_id: Optional[str] = None
    course_id: Optional[str] = None
    num_questions: int = 20
    mastered_prerequisites: Optional[List[str]] = []

class QuizQuestion(BaseModel):
    question: str = Field(description="The multiple-choice question text.")
    options: List[str] = Field(description="Exactly 4 options. 1 correct, 3 plausible distractors.")
    correct_index: int = Field(description="Integer 0-3 representing the correct option index.")
    explanation: str = Field(description="A pedagogical explanation of the correct answer.")

class QuizQuestionList(BaseModel):
    questions: List[QuizQuestion] = Field(description="An array of distinct, non-repetitive quiz questions.")

class QuizGenerateResponse(BaseModel):
    questions: List[QuizQuestion]
    pass_threshold: int = 60

@router.post("/api/quiz/generate", response_model=QuizGenerateResponse)
def generate_quiz(req: QuizGenerateRequest, supabase: Client = Depends(get_supabase_client)):
    # Determine question count and pass threshold from DB
    num_questions = req.num_questions
    pass_threshold = 60  # default

    if req.skill_id:
        try:
            skill_res = supabase.table("skills").select("questions_count, pass_threshold").eq("id", req.skill_id).execute()
            if skill_res.data:
                row = skill_res.data[0]
                if row.get("questions_count"):
                    num_questions = row["questions_count"]
                if row.get("pass_threshold"):
                    pass_threshold = row["pass_threshold"]
        except Exception:
            pass  # Fall back to defaults

    mastered_prerequisites = req.mastered_prerequisites or []

    # api_key = os.getenv("GEMINI_API_KEY")
    # if not api_key:
    #     print("Warning: GEMINI_API_KEY not found. Returning mock quiz.")
    #     mock_questions = []
    #     for i in range(min(num_questions, 3)):
    #         mock_questions.append({
    #             "question": f"Sample question {i+1} about {req.skill_name} in {req.course_title}?",
    #             "options": [
    #                 f"Option A for Q{i+1}",
    #                 f"Correct answer for Q{i+1}",
    #                 f"Option C for Q{i+1}",
    #                 f"Option D for Q{i+1}"
    #             ],
    #             "correct_index": 1,
    #             "explanation": f"This is a mock explanation for question {i+1} about {req.skill_name}."
    #         })
    #     return {"questions": mock_questions, "pass_threshold": pass_threshold}

    #api_key = os.getenv("GEMINI_API_KEY") # keeping this if needed as fallback, but vertex uses application default credentials
    try:
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "./gcp-service-account.json"
        vertexai.init(project=os.getenv("GCP_PROJECT_ID"), location=os.getenv("GCP_LOCATION"))

        prereqs_text = ""
        if mastered_prerequisites:
            prereqs_text = f"The student has already mastered: {', '.join(mastered_prerequisites)}. You may reference these topics as assumed knowledge."

        prompt = f"""
        You are an expert university professor creating a comprehensive verification quiz for a student learning "{req.skill_name}" within the course "{req.course_title}".
        
        CONTEXT:
        {prereqs_text}
        
        INSTRUCTIONS:
        1. Generate exactly {num_questions} multiple-choice questions about "{req.skill_name}" in Python.
        2. VARIETY: Ensure the questions are highly diverse. Do not repeat the same concept. Mix the following styles:
           - Conceptual/Definition questions.
           - Code analysis (e.g., "What is the output of this snippet?").
           - Debugging (e.g., "Why does this code throw an error?").
           - Best practices/Application scenarios.
        3. PROGRESSIVE DIFFICULTY: Start with easier foundational questions and gradually move to highly advanced edge cases.
        4. PLAUSIBLE DISTRACTORS: The 3 incorrect options MUST be common student misconceptions. No obvious or joke answers.
        5. STRICT SCOPE: Do NOT test concepts that are more advanced than "{req.skill_name}".
        
        Return the result as a JSON object matching this schema:
        {{
            "questions": [
                {{
                    "question": "The multiple-choice question text.",
                    "options": ["A", "B", "C", "D"],
                    "correct_index": 0,
                    "explanation": "A pedagogical explanation."
                }}
            ]
        }}
        """

        model = GenerativeModel("gemini-2.5-pro") # use appropriate available vertex model
        response = model.generate_content(
            prompt,
            generation_config=GenerationConfig(
                temperature=0.7,
                response_mime_type='application/json'
            )
        )

        data = json.loads(response.text)
        data["pass_threshold"] = pass_threshold
        return data

    except Exception as e:
        print(f"Gemini API Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate adaptive quiz from AI.")


# ── Quiz Submission & History ──

class QuizAnswerRecord(BaseModel):
    question: str
    options: List[str]
    correct_index: int
    selected_index: int
    is_correct: bool
    explanation: str

class QuizSubmitRequest(BaseModel):
    student_id: str
    course_id: str
    skill_id: str
    score: int
    total_questions: int
    percentage: int
    passed: bool
    questions: List[QuizAnswerRecord]

@router.post("/api/quiz/submit")
def submit_quiz(req: QuizSubmitRequest, supabase: Client = Depends(get_supabase_client)):
    try:
        attempt = {
            "student_id": req.student_id,
            "course_id": req.course_id,
            "skill_id": req.skill_id,
            "score": req.score,
            "total_questions": req.total_questions,
            "percentage": req.percentage,
            "passed": req.passed,
            "questions": json.loads(json.dumps([q.model_dump() for q in req.questions]))
        }
        res = supabase.table("quiz_attempts").insert(attempt).execute()
        if not res.data:
            raise HTTPException(status_code=400, detail="Failed to save quiz attempt")
        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        print(f"Quiz submit error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/quiz/history/{student_id}/{skill_id}")
def get_quiz_history(student_id: str, skill_id: str, supabase: Client = Depends(get_supabase_client)):
    try:
        res = supabase.table("quiz_attempts").select("*").eq("student_id", student_id).eq("skill_id", skill_id).order("created_at", desc=True).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/quiz/history/course/{course_id}")
def get_course_quiz_history(course_id: str, supabase: Client = Depends(get_supabase_client)):
    """Get all quiz attempts for a course (educator view)"""
    try:
        res = supabase.table("quiz_attempts").select("*, profiles(full_name), skills(name)").eq("course_id", course_id).order("created_at", desc=True).execute()
        return res.data
    except Exception as e:
        # Fallback without joins
        try:
            res = supabase.table("quiz_attempts").select("*").eq("course_id", course_id).order("created_at", desc=True).execute()
            return res.data
        except Exception as e2:
            raise HTTPException(status_code=500, detail=str(e2))

