from fastapi import FastAPI, UploadFile, File, Form
from typing import Dict, Any
from pathlib import Path
from tempfile import NamedTemporaryFile
import shutil, os

from pipeline import orchestrate_pipeline

app = FastAPI()

def save_upload(u: UploadFile) -> Path:
    suffix = "_" + u.filename.replace("/", "_")
    tmp = NamedTemporaryFile(delete=False, suffix=suffix)
    with tmp as out:
        shutil.copyfileobj(u.file, out)
    return Path(tmp.name)

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
    fw = save_upload(frameworkFile)
    tg = save_upload(targetFile)
    try:
        result = orchestrate_pipeline(
            job_name=jobName,
            mode=mode,
            hotspots=hotspots,
            rf_diffusion_designs=rfDiffusionDesigns,
            protein_mpnn_designs=proteinMPNNDesigns,
            design_loops=designLoops,
            framework_path_host=fw,
            target_path_host=tg,
        )
        return result
    finally:
        # 실패 시 임시파일 정리 (성공 시 orchestrate_pipeline 내부에서 job 디렉터리로 이동함)
        if fw.exists() and fw.parent == Path("/tmp"):
            try: fw.unlink()
            except: pass
        if tg.exists() and tg.parent == Path("/tmp"):
            try: tg.unlink()
            except: pass