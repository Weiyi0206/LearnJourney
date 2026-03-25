import os
import json
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field
from app.models.schemas import Course, CourseCreate, CourseGraphResponse
from app.core.database import get_supabase_client
from supabase import Client
from app.services.ai_architect.graph_inference import GraphInferenceEngine

router = APIRouter()

class GenerateRequest(BaseModel):
    skills: List[str]

# ── Skill Parsing via Gemini ──

class ParseSkillsRequest(BaseModel):
    raw_text: str
    format_hint: str = "csv"  # "csv" or "raw"

class ParsedSkillsList(BaseModel):
    skills: List[str] = Field(description="A flat list of distinct skill or concept names extracted from the input text. Each entry should be a concise, titlecase skill name.")

@router.post("/api/courses/parse-skills")
def parse_skills(request: ParseSkillsRequest):
    """Use Gemini to parse unstructured or CSV text into a clean list of skill names."""
    raw = request.raw_text.strip()
    if not raw:
        raise HTTPException(status_code=400, detail="raw_text must not be empty")

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        # Fallback: simple split on commas and newlines
        skills = [s.strip().strip("-•*").strip() for s in raw.replace("\n", ",").split(",") if s.strip()]
        return {"skills": skills}

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)

        prompt = f"""You are a curriculum expert. The user has provided a list of skills / concepts in {"CSV" if request.format_hint == "csv" else "unstructured raw text"} format.

INPUT:
\"\"\"
{raw}
\"\"\"

TASK:
1. Identify every distinct skill or concept mentioned.
2. Clean up each skill name: remove numbering, bullets, trailing punctuation.
3. Use Title Case for each skill name.
4. Normalize the concepts into standard, short, 1-to-3 word textbook keywords. 
5. Do not use descriptive phrases.
Examples:
BAD: 'Defining And Calling Functions'
GOOD: 'Functions'
BAD: 'Basic Arithmetic And Logical Operators'
GOOD: 'Operators'
6. Remove exact duplicates.
7. Return them as a JSON array of strings under the key "skills"."""

        response = client.models.generate_content(
            model='gemini-2.5-flash-lite',
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.2,
                response_mime_type='application/json',
                response_schema=ParsedSkillsList,
            )
        )

        data = json.loads(response.text)
        return data

    except Exception as e:
        print(f"Gemini parse-skills error: {e}")
        # Fallback to simple split
        skills = [s.strip().strip("-•*").strip() for s in raw.replace("\n", ",").split(",") if s.strip()]
        return {"skills": skills}

class DeployRequest(BaseModel):
    educator_id: str
    title: str
    description: str
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]
    is_public: bool = True

@router.get("/api/courses", response_model=List[Any])
def get_courses(educator_id: str = None, supabase: Client = Depends(get_supabase_client)):
    try:
        # Try join with profiles for educator name
        try:
            query = supabase.table("courses").select("*, profiles(full_name)")
        except Exception:
            query = supabase.table("courses").select("*")

        if educator_id:
            query = query.eq("educator_id", educator_id)
        else:
            query = query.eq("is_published", True).eq("is_public", True)
            
        response = query.execute()
        courses = response.data
        
        if courses:
            for course in courses:
                cid = course["id"]
                
                # Educator Name mapping
                prof = course.get("profiles")
                if prof and isinstance(prof, dict):
                    course["educator_name"] = prof.get("full_name", "Community Educator")
                else:
                    # Fallback: lookup profile separately
                    eid = course.get("educator_id")
                    if eid:
                        try:
                            prof_res = supabase.table("profiles").select("full_name").eq("id", eid).execute()
                            if prof_res.data:
                                course["educator_name"] = prof_res.data[0].get("full_name", "Community Educator")
                            else:
                                course["educator_name"] = "Community Educator"
                        except Exception:
                            course["educator_name"] = "Community Educator"
                    else:
                        course["educator_name"] = "Community Educator"
                course.pop("profiles", None)
                
                if educator_id:
                    # nodes count
                    skills_res = supabase.table("skills").select("id").eq("course_id", cid).execute()
                    course["nodes_count"] = len(skills_res.data) if skills_res.data else 0
                    
                    # students count
                    enrolls_res = supabase.table("student_enrollments").select("id").eq("course_id", cid).execute()
                    course["students_count"] = len(enrolls_res.data) if enrolls_res.data else 0
                    
                    # avg mastery
                    prog_res = supabase.table("student_node_progress").select("mastery_score").eq("course_id", cid).execute()
                    if prog_res.data:
                        scores = [p.get("mastery_score") for p in prog_res.data if p.get("mastery_score") is not None]
                        if scores:
                            course["avg_mastery"] = round(sum(scores) / len(scores))
                        else:
                            course["avg_mastery"] = 0
                    else:
                        course["avg_mastery"] = 0
                        
        return courses
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/courses/{course_id}", response_model=CourseGraphResponse)
def get_course_graph(course_id: UUID, supabase: Client = Depends(get_supabase_client)):
    try:
        # Fetch the root course
        course_res = supabase.table("courses").select("*").eq("id", str(course_id)).execute()
        if not course_res.data:
            raise HTTPException(status_code=404, detail="Course not found")
        course_data = course_res.data[0]

        # Fetch all skills (nodes) tied to this course
        skills_res = supabase.table("skills").select("*").eq("course_id", str(course_id)).execute()
        
        # Fetch all prerequisite edges tied to this course
        edges_res = supabase.table("prerequisite_edges").select("*").eq("course_id", str(course_id)).execute()
        
        return CourseGraphResponse(
            **course_data,
            skills=skills_res.data,
            prerequisite_edges=edges_res.data
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/courses", response_model=Course)
def create_course(course: CourseCreate, supabase: Client = Depends(get_supabase_client)):
    try:
        new_course = {
            "title": course.title,
            "description": course.description,
            "is_published": course.is_published,
            "educator_id": str(course.educator_id)
        }
        response = supabase.table("courses").insert(new_course).execute()
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create course")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/courses/generate")
def generate_course_graph(request: GenerateRequest):
    try:
        engine = GraphInferenceEngine()
        graph_data = engine.build_prerequisite_graph(request.skills)
        return graph_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/courses/deploy")
def deploy_course(request: DeployRequest, supabase: Client = Depends(get_supabase_client)):
    try:
        # 1. Insert a new record into the courses table
        new_course = {
            "title": request.title,
            "description": request.description,
            "is_published": True,
            "is_public": request.is_public,
            "educator_id": request.educator_id
        }
        course_res = supabase.table("courses").insert(new_course).execute()
        if not course_res.data:
            raise HTTPException(status_code=400, detail="Failed to create course")
        
        course_id = course_res.data[0]["id"]

        # 3. Keep a mapping in Python of the old_node_id to the new_skill_uuid 
        id_mapping = {}

        # 2. Iterate through the nodes. Insert them into the skills table
        for node in request.nodes:
            old_id = node.get("id")
            node_data = node.get("data", {})
            label = node_data.get("label", "Unknown Skill")
            skill_data = {
                "course_id": course_id,
                "name": label,
                "questions_count": node_data.get("questions_count", 20),
                "pass_threshold": node_data.get("pass_threshold", 60)
            }
            skill_res = supabase.table("skills").insert(skill_data).execute()
            if skill_res.data:
                new_skill_uuid = skill_res.data[0]["id"]
                id_mapping[old_id] = new_skill_uuid

        # 4 & 5. Iterate through the edges and lookup the mapping
        for edge in request.edges:
            source_old = edge.get("source")
            target_old = edge.get("target")

            source_new = id_mapping.get(source_old)
            target_new = id_mapping.get(target_old)

            if source_new and target_new:
                edge_data = {
                    "course_id": course_id,
                    "source_skill_id": source_new,
                    "target_skill_id": target_new
                }
                supabase.table("prerequisite_edges").insert(edge_data).execute()

        return { "status": "success", "course_id": course_id }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Skill Settings Update (Educator) ──

class SkillSettingsUpdate(BaseModel):
    questions_count: int = 20
    pass_threshold: int = 60
    name: str = None

@router.put("/api/skills/{skill_id}")
def update_skill_settings(skill_id: str, req: SkillSettingsUpdate, supabase: Client = Depends(get_supabase_client)):
    """Update settings for a single skill node"""
    try:
        update_data = {
            "questions_count": req.questions_count,
            "pass_threshold": req.pass_threshold
        }
        if req.name:
            update_data["name"] = req.name
        res = supabase.table("skills").update(update_data).eq("id", skill_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Skill not found")
        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class CourseSettingsUpdate(BaseModel):
    questions_count: int = 20
    pass_threshold: int = 60

@router.put("/api/courses/{course_id}/settings")
def update_course_settings(course_id: str, req: CourseSettingsUpdate, supabase: Client = Depends(get_supabase_client)):
    """Update quiz settings for ALL skills in a course at once"""
    try:
        res = supabase.table("skills").update({
            "questions_count": req.questions_count,
            "pass_threshold": req.pass_threshold
        }).eq("course_id", course_id).execute()
        return {"status": "success", "updated": len(res.data) if res.data else 0}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

