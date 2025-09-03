from fastapi import FastAPI, UploadFile, File, Form
from typing import Dict, Any
from pathlib import Path
from tempfile import NamedTemporaryFile
import shutil, os
from loguru import logger
from pipeline import orchestrate_pipeline
from fastapi.staticfiles import StaticFiles
from fastapi import HTTPException
from fastapi.responses import FileResponse
from pathlib import Path
import shutil, tempfile, os

JOBS_ROOT = Path(os.getenv("JOBS_ROOT", "/data/jobs"))

app = FastAPI()

app.mount("/files/jobs", StaticFiles(directory="/data/jobs"), name="jobfiles")

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
    except Exception as e:
        logger.info(f"Exception during pipeline execution: {e}")
    finally:
        
        if fw.exists() and fw.parent == Path("/tmp"):
            try: fw.unlink()
            except: pass
        if tg.exists() and tg.parent == Path("/tmp"):
            try: tg.unlink()
            except: pass

def safe_job_dir(job_id: str) -> Path:
    
    p = (JOBS_ROOT / job_id).resolve()
    if not str(p).startswith(str(JOBS_ROOT.resolve())):
        raise HTTPException(status_code=400, detail="invalid job id")
    return p

@app.get("/jobs/{job_id}/archive")
def download_job_archive(job_id: str):
    job_dir = safe_job_dir(job_id)
    out_dir = job_dir / "output"
    if not out_dir.exists():
        raise HTTPException(status_code=404, detail="output not found")

    tmpdir = tempfile.mkdtemp()
    zip_path = Path(tmpdir) / f"{job_id}_output.zip"
    
    shutil.make_archive(zip_path.with_suffix(""), "zip", root_dir=out_dir)
    
    return FileResponse(
        path=str(zip_path),
        media_type="application/zip",
        filename=f"{job_id}_output.zip",
        headers={"Cache-Control": "no-store"}
    )