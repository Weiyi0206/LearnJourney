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
        You are an expert university professor creating a rigorous verification quiz for a student learning "{req.skill_name}" within the course "{req.course_title}".
        
        CONTEXT:
        {prereqs_text}
        
        INSTRUCTIONS:
        1. Generate exactly {num_questions} multiple-choice questions testing "{req.skill_name}".
        2. COGNITIVE VARIETY: Map the questions across Bloom's Taxonomy:
           - 30% Recall/Conceptual (Definitions, vocabulary)
           - 40% Application (Predicting output, applying formulas/logic to a scenario)
           - 30% Analysis/Debugging (Identifying errors, comparing approaches)
        3. PROGRESSIVE DIFFICULTY: Order the questions from easiest to hardest.
        4. THE DISTRACTORS (CRITICAL): The 3 incorrect options MUST represent actual, common student misconceptions. Do NOT use obvious, silly, or joke answers.
        5. THE EXPLANATION: Your explanation must not only state why the correct answer is right, but explicitly point out the specific misconception that leads to the incorrect distractors.
        6. SCOPE LIMIT: Do NOT include topics that are more advanced than "{req.skill_name}".

        Ensure all code snippets (if applicable to the subject) are properly formatted.
        """

# Manually define the unrolled schema to avoid Pydantic's $defs
        quiz_schema = {
            "type": "object",
            "properties": {
                "questions": {
                    "type": "array",
                    "description": "An array of distinct, non-repetitive quiz questions.",
                    "items": {
                        "type": "object",
                        "properties": {
                            "question": {
                                "type": "string",
                                "description": "The multiple-choice question text."
                            },
                            "options": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "Exactly 4 options. 1 correct, 3 plausible distractors."
                            },
                            "correct_index": {
                                "type": "integer",
                                "description": "Integer 0-3 representing the correct option index."
                            },
                            "explanation": {
                                "type": "string",
                                "description": "A pedagogical explanation of the correct answer."
                            }
                        },
                        "required": ["question", "options", "correct_index", "explanation"]
                    }
                }
            },
            "required": ["questions"]
        }

        model = GenerativeModel("gemini-2.5-pro") 
        response = model.generate_content(
            prompt,
            generation_config=GenerationConfig(
                temperature=0.7,
                response_mime_type='application/json',
                response_schema=quiz_schema
            )
        )

        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        elif text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        
        data = json.loads(text.strip())
        data["pass_threshold"] = pass_threshold
        return data

    except Exception as e:
        print(f"Gemini API Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to generate adaptive quiz from AI. Error: {str(e)}")


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

