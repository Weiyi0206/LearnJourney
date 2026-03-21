from fastapi import APIRouter, HTTPException, Depends
from typing import List
from uuid import UUID
from app.models.schemas import Course, CourseCreate, CourseGraphResponse
from app.core.database import get_supabase_client
from supabase import Client

router = APIRouter()

@router.get("/api/courses", response_model=List[Course])
def get_courses(supabase: Client = Depends(get_supabase_client)):
    try:
        response = supabase.table("courses").select("*").eq("is_published", True).execute()
        return response.data
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
