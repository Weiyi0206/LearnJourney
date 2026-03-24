from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime
from uuid import UUID

class CourseBase(BaseModel):
    title: str
    description: Optional[str] = None
    is_published: bool = False

class CourseCreate(CourseBase):
    educator_id: UUID

class Course(CourseBase):
    id: UUID
    educator_id: UUID
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class SkillBase(BaseModel):
    name: str
    complexity_score: float = 0.0
    questions_count: int = 20
    pass_threshold: int = 60

class Skill(SkillBase):
    id: UUID
    course_id: UUID
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class PrerequisiteEdgeBase(BaseModel):
    source_skill_id: UUID
    target_skill_id: UUID

class PrerequisiteEdge(PrerequisiteEdgeBase):
    id: UUID
    course_id: UUID
    
    model_config = ConfigDict(from_attributes=True)

class MaterialBase(BaseModel):
    title: str
    type: str # text, video, file, link
    content: str
    skill_id: Optional[UUID] = None

class Material(MaterialBase):
    id: UUID
    course_id: UUID
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class CourseGraphResponse(Course):
    skills: List[Skill] = []
    prerequisite_edges: List[PrerequisiteEdge] = []
