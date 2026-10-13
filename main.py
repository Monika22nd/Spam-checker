from __future__ import annotations

import json
import os
import time
from pathlib import Path
from typing import Any

os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")

import pandas as pd
import tensorflow as tf
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field


BASE_DIR = Path(__file__).resolve().parent
ARTIFACT_DIR = BASE_DIR / "artifacts"
STATIC_DIR = BASE_DIR / "static"
MODEL_PATH = ARTIFACT_DIR / "spam_lstm.keras"
DATA_PATH = ARTIFACT_DIR / "spam_cleaned.csv"
METRICS_PATH = ARTIFACT_DIR / "test_metrics.json"


class PredictionRequest(BaseModel):
    message: str = Field(min_length=1, max_length=5000)
    threshold: float = Field(default=0.5, ge=0.1, le=0.9)


def require_artifacts() -> None:
    missing = [
        path.name
        for path in (MODEL_PATH, DATA_PATH, METRICS_PATH)
        if not path.exists()
    ]
    if missing:
        raise RuntimeError("Thiếu artifact: " + ", ".join(missing))


require_artifacts()
model = tf.keras.models.load_model(MODEL_PATH)
dataset = pd.read_csv(DATA_PATH)
with METRICS_PATH.open("r", encoding="utf-8") as handle:
    test_metrics: dict[str, float] = json.load(handle)


label_counts = dataset["label"].value_counts().to_dict()
total_rows = int(len(dataset))
ham_count = int(label_counts.get("ham", 0))
spam_count = int(label_counts.get("spam", 0))
message_lengths = dataset["message"].astype(str).str.len()


def layer_details() -> list[dict[str, Any]]:
    details = []
    for layer in model.layers:
        try:
            params = int(layer.count_params())
        except ValueError:
            params = 0
        details.append(
            {
                "name": layer.name,
                "type": layer.__class__.__name__,
                "parameters": params,
            }
        )
    return details


def predict_probability(message: str) -> float:
    inputs = tf.constant([message], dtype=tf.string)
    output = model(inputs, training=False).numpy()
    return float(output[0, 0])


app = FastAPI(
    title="SMS Spam LSTM",
    description="Ứng dụng dự đoán tin nhắn spam bằng mô hình LSTM.",
    version="1.0.0",
)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/", include_in_schema=False)
def index() -> FileResponse:
    return FileResponse(STATIC_DIR / "index.html")


@app.get("/api/health")
def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "model_loaded": True,
        "tensorflow_version": tf.__version__,
        "dataset_rows": total_rows,
    }


@app.get("/api/dashboard")
def dashboard() -> dict[str, Any]:
    examples = {
        "spam": dataset.loc[dataset["target"] == 1, "message"].head(3).tolist(),
        "normal": dataset.loc[dataset["target"] == 0, "message"].head(3).tolist(),
    }
    return {
        "metrics": test_metrics,
        "dataset": {
            "total": total_rows,
            "normal": ham_count,
            "spam": spam_count,
            "normal_percent": round(ham_count / total_rows * 100, 2),
            "spam_percent": round(spam_count / total_rows * 100, 2),
            "average_length": round(float(message_lengths.mean()), 1),
            "median_length": round(float(message_lengths.median()), 1),
            "max_length": int(message_lengths.max()),
        },
        "model": {
            "name": "LSTM phân loại SMS",
            "framework": f"TensorFlow {tf.__version__}",
            "input": "Chuỗi văn bản",
            "output": "Xác suất Spam từ 0 đến 1",
            "parameters": int(model.count_params()),
            "layers": layer_details(),
            "model_file_mb": round(MODEL_PATH.stat().st_size / 1024 / 1024, 2),
        },
        "examples": examples,
    }


@app.post("/api/predict")
def predict(payload: PredictionRequest) -> dict[str, Any]:
    message = payload.message.strip()
    if not message:
        raise HTTPException(status_code=422, detail="Tin nhắn không được để trống.")

    started_at = time.perf_counter()
    spam_probability = predict_probability(message)
    elapsed_ms = (time.perf_counter() - started_at) * 1000
    normal_probability = 1.0 - spam_probability
    is_spam = spam_probability >= payload.threshold

    if spam_probability >= 0.8:
        risk = "Rất cao"
    elif spam_probability >= 0.6:
        risk = "Cao"
    elif spam_probability >= 0.4:
        risk = "Trung bình"
    elif spam_probability >= 0.2:
        risk = "Thấp"
    else:
        risk = "Rất thấp"

    words = message.split()
    return {
        "prediction": "SPAM" if is_spam else "NORMAL",
        "is_spam": is_spam,
        "spam_probability": spam_probability,
        "normal_probability": normal_probability,
        "threshold": payload.threshold,
        "risk_level": risk,
        "processing_ms": round(elapsed_ms, 2),
        "text_statistics": {
            "characters": len(message),
            "words": len(words),
            "digits": sum(character.isdigit() for character in message),
            "uppercase": sum(character.isupper() for character in message),
            "links": sum(token.lower().startswith(("http://", "https://", "www.")) for token in words),
        },
    }

