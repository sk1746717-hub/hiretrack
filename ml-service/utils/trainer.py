import os
import json
import joblib
import pandas as pd
import numpy as np
from datetime import datetime, timezone
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix, classification_report

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "synthetic_recruitment_data.csv")
MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
MODEL_PATH = os.path.join(MODEL_DIR, "candidate_success_model.joblib")
META_PATH = os.path.join(MODEL_DIR, "model_metadata.json")

FEATURE_COLUMNS = [
    "skill_match_percentage",
    "semantic_similarity_percentage",
    "relevant_experience_years",
    "interview_score",
    "assessment_score",
    "required_skills_matched",
    "total_required_skills",
    "skill_gap_percentage"
]

TARGET_COLUMN = "success"

def train_and_save_model(random_state: int = 42) -> dict:
    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(f"Training data not found at {DATA_PATH}. Please run generate_dataset.py first.")

    df = pd.read_csv(DATA_PATH)
    
    X = df[FEATURE_COLUMNS]
    y = df[TARGET_COLUMN]

    # 1. Stratified Train / Test Split (80% train, 20% test)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=random_state, stratify=y
    )

    # 2. Instantiate and fit RandomForestClassifier
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=6,
        min_samples_split=4,
        random_state=random_state
    )
    model.fit(X_train, y_train)

    # 3. Model Predictions & Probability
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]

    # 4. Calculate Evaluation Metrics
    acc = float(accuracy_score(y_test, y_pred))
    prec = float(precision_score(y_test, y_pred, zero_division=0))
    rec = float(recall_score(y_test, y_pred, zero_division=0))
    f1 = float(f1_score(y_test, y_pred, zero_division=0))
    roc_auc = float(roc_auc_score(y_test, y_prob))
    conf_mat = confusion_matrix(y_test, y_pred).tolist()

    # 5. Extract Feature Importances
    importances = model.feature_importances_
    feat_imp_dict = dict(zip(FEATURE_COLUMNS, importances))
    sorted_feat_imp = sorted(
        [{"feature": k, "importance": round(float(v), 4)} for k, v in feat_imp_dict.items()],
        key=lambda x: x["importance"],
        reverse=True
    )

    os.makedirs(MODEL_DIR, exist_ok=True)

    # 6. Save Joblib Model
    joblib.dump(model, MODEL_PATH)
    print(f"Model saved to {MODEL_PATH}")

    # 7. Save Model Metadata
    metadata = {
        "modelName": "HireTrack Candidate Success Predictor",
        "modelVersion": "1.0.0",
        "modelType": "RandomForestClassifier",
        "datasetType": "Synthetic development/demo dataset",
        "trainedAt": datetime.now(timezone.utc).isoformat(),
        "randomState": random_state,
        "sampleSize": len(df),
        "trainSize": len(X_train),
        "testSize": len(X_test),
        "featureColumns": FEATURE_COLUMNS,
        "targetColumn": TARGET_COLUMN,
        "metrics": {
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1Score": round(f1, 4),
            "rocAuc": round(roc_auc, 4),
            "confusionMatrix": conf_mat
        },
        "featureImportances": sorted_feat_imp,
        "disclaimer": "This prediction model is trained on a synthetic demonstration dataset for development purposes. Real organizational recruitment outcome data is required for production deployment."
    }

    with open(META_PATH, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print(f"Metadata saved to {META_PATH}")
    return metadata

if __name__ == "__main__":
    train_and_save_model()
