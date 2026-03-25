from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
import httpx
import os
from app.config import settings

router = APIRouter()


class ExtractRequest(BaseModel):
    url: str


@router.post("/extract")
async def public_extract(body: ExtractRequest):
    """
    Public demo extraction — JSON only, single URL, rate limited.
    This proxies to the scraper service for a quick extraction demo.
    """
    if not body.url.startswith("http"):
        raise HTTPException(status_code=400, detail="Invalid URL")

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{settings.SCRAPER_SERVICE_URL}/public/extract",
                json={"url": body.url, "format": "json", "max_pages": 1},
            )
            if not resp.is_success:
                raise HTTPException(status_code=502, detail="Extraction failed")

            data = resp.json()
            filename = f"extract_{hash(body.url)}.json"

            return {
                "ok": True,
                "url": body.url,
                "export": {
                    "format": "json",
                    "filename": filename,
                    "pages": data.get("pages", 1),
                    "chunks": data.get("chunks", 0),
                    "download_url": f"/api/public-extract/download/{filename}",
                }
            }
    except httpx.RequestError:
        raise HTTPException(
            status_code=502,
            detail="Scraper service unavailable. Start the scraper or configure SCRAPER_SERVICE_URL."
        )
