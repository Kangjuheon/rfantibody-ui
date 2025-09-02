from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, Dict, Any
import os

app = FastAPI()

# CORS (직접 호출 시 대비용; 프록시 환경에서는 필요 없지만 안전 차원)
ALLOW_ORIGINS = os.getenv("ALLOW_ORIGINS", "http://localhost:2239").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in ALLOW_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/rfantibody_pipeline")
async def rfantibody_pipeline(
    jobName: str = Form(...),
    mode: str = Form(...),
    hotspots: str = Form(...),
    rfDiffusionDesigns: int = Form(...),
    proteinMPNNDesigns: int = Form(...),
    designLoops: str = Form(""),
    frameworkFile: UploadFile = File(...),
    targetFile: UploadFile = File(...),
) -> Dict[str, Any]:
    # 여기서 실제 파이프라인 로직을 수행하면 됨.
    # 지금은 데모로 파일 이름/크기만 확인해서 돌려준다.
    framework_bytes = await frameworkFile.read()
    target_bytes = await targetFile.read()

    result = {
        "status": "ok",
        "message": "Request received",
        "job": {
            "jobName": jobName,
            "mode": mode,
            "hotspots": hotspots,
            "rfDiffusionDesigns": rfDiffusionDesigns,
            "proteinMPNNDesigns": proteinMPNNDesigns,
            "designLoops": designLoops,
        },
        "files": {
            "frameworkFile": {
                "filename": frameworkFile.filename,
                "size_bytes": len(framework_bytes),
            },
            "targetFile": {
                "filename": targetFile.filename,
                "size_bytes": len(target_bytes),
            },
        },
        # 실제 연산 결과가 있다면 여기에 경로/URL/메트릭 등을 담아 반환
        "artifacts": [],  # e.g., ["s3://.../design_001.pdb"]
    }
    return result
