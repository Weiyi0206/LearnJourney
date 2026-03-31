from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.courses import router as courses_router
from app.api.student import router as student_router
from app.api.quiz import router as quiz_router
from app.api.diagnostic import router as diagnostic_router

app = FastAPI(
    title="LearnJourney API",
    description="Backend Graph API for LearnJourney",
    version="1.0.0"
)

# Set up CORS middleware to allow requests from the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the routers
app.include_router(courses_router)
app.include_router(student_router)
app.include_router(quiz_router)
app.include_router(diagnostic_router)

@app.get("/")
def read_root():
    return {"message": "Welcome to LearnJourney API!"}
