import os
import json
import requests as http_requests
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any, Optional
from uuid import UUID
from pydantic import BaseModel, Field
from app.models.schemas import Course, CourseCreate, CourseGraphResponse
from app.core.database import get_supabase_client
from supabase import Client
from app.services.ai_architect.graph_inference import GraphInferenceEngine

router = APIRouter()

CORPUS_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'corpus')

FIELD_CORPUS_MAP = {
    "python": os.path.join(CORPUS_DIR, "python_corpus.txt"),
    "accounting": os.path.join(CORPUS_DIR, "financial_accounting_corpus.txt"),
    "economics": os.path.join(CORPUS_DIR, "economics_corpus.txt"),
}

class GenerateRequest(BaseModel):
    skills: List[str]
    field: str = "python"  # "python", "accounting", or "economics"

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

    # api_key = os.getenv("GEMINI_API_KEY")
    # if not api_key:
    #     # Fallback: simple split on commas and newlines
    #     skills = [s.strip().strip("-•*").strip() for s in raw.replace("\n", ",").split(",") if s.strip()]
    #     return {"skills": skills}

    try:
        import vertexai
        from vertexai.generative_models import GenerativeModel, GenerationConfig

        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "./gcp-service-account.json"
        vertexai.init(project=os.getenv("GCP_PROJECT_ID"), location=os.getenv("GCP_LOCATION"))

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
7. Return them as a JSON object with a single key "skills" containing an array of strings."""

        model = GenerativeModel("gemini-2.5-flash") # use appropriate available vertex model
        response = model.generate_content(
            prompt,
            generation_config=GenerationConfig(
                temperature=0.2,
                response_mime_type='application/json'
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
        
        # Fetch all materials tied to this course
        materials_res = supabase.table("materials").select("*").eq("course_id", str(course_id)).execute()
        
        return CourseGraphResponse(
            **course_data,
            skills=skills_res.data,
            prerequisite_edges=edges_res.data,
            materials=materials_res.data
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
        corpus_path = FIELD_CORPUS_MAP.get(request.field, FIELD_CORPUS_MAP["python"])
        engine = GraphInferenceEngine(corpus_path=corpus_path)
        graph_data = engine.build_prerequisite_graph(request.skills)
        return graph_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── YouTube Auto-Attach Helper ──

def fetch_youtube_videos(course_title: str, skill_name: str, max_results: int = 3) -> List[dict]:
    """Search YouTube Data API v3 for relevant tutorial videos.
    Returns [{"title": ..., "url": "https://www.youtube.com/embed/..."}, ...] or [].
    """
    api_key = os.getenv("YOUTUBE_API_KEY")
    if not api_key:
        return []
    try:
        resp = http_requests.get(
            "https://www.googleapis.com/youtube/v3/search",
            params={
                "part": "snippet",
                "q": f"{course_title} {skill_name} tutorial programming",
                "maxResults": max_results,
                "type": "video",
                "key": api_key,
            },
            timeout=10,
        )
        resp.raise_for_status()
        items = resp.json().get("items", [])
        if not items:
            return []
        
        videos = []
        for item in items:
            video_id = item["id"]["videoId"]
            title = item["snippet"]["title"]
            videos.append({"title": title, "url": f"https://www.youtube.com/embed/{video_id}"})
        return videos
    except Exception as e:
        print(f"YouTube fetch error for '{skill_name}': {e}")
        return []


@router.get("/api/skills/{skill_id}/youtube-recommend")
def youtube_recommend_for_skill(skill_id: str, course_title: str = "", skill_name: str = "", supabase: Client = Depends(get_supabase_client)):
    """On-demand: check if an AI-recommended video already exists for this skill.
    If not, search YouTube, insert it, and return the new material row."""
    try:
        # 1. Check if one already exists
        existing = supabase.table("materials").select("*").eq("skill_id", skill_id).eq("is_ai_recommended", True).execute()
        if existing.data:
            return existing.data[:3]  # already have recommendations, limit to 3

        # 2. Need course_title & skill_name to search
        if not course_title or not skill_name:
            # Try to resolve from DB
            skill_res = supabase.table("skills").select("name, course_id").eq("id", skill_id).execute()
            if skill_res.data:
                skill_name = skill_name or skill_res.data[0].get("name", "")
                cid = skill_res.data[0].get("course_id")
                if cid and not course_title:
                    course_res = supabase.table("courses").select("title").eq("id", cid).execute()
                    if course_res.data:
                        course_title = course_res.data[0].get("title", "")

        if not skill_name:
            return []

        # 3. Call YouTube
        videos = fetch_youtube_videos(course_title, skill_name)
        if not videos:
            return []
            
        # 4. Final safety check: Re-verify existence after network call to prevent race condition duplicates
        check_again = supabase.table("materials").select("id").eq("skill_id", skill_id).eq("is_ai_recommended", True).execute()
        if check_again.data:
            final_res = supabase.table("materials").select("*").eq("skill_id", skill_id).eq("is_ai_recommended", True).execute()
            return final_res.data[:3]

        # 5. Look up course_id for this skill
        skill_row = supabase.table("skills").select("course_id").eq("id", skill_id).execute()
        course_id = skill_row.data[0]["course_id"] if skill_row.data else None

        inserted_materials = []
        for video in videos[:3]: # Ensure we only insert up to 3
            material_data = {
                "skill_id": skill_id,
                "course_id": course_id,
                "title": video["title"],
                "type": "video",
                "content": video["url"],
                "is_ai_recommended": True,
            }
            res = supabase.table("materials").insert(material_data).execute()
            if res.data:
                inserted_materials.append(res.data[0])
                
        return inserted_materials[:3]
    except Exception as e:
        print(f"YouTube recommend error: {e}")
        return []


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

        # 2. Keep a mapping of old_node_id -> new_skill_uuid and skill names
        id_mapping = {}
        skill_names = {}  # new_uuid -> skill_name

        # 3. Iterate through nodes, insert into skills table
        for node in request.nodes:
            old_id = node.get("id")
            node_data = node.get("data", {})
            label = node_data.get("label", "Unknown Skill")
            pos = node.get("position", {})
            skill_data = {
                "course_id": course_id,
                "name": label,
                "description": node_data.get("description", ""),
                "questions_count": node_data.get("questions_count", 5),
                "pass_threshold": node_data.get("pass_threshold", 60),
                "position_x": pos.get("x"),
                "position_y": pos.get("y"),
            }
            skill_res = supabase.table("skills").insert(skill_data).execute()
            if skill_res.data:
                new_skill_uuid = skill_res.data[0]["id"]
                id_mapping[old_id] = new_skill_uuid
                skill_names[new_skill_uuid] = label

        # 4. Auto-attach YouTube tutorials for each skill
        for skill_uuid, skill_name in skill_names.items():
            videos = fetch_youtube_videos(request.title, skill_name)
            for video in videos:
                try:
                    supabase.table("materials").insert({
                        "skill_id": skill_uuid,
                        "course_id": course_id,
                        "title": video["title"],
                        "type": "video",
                        "content": video["url"],
                        "is_ai_recommended": True,
                    }).execute()
                except Exception as yt_err:
                    print(f"Failed to insert YouTube material for '{skill_name}': {yt_err}")

        # 5. Iterate through edges and lookup the mapping
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
    questions_count: int = 5
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

# ── Materials Management ──

class MaterialCreate(BaseModel):
    title: str
    type: str # text, video, file, link
    content: str

@router.post("/api/skills/{skill_id}/materials")
def create_skill_material(skill_id: str, req: MaterialCreate, supabase: Client = Depends(get_supabase_client)):
    try:
        # Get course_id for this skill
        skill_res = supabase.table("skills").select("course_id").eq("id", skill_id).execute()
        if not skill_res.data:
            raise HTTPException(status_code=404, detail="Skill not found")
        course_id = skill_res.data[0]["course_id"]

        material_data = {
            "skill_id": skill_id,
            "course_id": course_id,
            "title": req.title,
            "type": req.type,
            "content": req.content,
            "is_ai_recommended": False,
        }
        res = supabase.table("materials").insert(material_data).execute()
        if not res.data:
            raise HTTPException(status_code=400, detail="Failed to create material")
        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/api/materials/{material_id}")
def delete_material(material_id: str, supabase: Client = Depends(get_supabase_client)):
    try:
        res = supabase.table("materials").delete().eq("id", material_id).execute()
        return {"status": "success", "deleted": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class MaterialUpdate(BaseModel):
    title: Optional[str] = None
    type: Optional[str] = None
    content: Optional[str] = None

@router.put("/api/materials/{material_id}")
def update_material(material_id: str, req: MaterialUpdate, supabase: Client = Depends(get_supabase_client)):
    try:
        update_data = {}
        if req.title is not None: update_data["title"] = req.title
        if req.type is not None: update_data["type"] = req.type
        if req.content is not None: update_data["content"] = req.content
        res = supabase.table("materials").update(update_data).eq("id", material_id).execute()
        return res.data[0] if res.data else {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from typing import Optional

class CourseSettingsUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    questions_count: int = 5
    pass_threshold: int = 60
    is_public: Optional[bool] = None

@router.put("/api/courses/{course_id}/settings")
def update_course_settings(course_id: str, req: CourseSettingsUpdate, supabase: Client = Depends(get_supabase_client)):
    """Update quiz settings for ALL skills in a course at once, and global course properties"""
    try:
        # Update skills
        res = supabase.table("skills").update({
            "questions_count": req.questions_count,
            "pass_threshold": req.pass_threshold
        }).eq("course_id", course_id).execute()

        # Update course-level properties if provided
        course_updates: Dict[str, Any] = {}
        if req.is_public is not None:
            course_updates["is_public"] = req.is_public
        if req.title is not None:
            course_updates["title"] = req.title
        if req.description is not None:
            course_updates["description"] = req.description
            
        courses_updated = 0
        if course_updates:
            print(f"Updating course {course_id} with {course_updates}")
            c_res = supabase.table("courses").update(course_updates).eq("id", course_id).execute()
            print(f"Course update result: {c_res}")
            courses_updated = len(c_res.data) if c_res.data else 0

        return {
            "status": "success", 
            "updated_skills": len(res.data) if res.data else 0,
            "updated_courses": courses_updated
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

class GraphUpdateRequest(BaseModel):
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]

@router.put("/api/courses/{course_id}/graph")
def update_course_graph(course_id: UUID, req: GraphUpdateRequest, supabase: Client = Depends(get_supabase_client)):
    """Synchronize the full graph state with the database for an existing course."""
    try:
        cid_str = str(course_id)
        
        # 1. Fetch current skills to identify what to delete/update
        current_skills_res = supabase.table("skills").select("id").eq("course_id", cid_str).execute()
        current_skill_ids = {s["id"] for s in current_skills_res.data}
        
        id_mapping = {} # maps old/client ID -> actual UUID
        incoming_ids = set()
        
        # 2. Process Nodes
        for node in req.nodes:
            old_id = node.get("id")
            node_data = node.get("data", {})
            name = node_data.get("label", "New Unit")
            description = node_data.get("description", "")
            q_count = node_data.get("questions_count", 5)
            p_thresh = node_data.get("pass_threshold", 60)
            pos = node.get("position", {})
            pos_x = pos.get("x")
            pos_y = pos.get("y")
            
            # Check if this node is an existing UUID
            is_uuid = False
            try:
                UUID(old_id)
                is_uuid = True
            except (ValueError, TypeError):
                is_uuid = False
                
            if is_uuid and old_id in current_skill_ids:
                # Update existing — persist new position too
                supabase.table("skills").update({
                    "name": name,
                    "description": description,
                    "questions_count": q_count,
                    "pass_threshold": p_thresh,
                    "position_x": pos_x,
                    "position_y": pos_y,
                }).eq("id", old_id).execute()
                id_mapping[old_id] = old_id
                incoming_ids.add(old_id)
            else:
                # Insert new with position
                new_skill = {
                    "course_id": cid_str,
                    "name": name,
                    "description": description,
                    "questions_count": q_count,
                    "pass_threshold": p_thresh,
                    "position_x": pos_x,
                    "position_y": pos_y,
                }
                res = supabase.table("skills").insert(new_skill).execute()
                if res.data:
                    new_uuid = res.data[0]["id"]
                    id_mapping[old_id] = new_uuid
                    incoming_ids.add(new_uuid)
        
        # 3. Delete nodes that were removed from the UI
        ids_to_delete = current_skill_ids - incoming_ids
        if ids_to_delete:
            # Note: This will cascade to edges and progress if DB is configured with foreign key cascades
            supabase.table("skills").delete().in_("id", list(ids_to_delete)).execute()
            
        # 4. Re-sync Edges (Simplest way: delete all and re-add)
        supabase.table("prerequisite_edges").delete().eq("course_id", cid_str).execute()
        
        for edge in req.edges:
            source_client = edge.get("source")
            target_client = edge.get("target")
            
            source_uuid = id_mapping.get(source_client)
            target_uuid = id_mapping.get(target_client)
            
            if source_uuid and target_uuid:
                supabase.table("prerequisite_edges").insert({
                    "course_id": cid_str,
                    "source_skill_id": source_uuid,
                    "target_skill_id": target_uuid
                }).execute()
                
        return {"status": "success", "nodes_processed": len(req.nodes)}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

class SkillSettingsUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    questions_count: Optional[int] = None
    pass_threshold: Optional[int] = None

@router.put("/api/skills/{skill_id}")
def update_skill_settings(skill_id: UUID, settings: SkillSettingsUpdate, supabase: Client = Depends(get_supabase_client)):
    try:
        update_data = {k: v for k, v in settings.dict(exclude_unset=True).items()}
        if not update_data:
            return {"message": "No fields to update"}
        
        res = supabase.table("skills").update(update_data).eq("id", str(skill_id)).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Skill not found or no changes made")
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
