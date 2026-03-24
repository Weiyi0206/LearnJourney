from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
from uuid import UUID
from pydantic import BaseModel
from app.models.schemas import Course, CourseCreate, CourseGraphResponse
from app.core.database import get_supabase_client
from supabase import Client
from app.services.ai_architect.graph_inference import GraphInferenceEngine

router = APIRouter()

class GenerateRequest(BaseModel):
    skills: List[str]

class DeployRequest(BaseModel):
    educator_id: str
    title: str
    description: str
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]

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
            query = query.eq("is_published", True)
            
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
            label = node.get("data", {}).get("label", "Unknown Skill")
            skill_data = {
                "course_id": course_id,
                "name": label
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
