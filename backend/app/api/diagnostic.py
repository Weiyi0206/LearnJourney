import os
import json
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import vertexai
from vertexai.generative_models import GenerativeModel, GenerationConfig
from typing import List, Dict, Any

from app.core.database import get_supabase_client
from supabase import Client

router = APIRouter()

class DiagnosticSubmitAnswer(BaseModel):
    skill_id: str
    is_correct: bool

class DiagnosticSubmitRequest(BaseModel):
    student_id: str
    course_id: str
    answers: List[DiagnosticSubmitAnswer]

@router.get("/api/diagnostic/next-phase/{course_id}/{student_id}")
def get_next_phase(course_id: str, student_id: str, supabase: Client = Depends(get_supabase_client)):
    try:
        # Query Unlocked skills for the student
        prog_res = supabase.table("student_node_progress").select("skill_id, status, skills(name)").eq("student_id", student_id).eq("course_id", course_id).eq("status", "Unlocked").execute()
        
        if not prog_res.data:
            return {"has_next_phase": False}
        
        unlocked_skills = []
        for p in prog_res.data:
            skill_info = p.get("skills")
            if skill_info and isinstance(skill_info, dict):
                name = skill_info.get("name")
            else:
                s_res = supabase.table("skills").select("name").eq("id", p["skill_id"]).execute()
                name = s_res.data[0]["name"] if s_res.data else "Unknown Skill"
                
            unlocked_skills.append({
                "id": p["skill_id"],
                "name": name
            })
            
        if not unlocked_skills:
            return {"has_next_phase": False}

        # Use Vertex AI to generate questions
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "./gcp-service-account.json"
        vertexai.init(project=os.getenv("GCP_PROJECT_ID"), location=os.getenv("GCP_LOCATION"))
        model = GenerativeModel("gemini-2.5-pro") 

        all_questions = []
        
        # Batch generation could be faster, but let's do one prompt per skill to ensure exactly 3 questions
        # or we can ask gemini to generate 3 per skill in one big prompt. One big prompt is much faster.
        skill_names = [s["name"] for s in unlocked_skills if s.get("name")]
        
        prompt = f"""
        You are an expert assessment generator.
        Generate exactly 3 multiple-choice questions for EACH of the following skills:
        {', '.join(skill_names)}
        
        INSTRUCTIONS:
        1. For each skill, generate exactly 3 questions.
        2. Each question needs 1 correct option and 3 plausible distractors.
        3. Include a short, educational 'explanation' explaining why the correct answer is right.
        4. Keep the content rigorous but straightforward.
        5. Return the result mapped by skill name exactly as spelled.
        """
        
        schema = {
            "type": "object",
            "properties": {
                "skills_questions": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "skill_name": {"type": "string"},
                            "questions": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "question": {"type": "string"},
                                        "options": {
                                            "type": "array",
                                            "items": {"type": "string"}
                                        },
                                        "correct_index": {"type": "integer"},
                                        "explanation": {"type": "string"}
                                    },
                                    "required": ["question", "options", "correct_index", "explanation"]
                                }
                            }
                        },
                        "required": ["skill_name", "questions"]
                    }
                }
            },
            "required": ["skills_questions"]
        }
        
        response = model.generate_content(
            prompt,
            generation_config=GenerationConfig(
                temperature=0.7,
                response_mime_type='application/json',
                response_schema=schema
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
        
        # Map back to skill IDs and flatten into a single shuffled array
        import random
        skill_name_to_id = {s["name"].lower(): s["id"] for s in unlocked_skills if s.get("name")}
        
        for sq in data.get("skills_questions", []):
            s_name = (sq.get("skill_name") or "").lower()
            s_id = skill_name_to_id.get(s_name)
            if not s_id:
                # fuzzy match if exact match fails
                for exact_name, exact_id in skill_name_to_id.items():
                    if exact_name in s_name or s_name in exact_name:
                        s_id = exact_id
                        break
            
            if s_id:
                for q in sq.get("questions", []):
                    q["skill_id"] = s_id
                    all_questions.append(q)
                    
        random.shuffle(all_questions)
        
        return {
            "has_next_phase": True,
            "phase_skills": unlocked_skills,
            "questions": all_questions
        }
    except Exception as e:
        print(f"Diagnostic next-phase error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/diagnostic/submit-phase")
def submit_phase(req: DiagnosticSubmitRequest, supabase: Client = Depends(get_supabase_client)):
    try:
        # Group answers by skill_id
        skill_results = {}
        for ans in req.answers:
            if ans.skill_id not in skill_results:
                skill_results[ans.skill_id] = {"correct": 0, "total": 0}
            skill_results[ans.skill_id]["total"] += 1
            if ans.is_correct:
                skill_results[ans.skill_id]["correct"] += 1
                
        passed_skills = []
        failed_skills = []
        
        for skill_id, stats in skill_results.items():
            if stats["correct"] >= 2:
                # Mastered
                supabase.table("student_node_progress").update({
                    "status": "Mastered",
                    "mastery_score": 100.0
                }).eq("student_id", req.student_id).eq("skill_id", skill_id).execute()
                passed_skills.append(skill_id)
            else:
                # Failed Diagnostic
                supabase.table("student_node_progress").update({
                    "status": "Locked"
                }).eq("student_id", req.student_id).eq("skill_id", skill_id).execute()
                failed_skills.append(skill_id)
                
        # For ALL newly mastered skills, unlock children if prerequisites met
        unlocked_skills = []
        for p_skill_id in passed_skills:
            outgoing = supabase.table("prerequisite_edges").select("target_skill_id").eq("source_skill_id", p_skill_id).execute()
            target_ids = [e["target_skill_id"] for e in outgoing.data]
            
            for t_id in target_ids:
                incoming = supabase.table("prerequisite_edges").select("source_skill_id").eq("target_skill_id", t_id).execute()
                inc_sources = [e["source_skill_id"] for e in incoming.data]
                
                source_progs = supabase.table("student_node_progress").select("status").eq("student_id", req.student_id).in_("skill_id", inc_sources).execute()
                all_mastered = all(p["status"] == "Mastered" for p in source_progs.data)
                
                if all_mastered:
                    supabase.table("student_node_progress").update({
                        "status": "Unlocked"
                    }).eq("student_id", req.student_id).eq("skill_id", t_id).execute()
                    unlocked_skills.append(t_id)

        # Get names for display
        passed_names = []
        failed_names = []
        if passed_skills:
            res = supabase.table("skills").select("name").in_("id", passed_skills).execute()
            passed_names = [r["name"] for r in res.data]
        if failed_skills:
            res = supabase.table("skills").select("name").in_("id", failed_skills).execute()
            failed_names = [r["name"] for r in res.data]

        return {
            "status": "success",
            "summary": {
                "passed": passed_names,
                "failed": failed_names,
                "newly_unlocked_count": len(unlocked_skills)
            }
        }
    except Exception as e:
        print(f"Diagnostic submit error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
