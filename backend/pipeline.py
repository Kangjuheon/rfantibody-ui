import os, shutil, uuid, json, re
from pathlib import Path
from typing import Dict, Any, List, Tuple
import docker

JOBS_ROOT = Path(os.getenv("JOBS_ROOT", "/data/jobs"))
RF_IMAGE   = os.getenv("RFANTIBODY_IMAGE", "rfantibody:latest")

RF_WEIGHTS_HOST = os.getenv("RF_WEIGHTS_HOST", "./third_party/RFantibody/weights")

from docker.types import DeviceRequest
GPU_REQ = [DeviceRequest(count=-1, capabilities=[["gpu"]])]

def ensure_dirs(p: Path):
    p.mkdir(parents=True, exist_ok=True)

def parse_design_loops(user_str: str) -> str:

    s = user_str.strip()
    if not s:
        return ""
    
    items = [re.sub(r"\s+", "", it) for it in s.split(",") if it.strip()]
    
    valid = []
    for it in items:
        if re.match(r"^(H1|H2|H3|L1|L2|L3)(:(\d+(-\d+)?))?$", it):
            valid.append(it)
    return "[" + ",".join(valid) + "]" if valid else ""

def parse_hotspots(user_str: str) -> str:

    s = user_str.strip()
    if not s:
        return "[]"
    
    toks = [re.sub(r"\s+", "", t) for t in s.split(",") if t.strip()]
    expanded: List[str] = []
    for t in toks:
        m = re.match(r"^T(\d+)-T?(\d+)$", t, re.IGNORECASE)
        if m:
            a, b = int(m.group(1)), int(m.group(2))
            lo, hi = (a, b) if a <= b else (b, a)
            expanded += [f"T{idx}" for idx in range(lo, hi+1)]
        else:
            if re.match(r"^T\d+$", t, re.IGNORECASE):
                expanded.append("T" + re.findall(r"\d+", t)[0])
    return "[" + ",".join(expanded) + "]" if expanded else "[]"

SETUP_SENTINEL = "/home/.rf_setup_done"

def with_setup(cmd: str) -> str:
    setup = f"""
      if [ ! -f {SETUP_SENTINEL} ]; then
        echo "[RFantibody setup] running include/setup.sh ..."
        bash /home/include/setup.sh && touch {SETUP_SENTINEL} || exit 97
      fi
    """
    return setup + "\n" + cmd

def run_in_container(cmd: str, job_dir: Path, mem: str = "10g") -> Tuple[int, str]:
    
    client = docker.from_env()
    volumes = {
        str(job_dir): {"bind": "/home/job", "mode": "rw"},
        str(Path(RF_WEIGHTS_HOST).resolve()): {"bind": "/home/weights", "mode": "ro"},
    }
    container = client.containers.run(
        image=RF_IMAGE,
        command=["/bin/bash","-lc", cmd],
        volumes=volumes,
        device_requests=GPU_REQ,
        mem_limit=mem,
        working_dir="/home",   # RF README 기준
        detach=True,
        tty=False,
    )
    exit_code = container.wait()["StatusCode"]
    logs = container.logs().decode(errors="ignore")
    try:
        container.remove(force=True)
    except Exception:
        pass
    return exit_code, logs

def orchestrate_pipeline(
    job_name: str,
    mode: str,
    hotspots: str,
    rf_diffusion_designs: int,
    protein_mpnn_designs: int,
    design_loops: str,
    framework_path_host: Path,
    target_path_host: Path,
) -> Dict[str, Any]:

    job_id = f"{job_name}_{uuid.uuid4().hex[:8]}"
    job_dir = JOBS_ROOT / job_id
    inp_dir = job_dir / "input"
    out_dir = job_dir / "output"
    ensure_dirs(inp_dir); ensure_dirs(out_dir)

    fw_host = inp_dir / framework_path_host.name
    tg_host = inp_dir / target_path_host.name
    shutil.move(str(framework_path_host), fw_host)
    shutil.move(str(target_path_host), tg_host)

    loops_arg = parse_design_loops(design_loops)
    hotspots_arg = parse_hotspots(hotspots)

    rfd_out_prefix = f"/home/job/output/ab_des"

    rfd_cmd = [
        "poetry run python /home/src/rfantibody/scripts/rfdiffusion_inference.py",
        "--config-name antibody",
        f"antibody.target_pdb=/home/job/input/{tg_host.name}",
        f"antibody.framework_pdb=/home/job/input/{fw_host.name}",
        "inference.ckpt_override_path=/home/weights/RFdiffusion_Ab.pt",
        f"ppi.hotspot_res={hotspots_arg}",
    ]
    if loops_arg:
        rfd_cmd.append(f"antibody.design_loops={loops_arg}")
    rfd_cmd += [
        f"inference.num_designs={rf_diffusion_designs}",
        f"inference.output_prefix={rfd_out_prefix}"
    ]
    cmd1 = " ".join(rfd_cmd)
    cmd1 = with_setup(cmd1)
    code1, log1 = run_in_container(cmd1, job_dir)
    if code1 != 0:
        return {"status":"error","stage":"rfdiffusion","log":log1, "jobId": job_id}

    rfd_dir = out_dir / "rfdiffusion"
    ensure_dirs(rfd_dir)

    mpnn_out = "/home/job/output/proteinmpnn"
    cmd2 = " ".join([
        "poetry run python /home/scripts/proteinmpnn_interface_design.py",
        f"-pdbdir /home/job/output",
        f"-outpdbdir {mpnn_out}",
        f"-numseq {protein_mpnn_designs}",
    ])

    cmd2 = with_setup(cmd2)
    code2, log2 = run_in_container(cmd2, job_dir)
    if code2 != 0:
        return {"status":"error","stage":"proteinmpnn","log":log2, "jobId": job_id}

    rf2_inp = "/home/job/output/proteinmpnn"
    rf2_out = "/home/job/output/rf2"
    cmd3 = " ".join([
        "poetry run python /home/scripts/rf2_predict.py",
        f"input.pdb_dir={rf2_inp}",
        f"output.pdb_dir={rf2_out}"
    ])

    cmd3 = with_setup(cmd3)
    code3, log3 = run_in_container(cmd3, job_dir)
    if code3 != 0:
        return {"status":"error","stage":"rf2","log":log3, "jobId": job_id}

    artifacts = [
        f"/files/jobs/{job_id}/output"
    ]
    return {
        "status": "ok",
        "jobId": job_id,
        "artifacts": [f"/api/jobs/{job_id}/archive"]
    }