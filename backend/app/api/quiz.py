import os
import json
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import google.generativeai as genai
from typing import List

router = APIRouter()

class QuizGenerateRequest(BaseModel):
    course_title: str
    skill_name: str

class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    correct_index: int
    explanation: str

class QuizResponse(BaseModel):
    question: QuizQuestion

@router.post("/api/quiz/generate", response_model=QuizResponse)
def generate_quiz(req: QuizGenerateRequest):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("Warning: GEMINI_API_KEY not found. Returning mock quiz.")
        # Fallback
        return {
            "question": {
                "question": f"What is the primary purpose of {req.skill_name} in {req.course_title}?",
                "options": ["To confuse learners", "To serve as a core concept", "To replace everything", "To make coffee"],
                "correct_index": 1,
                "explanation": f"{req.skill_name} is a fundamental concept needed to progress further."
            }
        }

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        prompt = f"""
        You are an expert educator creating a quiz for a student learning "{req.skill_name}" within "{req.course_title}".
        Generate exactly 1 multiple-choice question to test understanding.
        Return ONLY a JSON object with:
        - "question": string
        - "options": array of 4 strings
        - "correct_index": integer (0-3)
        - "explanation": short string explaining why it's correct
        """
        
        import argparse
        response = model.generate_content(
            prompt,
            generation_config=argparse.Namespace(response_mime_type="application/json") if hasattr(genai.types, 'GenerationConfig') else genai.types.GenerationConfig(response_mime_type="application/json")
        )
        
        data = json.loads(response.text)
        return {"question": data}
    except Exception as e:
        print(f"Gemini API Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate quiz from AI.")
