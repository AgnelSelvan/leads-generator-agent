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
    description="API for the Leads Generator. This API provides an endpoint to fetch leads from Google Maps based on pincode and stores them in a SQLite database. Includes an SSE stream to monitor progress in real-time.",
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
from agent import agent, init_db
from google.adk import Runner

# Initialize the database
init_db()
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
    import sqlite3
    session_id = request.session_id or uuid.uuid4().hex

    # Store user message
    conn = sqlite3.connect("leads.sqlite")
    cursor = conn.cursor()
    cursor.execute("INSERT OR IGNORE INTO sessions (session_id, title) VALUES (?, ?)", (session_id, request.message[:30] + "..."))
    cursor.execute("INSERT INTO chats (session_id, role, content) VALUES (?, ?, ?)", (session_id, "user", request.message))
    conn.commit()

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

    # Store assistant response
    cursor.execute("INSERT INTO chats (session_id, role, content) VALUES (?, ?, ?)", (session_id, "assistant", response_text.strip()))
    conn.commit()
    conn.close()

    return {"response": response_text.strip(), "session_id": session_id}

@app.get("/sessions", summary="Get all chat sessions", tags=["Chat"])
async def get_sessions():
    import sqlite3
    try:
        conn = sqlite3.connect("leads.sqlite")
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM sessions ORDER BY timestamp DESC")
        rows = cursor.fetchall()
        conn.close()
        return [dict(r) for r in rows]
    except Exception as e:
        return []

@app.get("/chat/{session_id}", summary="Get chat history", tags=["Chat"])
async def get_chat_history(session_id: str):
    import sqlite3
    try:
        conn = sqlite3.connect("leads.sqlite")
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT role, content FROM chats WHERE session_id = ? ORDER BY id ASC", (session_id,))
        rows = cursor.fetchall()
        conn.close()
        return [dict(r) for r in rows]
    except Exception as e:
        return []

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

class UpdateStatusRequest(BaseModel):
    message_status: str

@app.put(
    "/leads/{place_id}/status",
    summary="Update Lead Message Status",
    tags=["Leads"]
)
async def update_lead_status(place_id: str, request: UpdateStatusRequest):
    import sqlite3
    from fastapi import HTTPException
    try:
        conn = sqlite3.connect("leads.sqlite")
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE leads SET message_status = ? WHERE place_id = ?",
            (request.message_status, place_id)
        )
        if cursor.rowcount == 0:
            conn.close()
            raise HTTPException(status_code=404, detail="Lead not found")
        conn.commit()
        conn.close()
        return {"status": "success", "message_status": request.message_status}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post(
    "/leads/{place_id}/generate_message",
    summary="Generate Personalized Message",
    tags=["Leads"]
)
async def generate_personalized_message(place_id: str):
    import sqlite3
    from fastapi import HTTPException
    try:
        conn = sqlite3.connect("leads.sqlite")
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Get lead
        cursor.execute("SELECT * FROM leads WHERE place_id = ?", (place_id,))
        lead = cursor.fetchone()
        if not lead:
            conn.close()
            raise HTTPException(status_code=404, detail="Lead not found")
            
        # Get company context
        cursor.execute("SELECT value FROM settings WHERE key = 'company_context'")
        context_row = cursor.fetchone()
        company_context = context_row["value"] if context_row else ""
        
        prompt = f"""
        You are an expert GenZ marketer. Write a highly personalized, humanized WhatsApp outreach message with a GenZ vibe for the following lead.
        Rules:
        1. Keep the message VERY short and crisp, strictly exactly 2 lines maximum.
        2. Make it sound casual, friendly, modern, and engaging. Avoid overly corporate jargon. Use relevant emojis but don't overdo it.
        3. Draft only the message content. No pleasantries or explanations before or after the message.
        4. If the 'Our Company Context' below contains a website URL, you MUST append that exact website URL at the very bottom of the message on a new line.

        Our Company Context (What we do/offer):
        {company_context}

        Target Lead Information:
        Company Name: {lead['company_name']}
        Category: {lead['category']}
        About: {lead['about_the_company']}
        Highlights: {lead['highlights']}
        """
        
        from google.genai import Client
        client = Client()
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt
        )
        
        generated_message = response.text.strip()
        
        # Save to DB
        cursor.execute(
            "UPDATE leads SET customized_whatsapp_message = ? WHERE place_id = ?",
            (generated_message, place_id)
        )
        conn.commit()
        conn.close()
        
        return {"status": "success", "message": generated_message}
    except Exception as e:
        import traceback
        traceback.print_exc()
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

class SettingRequest(BaseModel):
    value: str

@app.get(
    "/settings/{key}",
    summary="Get a Setting",
    tags=["Settings"]
)
async def get_setting(key: str):
    import sqlite3
    try:
        conn = sqlite3.connect("leads.sqlite")
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT value FROM settings WHERE key = ?", (key,))
        row = cursor.fetchone()
        conn.close()
        if row:
            return {"key": key, "value": row["value"]}
        return {"key": key, "value": ""}
    except Exception as e:
        return {"error": str(e)}

@app.post(
    "/settings/{key}",
    summary="Update a Setting",
    tags=["Settings"]
)
async def update_setting(key: str, request: SettingRequest):
    import sqlite3
    try:
        conn = sqlite3.connect("leads.sqlite")
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
            (key, request.value)
        )
        conn.commit()
        conn.close()
        return {"status": "success", "key": key, "value": request.value}
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
