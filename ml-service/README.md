# HireTrack V2 — Isolated Python AIML Microservice

This microservice provides high-throughput NLP and Machine Learning capabilities to the HireTrack Applicant Tracking System.

## Architecture

- **Framework**: FastAPI (Python 3.13+)
- **ML / NLP Libraries**: Scikit-Learn, Pandas, NumPy, Pydantic
- **Host**: `http://127.0.0.1:8000`

## Setup & Running

```bash
# 1. Navigate to directory
cd ml-service

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run FastAPI service
python app.py
# or
uvicorn app:app --host 127.0.0.1 --port 8000 --reload
```

## Endpoints

- `GET /` — Microservice meta info
- `GET /health` — Microservice health telemetry
