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
        
        try:
            courses_res = supabase.table("courses").select("*, profiles(full_name)").in_("id", course_ids).execute()
        except Exception:
            courses_res = supabase.table("courses").select("*").in_("id", course_ids).execute()
        courses = courses_res.data
        
        from collections import defaultdict
        course_stats = defaultdict(lambda: {"total": 0, "mastered": 0})
        course_foci = {}
        
        try:
            progress_res = supabase.table("student_node_progress").select("course_id, status, skills(name)").eq("student_id", str(student_id)).in_("course_id", course_ids).execute()
        except Exception:
            progress_res = supabase.table("student_node_progress").select("*").eq("student_id", str(student_id)).in_("course_id", course_ids).execute()
        
        for p in progress_res.data:
            c_id = p["course_id"]
            course_stats[c_id]["total"] += 1
            if p["status"] == "Mastered":
                course_stats[c_id]["mastered"] += 1
            elif p["status"] == "Unlocked" and c_id not in course_foci:
                skill_info = p.get("skills")
                if skill_info and isinstance(skill_info, dict):
                    course_foci[c_id] = skill_info.get("name", "Continue Learning")
                else:
                    # Fallback: lookup skill name manually
                    s_id = p.get("skill_id")
                    if s_id and c_id not in course_foci:
                        try:
                            skill_res = supabase.table("skills").select("name").eq("id", s_id).execute()
                            if skill_res.data:
                                course_foci[c_id] = skill_res.data[0].get("name", "Continue Learning")
                        except Exception:
                            pass
                    
        result = []
        for c in courses:
            c_id = c["id"]
            total = course_stats[c_id]["total"]
            mastered = course_stats[c_id]["mastered"]
            percent = round((mastered / total * 100)) if total > 0 else 0
            curr_focus = course_foci.get(c_id, "Completed" if percent == 100 else "Getting Started")
            
            prof = c.get("profiles")
            if prof and isinstance(prof, dict):
                educator_name = prof.get("full_name", "Community Educator")
            else:
                eid = c.get("educator_id")
                educator_name = "Community Educator"
                if eid:
                    try:
                        prof_res = supabase.table("profiles").select("full_name").eq("id", eid).execute()
                        if prof_res.data:
                            educator_name = prof_res.data[0].get("full_name", "Community Educator")
                    except Exception:
                        pass
            
            c_data = {
                **c,
                "educator": educator_name,
                "progress": {
                    "total": total,
                    "mastered": mastered,
                    "percent": percent,
                    "currentFocus": curr_focus,
                    "text": f"{mastered} / {total} Nodes"
                }
            }
            c_data.pop("profiles", None)
            result.append(c_data)
        
        return result
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

@router.get("/api/student/roster/{course_id}")
def get_course_roster(course_id: str, supabase: Client = Depends(get_supabase_client)):
    """Get all enrolled students for a course with their progress (educator view)"""
    try:
        # Get enrollments
        enrollments = supabase.table("student_enrollments").select("student_id, created_at").eq("course_id", course_id).execute()
        if not enrollments.data:
            return []

        # Get total skills count for this course
        skills_res = supabase.table("skills").select("id").eq("course_id", course_id).execute()
        total_nodes = len(skills_res.data) if skills_res.data else 0

        roster = []
        for enrollment in enrollments.data:
            sid = enrollment["student_id"]
            enrolled_at = enrollment.get("created_at", "")

            # Default values
            name = "Unknown"
            mastered = 0
            last_active = enrolled_at

            # Get student name
            try:
                prof_res = supabase.table("profiles").select("full_name").eq("id", sid).execute()
                if prof_res.data:
                    name = prof_res.data[0].get("full_name") or "Unknown"
            except Exception:
                pass

            # Get mastered count
            try:
                prog_res = supabase.table("student_node_progress").select("status").eq("student_id", sid).eq("course_id", course_id).execute()
                if prog_res.data:
                    mastered = sum(1 for p in prog_res.data if p.get("status") == "Mastered")
            except Exception:
                pass

            # Get last quiz attempt date (skip if table is empty or RLS blocks)
            try:
                last_quiz = supabase.table("quiz_attempts").select("created_at").eq("student_id", sid).eq("course_id", course_id).order("created_at", desc=True).limit(1).execute()
                if last_quiz.data:
                    last_active = last_quiz.data[0]["created_at"]
            except Exception:
                pass  # quiz_attempts may be empty or RLS may restrict

            roster.append({
                "id": sid,
                "name": name,
                "completedNodes": mastered,
                "totalNodes": total_nodes,
                "lastActive": last_active
            })

        return roster
    except Exception as e:
        print(f"Roster error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


