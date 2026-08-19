import os
import time
from datetime import datetime, timezone
from typing import List
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv
from services.resume_service import analyze_resume
from services.matching_service import compute_candidate_job_match
from services.ranking_service import rank_candidates
from services.skill_gap_service import calculate_skill_gap
from services.prediction_service import predict_candidate_success
from services.interview_intelligence_service import analyze_interview

load_dotenv()






APP_NAME = "HireTrack Python AIML Engine"
APP_VERSION = "2.0.0"
START_TIME = time.time()

app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    description="Isolated Python AI/ML microservice providing NLP Resume Intelligence, Semantic Candidate-Job Matching, Skill Gap Analysis, Candidate Ranking, ML Success Prediction, and Interview Intelligence."
)

# CORS configuration for Node Express backend & Frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "status": "error",
            "message": f"Internal AIML Service Error: {str(exc)}",
            "path": str(request.url)
        }
    )

@app.get("/", tags=["Info"])
def root():
    return {
        "service": APP_NAME,
        "version": APP_VERSION,
        "status": "online",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@app.get("/health", tags=["Health"])
def health_check():
    uptime_seconds = round(time.time() - START_TIME, 2)
    return {
        "status": "ok",
        "service": APP_NAME,
        "version": APP_VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "uptime_seconds": uptime_seconds,
        "environment": os.getenv("ENV", "development"),
        "modules": {

            "resume_intelligence": "ready",
            "semantic_matching": "ready",
            "candidate_ranking": "ready",
            "skill_gap_analysis": "ready",
            "success_prediction": "ready",
            "interview_intelligence": "ready"
        }
    }

class ResumeAnalysisRequest(BaseModel):

    resumeText: str

@app.post("/analyze-resume", tags=["Resume Intelligence"])
def analyze_resume_endpoint(payload: ResumeAnalysisRequest):
    if not payload.resumeText or not payload.resumeText.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="resumeText parameter is required and cannot be empty."
        )
    
    try:
        analysis_result = analyze_resume(payload.resumeText)
        return {
            "success": True,
            "analysis": analysis_result
        }
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to perform resume analysis: {str(val_err)}"
        )

class JobData(BaseModel):

    title: str = ""
    description: str = ""
    requiredSkills: List[str] = []

class CandidateData(BaseModel):
    resumeText: str = ""
    skills: List[str] = []

class MatchCandidateRequest(BaseModel):
    job: JobData
    candidate: CandidateData

@app.post("/match-candidate", tags=["Semantic Matching"])
def match_candidate_endpoint(payload: MatchCandidateRequest):
    if not payload.job or (not payload.job.title and not payload.job.description and not payload.job.requiredSkills):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="job must contain at least title, description, or requiredSkills."
        )
    if not payload.candidate or (not payload.candidate.resumeText and not payload.candidate.skills):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="candidate must contain at least resumeText or skills."
        )

    try:
        match_result = compute_candidate_job_match(
            payload.job.model_dump() if hasattr(payload.job, "model_dump") else payload.job.dict(),
            payload.candidate.model_dump() if hasattr(payload.candidate, "model_dump") else payload.candidate.dict()
        )
        return match_result

    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err)
        )
from services.ranking_service import rank_candidates

class CandidateDataWithId(BaseModel):
    id: str = ""
    candidateId: str = ""
    name: str = ""
    candidateName: str = ""
    fullName: str = ""
    resumeText: str = ""
    skills: List[str] = []

class RankCandidatesRequest(BaseModel):
    job: JobData
    candidates: List[CandidateDataWithId]

@app.post("/rank-candidates", tags=["Candidate Ranking"])
def rank_candidates_endpoint(payload: RankCandidatesRequest):
    if not payload.job or (not payload.job.title and not payload.job.description and not payload.job.requiredSkills):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="job must contain at least title, description, or requiredSkills."
        )
    if not payload.candidates or len(payload.candidates) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="candidates list cannot be empty."
        )

    try:
        job_dict = payload.job.model_dump() if hasattr(payload.job, "model_dump") else payload.job.dict()
        candidates_list = [
            c.model_dump() if hasattr(c, "model_dump") else c.dict()
            for c in payload.candidates
        ]
        
        ranking_result = rank_candidates(job_dict, candidates_list)
        return ranking_result
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err)
        )
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to perform candidate ranking: {str(err)}"
        )

from services.skill_gap_service import calculate_skill_gap

class SkillGapRequest(BaseModel):

    job: JobData
    candidate: CandidateData

@app.post("/skill-gap", tags=["Skill Gap Analysis"])
def skill_gap_endpoint(payload: SkillGapRequest):
    if not payload.job or (not payload.job.title and not payload.job.description and not payload.job.requiredSkills):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="job must contain at least title, description, or requiredSkills."
        )
    if not payload.candidate or (not payload.candidate.resumeText and not payload.candidate.skills):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="candidate must contain at least resumeText or skills."
        )

    try:
        job_dict = payload.job.model_dump() if hasattr(payload.job, "model_dump") else payload.job.dict()
        cand_dict = payload.candidate.model_dump() if hasattr(payload.candidate, "model_dump") else payload.candidate.dict()
        
        result = calculate_skill_gap(job_dict, cand_dict)
        return result
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err)
        )
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to perform skill gap analysis: {str(err)}"
        )


class CandidateSuccessPredictionRequest(BaseModel):
    skillMatchPercentage: float = 0.0
    semanticSimilarityPercentage: float = 0.0
    relevantExperienceYears: float = 0.0
    interviewScore: float = 70.0
    assessmentScore: float = 70.0
    requiredSkillsMatched: int = 0
    totalRequiredSkills: int = 1
    skillGapPercentage: float = 0.0

@app.post("/predict-success", tags=["ML Success Prediction"])
def predict_success_endpoint(payload: CandidateSuccessPredictionRequest):
    try:
        data_dict = payload.model_dump() if hasattr(payload, "model_dump") else payload.dict()
        result = predict_candidate_success(data_dict)
        return result
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err)
        )
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to perform ML candidate success prediction: {str(err)}"
        )

class InterviewDataInput(BaseModel):
    technicalScore: float = 75.0
    communicationScore: float = 75.0
    problemSolvingScore: float = 75.0
    assessmentScore: float = 75.0
    interviewNotes: str = ""
    feedback: str = ""
    technicalProbesAnswered: List[str] = []

class InterviewAnalysisRequest(BaseModel):
    job: JobData = JobData()
    candidate: CandidateData = CandidateData()
    interviewData: InterviewDataInput = InterviewDataInput()

@app.post("/interview-analysis", tags=["Interview Intelligence"])
def interview_analysis_endpoint(payload: InterviewAnalysisRequest):
    try:
        job_dict = payload.job.model_dump() if hasattr(payload.job, "model_dump") else payload.job.dict()
        cand_dict = payload.candidate.model_dump() if hasattr(payload.candidate, "model_dump") else payload.candidate.dict()
        interview_dict = payload.interviewData.model_dump() if hasattr(payload.interviewData, "model_dump") else payload.interviewData.dict()

        result = analyze_interview(job_dict, cand_dict, interview_dict)
        return result
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err)
        )
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to perform AI interview intelligence analysis: {str(err)}"
        )








if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "127.0.0.1")
    uvicorn.run("app:app", host=host, port=port, reload=True)
