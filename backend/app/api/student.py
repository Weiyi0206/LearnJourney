from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any, Optional
from uuid import UUID
from pydantic import BaseModel
from app.core.database import get_supabase_client
from supabase import Client

router = APIRouter()

class EnrollRequest(BaseModel):
    student_id: UUID
    course_id: UUID

class ProgressUpdateRequest(BaseModel):
    student_id: UUID
    course_id: UUID
    skill_id: UUID
    status: str
    mastery_score: float

@router.post("/api/student/enroll")
def enroll_student(req: EnrollRequest, supabase: Client = Depends(get_supabase_client)):
    try:
        # 1. Check if already enrolled to avoid dupes or errors if frontend calls twice
        existing = supabase.table("student_enrollments").select("*").eq("student_id", str(req.student_id)).eq("course_id", str(req.course_id)).execute()
        if existing.data:
            return {"status": "success", "message": "Already enrolled"}

        # 2. Insert into student_enrollments
        res_enroll = supabase.table("student_enrollments").insert({
            "student_id": str(req.student_id),
            "course_id": str(req.course_id)
        }).execute()

        # 3. Get all skills for this course
        skills_res = supabase.table("skills").select("id").eq("course_id", str(req.course_id)).execute()
        skills = skills_res.data

        # 4. Get all edges for this course
        edges_res = supabase.table("prerequisite_edges").select("*").eq("course_id", str(req.course_id)).execute()
        edges = edges_res.data
        
        target_skills = { edge["target_skill_id"] for edge in edges }

        progress_inserts = []
        for s in skills:
            # If the skill is a target of ANY edge, it requires a prerequisite and starts Locked.
            # If not, it is a root skill and starts Unlocked.
            status = "Locked" if s["id"] in target_skills else "Unlocked"
            progress_inserts.append({
                "student_id": str(req.student_id),
                "course_id": str(req.course_id),
                "skill_id": s["id"],
                "status": status,
                "mastery_score": 0.0
            })
        
        if progress_inserts:
            supabase.table("student_node_progress").insert(progress_inserts).execute()

        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/student/{student_id}/courses")
def get_enrolled_courses(student_id: UUID, supabase: Client = Depends(get_supabase_client)):
    try:
        enrollments = supabase.table("student_enrollments").select("course_id").eq("student_id", str(student_id)).execute()
        course_ids = [e["course_id"] for e in enrollments.data]
        if not course_ids:
            return []
        
        courses = supabase.table("courses").select("*").in_("id", course_ids).execute()
        return courses.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/student/{student_id}/course/{course_id}/progress")
def get_student_progress(student_id: UUID, course_id: UUID, supabase: Client = Depends(get_supabase_client)):
    try:
        prog = supabase.table("student_node_progress").select("*").eq("student_id", str(student_id)).eq("course_id", str(course_id)).execute()
        return prog.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/student/progress")
def update_progress(req: ProgressUpdateRequest, supabase: Client = Depends(get_supabase_client)):
    try:
        # 1. Update the mastered skill
        supabase.table("student_node_progress").update({
            "status": req.status,
            "mastery_score": req.mastery_score
        }).eq("student_id", str(req.student_id)).eq("skill_id", str(req.skill_id)).execute()
        
        # 2. If it is mastered, evaluate unlocking
        if req.status == "Mastered":
            # get all edges where this skill is the source
            outgoing = supabase.table("prerequisite_edges").select("target_skill_id").eq("source_skill_id", str(req.skill_id)).execute()
            target_ids = [e["target_skill_id"] for e in outgoing.data]
            
            for t_id in target_ids:
                # To unlock t_id, ALL of its incoming edges must come from 'Mastered' skills
                incoming = supabase.table("prerequisite_edges").select("source_skill_id").eq("target_skill_id", t_id).execute()
                inc_sources = [e["source_skill_id"] for e in incoming.data]
                
                # Check statuses of inc_sources
                source_progs = supabase.table("student_node_progress").select("status").eq("student_id", str(req.student_id)).in_("skill_id", inc_sources).execute()
                
                all_mastered = all(p["status"] == "Mastered" for p in source_progs.data)
                
                if all_mastered:
                    # Unlock this target!
                    supabase.table("student_node_progress").update({
                        "status": "Unlocked"
                    }).eq("student_id", str(req.student_id)).eq("skill_id", t_id).execute()

        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
