import os
from dotenv import load_dotenv
load_dotenv()

import asyncio
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import subprocess

app = FastAPI(
    title="Leads Generator API",
    description="API for the Smart Bill Book Leads Generator. This API provides an endpoint to fetch leads from Google Maps based on pincode and stores them in a SQLite database. Includes an SSE stream to monitor progress in real-time.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from pydantic import BaseModel
from agent import agent
from google.adk import Runner
from google.adk.events import Event
from google.adk.sessions import InMemorySessionService
from google.genai.types import Content, Part

session_service = InMemorySessionService()
runner = Runner(agent=agent, session_service=session_service, app_name="leads-generator-agent")

import uuid
from typing import Optional

class ChatRequest(BaseModel):
    message: str
    user_id: str = "default_user"
    session_id: Optional[str] = None

@app.post(
    "/chat",
    summary="Chat with the Marketing Agent",
    tags=["Chat"]
)
async def chat_with_agent(request: ChatRequest):
    """
    Interact with the marketing agent conversationally. 
    The agent will extract contexts like pincodes from the conversation and trigger lead generation automatically.
    """
    session_id = request.session_id or uuid.uuid4().hex
    
    # Ensure session exists (create if not, ignore if already exists)
    try:
        await session_service.create_session(
            session_id=session_id, 
            user_id=request.user_id, 
            app_name="leads-generator-agent"
        )
    except Exception:
        pass

    response_text = ""
    content = Content(role="user", parts=[Part(text=request.message)])
    
    async for event in runner.run_async(new_message=content, session_id=session_id, user_id=request.user_id):
        if hasattr(event, 'content') and event.content:
            if getattr(event.content, 'parts', None):
                for part in event.content.parts:
                    if hasattr(part, 'text') and part.text:
                        response_text += part.text
            elif isinstance(event.content, str):
                response_text += event.content
                
    return {"response": response_text.strip(), "session_id": session_id}

async def run_fetch_script(pincode: str):
    process = await asyncio.create_subprocess_exec(
        "python", "scripts/fetch_exhaustive_shops.py", pincode,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.STDOUT
    )

    while True:
        line = await process.stdout.readline()
        if not line:
            break
        yield f"data: {line.decode('utf-8').strip()}\n\n"

    await process.wait()
    yield f"data: Process completed with code {process.returncode}\n\n"

@app.get(
    "/stream_leads",
    summary="Stream Lead Generation Process",
    tags=["Leads"]
)
async def stream_leads(pincode: str):
    """
    Initiates the lead generation script for a specific pincode and streams the progress via Server-Sent Events (SSE).

    - **pincode**: The geographic pincode (e.g. 10001) to search for local businesses.

    Returns an event stream where each message represents a line of output from the backend scraping script.
    """
    return StreamingResponse(run_fetch_script(pincode), media_type="text/event-stream")

@app.get(
    "/leads",
    summary="Get All Leads",
    tags=["Leads"]
)
async def get_leads():
    """
    Returns all leads stored in the SQLite database, grouped by pincode.
    """
    import sqlite3
    try:
        conn = sqlite3.connect("leads.sqlite")
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM leads")
        rows = cursor.fetchall()
        conn.close()
        
        # Group by pincode
        grouped_leads = {}
        for row in rows:
            lead = dict(row)
            pincode = lead.get("pincode", "Unknown")
            if pincode not in grouped_leads:
                grouped_leads[pincode] = []
            grouped_leads[pincode].append(lead)
            
        return {"grouped_leads": grouped_leads, "total_leads": len(rows)}
    except sqlite3.OperationalError:
        return {"grouped_leads": {}, "total_leads": 0, "message": "Database not found or initialized yet."}
    except Exception as e:
        return {"error": str(e)}

@app.get(
    "/leads/{place_id}",
    summary="Get a Specific Lead",
    tags=["Leads"]
)
async def get_lead(place_id: str):
    """
    Returns the details of a specific lead by place_id.
    """
    import sqlite3
    from fastapi import HTTPException
    try:
        conn = sqlite3.connect("leads.sqlite")
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM leads WHERE place_id = ?", (place_id,))
        row = cursor.fetchone()
        conn.close()
        if row:
            return dict(row)
        else:
            raise HTTPException(status_code=404, detail="Lead not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class KeywordRequest(BaseModel):
    keyword: str

@app.get(
    "/keywords",
    summary="Get All Keywords",
    tags=["Keywords"]
)
async def get_keywords():
    """
    Returns all keywords stored in the SQLite database.
    """
    import sqlite3
    try:
        conn = sqlite3.connect("leads.sqlite")
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM keywords")
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]
    except sqlite3.OperationalError:
        return []
    except Exception as e:
        return {"error": str(e)}

@app.post(
    "/keywords",
    summary="Add a Keyword",
    tags=["Keywords"]
)
async def add_keyword(request: KeywordRequest):
    import sqlite3
    try:
        conn = sqlite3.connect("leads.sqlite")
        cursor = conn.cursor()
        cursor.execute("INSERT INTO keywords (keyword) VALUES (?)", (request.keyword,))
        conn.commit()
        keyword_id = cursor.lastrowid
        conn.close()
        return {"id": keyword_id, "keyword": request.keyword}
    except sqlite3.IntegrityError:
        return {"error": "Keyword already exists"}
    except Exception as e:
        return {"error": str(e)}

@app.delete(
    "/keywords/{keyword_id}",
    summary="Delete a Keyword",
    tags=["Keywords"]
)
async def delete_keyword(keyword_id: int):
    import sqlite3
    try:
        conn = sqlite3.connect("leads.sqlite")
        cursor = conn.cursor()
        cursor.execute("DELETE FROM keywords WHERE id = ?", (keyword_id,))
        conn.commit()
        conn.close()
        return {"status": "success"}
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
