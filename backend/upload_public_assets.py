#!/usr/bin/env python3
"""Resize scraped content/media files and upload web derivatives to sb-assets-public.

HD originals stay on disk (and optionally go to the private bucket). Public cards
are JPEG, max 1600px, for fast catalogue/Discover renders.

Usage (from repo root):
  SUPABASE_SERVICE_ROLE_KEY=... python3 backend/upload_public_assets.py
  python3 backend/upload_public_assets.py --originals   # also push HD to private bucket
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from io import BytesIO
from pathlib import Path

from PIL import Image, ImageFile

ImageFile.LOAD_TRUNCATED_IMAGES = True

ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / "content"
MANIFEST = CONTENT / "media-manifest.json"
PUBLIC_URL = os.environ.get("SUPABASE_URL", "https://ozexvctgofwxcikvcxwg.supabase.co")
MAX_EDGE = 1600
JPEG_QUALITY = 82


def card_storage_path(path: str) -> str:
    rel = path.removeprefix("media/").lstrip("/")
    parts = ["card" if part == "original" else part for part in Path(rel).parts]
    return str(Path(*parts).with_suffix(".jpg"))


def original_storage_path(path: str) -> str:
    return path.removeprefix("media/").lstrip("/")


def local_file(path: str) -> Path:
    rel = path.lstrip("/")
    if rel.startswith("content/"):
        return ROOT / rel
    return CONTENT / rel


def make_card(src: Path) -> bytes:
    with Image.open(src) as im:
        im = im.convert("RGB")
        im.thumbnail((MAX_EDGE, MAX_EDGE), Image.Resampling.LANCZOS)
        buf = BytesIO()
        im.save(buf, format="JPEG", quality=JPEG_QUALITY, optimize=True)
        return buf.getvalue()


def supabase_url() -> str:
    return os.environ.get("SUPABASE_URL", "https://ozexvctgofwxcikvcxwg.supabase.co")


def upload(bucket: str, storage_path: str, body: bytes, content_type: str, key: str) -> None:
    url = f"{supabase_url()}/storage/v1/object/{bucket}/{storage_path}"
    req = urllib.request.Request(url, data=body, method="POST")
    req.add_header("Authorization", f"Bearer {key}")
    req.add_header("apikey", key)
    req.add_header("Content-Type", content_type)
    req.add_header("x-upsert", "true")
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            resp.read()
    except urllib.error.HTTPError as err:
        if err.code in {409, 400}:
            # Retry as upsert PUT
            req = urllib.request.Request(url, data=body, method="PUT")
            req.add_header("Authorization", f"Bearer {key}")
            req.add_header("apikey", key)
            req.add_header("Content-Type", content_type)
            req.add_header("x-upsert", "true")
            with urllib.request.urlopen(req, timeout=120) as resp:
                resp.read()
            return
        raise


def process_one(entry: dict, key: str, originals: bool) -> str:
    path = entry.get("path") or ""
    src = local_file(path)
    if not src.exists():
        return f"missing {path}"
    card_path = card_storage_path(path)
    upload("sb-assets-public", card_path, make_card(src), "image/jpeg", key)
    if originals:
        mime = entry.get("contentType") or "image/jpeg"
        upload("sb-assets-original", original_storage_path(path), src.read_bytes(), mime, key)
    return f"ok {card_path}"


def load_env() -> None:
    env_path = Path(__file__).resolve().parent / ".env.local"
    if not env_path.exists():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        name, value = line.split("=", 1)
        os.environ.setdefault(name.strip(), value.strip())


def main() -> None:
    load_env()
    parser = argparse.ArgumentParser()
    parser.add_argument("--originals", action="store_true", help="Also upload HD files to the private bucket")
    parser.add_argument("--workers", type=int, default=6)
    args = parser.parse_args()
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not key:
        sys.exit("Set SUPABASE_SERVICE_ROLE_KEY")
    files = json.loads(MANIFEST.read_text(encoding="utf-8")).get("files") or []
    files = [f for f in files if f.get("status") in {None, "ok", "cached"}]
    print(f"Uploading {len(files)} web derivatives to {supabase_url()}", flush=True)
    ok = 0
    failed: list[str] = []
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = {pool.submit(process_one, entry, key, args.originals): entry for entry in files}
        for i, fut in enumerate(as_completed(futures), 1):
            try:
                msg = fut.result()
                if msg.startswith("ok"):
                    ok += 1
                else:
                    failed.append(msg)
            except Exception as exc:
                failed.append(f"{futures[fut].get('path')}: {exc}")
            if i % 25 == 0 or i == len(futures):
                print(f"  {i}/{len(futures)}  ok={ok} fail={len(failed)}", flush=True)
    print(json.dumps({"ok": ok, "failed": len(failed), "errors": failed[:20]}, indent=2))
    if failed and ok == 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
