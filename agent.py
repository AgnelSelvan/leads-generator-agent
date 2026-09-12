import os
import sqlite3
from dotenv import load_dotenv
from google.adk.agents import Agent

load_dotenv()

# Database setup
def init_db():
    conn = sqlite3.connect("leads.sqlite")
    cursor = conn.cursor()
    # Do not drop table, just create if not exists
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS leads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pincode TEXT,
            place_id TEXT,
            company_name TEXT,
            address TEXT,
            website TEXT,
            mobile_no TEXT,
            email TEXT,
            country_code TEXT,
            latitude REAL,
            longitude REAL,
            rating REAL,
            category TEXT,
            about_the_company TEXT,
            customized_whatsapp_message TEXT,
            place_url TEXT,
            social_media TEXT,
            featured_image_url TEXT,
            reservation_url TEXT,
            number_of_reviews INTEGER,
            number_of_images INTEGER,
            price_level TEXT,
            opening_hours TEXT,
            service_options TEXT,
            highlights TEXT,
            accessibility TEXT,
            payment_types TEXT
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS keywords (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            keyword TEXT UNIQUE NOT NULL
        )
    """)
    conn.commit()
    conn.close()

def save_lead_to_db(lead_data: dict) -> str:
    """Saves a single lead to the SQLite database.

    Args:
        lead_data (dict): A dictionary containing lead information.
            Required keys: pincode, place_id, company_name, address, website, mobile_no, email,
            country_code, latitude, longitude, rating, category, about_the_company, customized_whatsapp_message
    """
    try:
        conn = sqlite3.connect("leads.sqlite")
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO leads (
                pincode, place_id, company_name, address, website,
                mobile_no, email, country_code, latitude,
                longitude, rating, category, about_the_company, customized_whatsapp_message,
                place_url, social_media, featured_image_url, reservation_url,
                number_of_reviews, number_of_images, price_level, opening_hours,
                service_options, highlights, accessibility, payment_types
            ) VALUES (
                :pincode, :place_id, :company_name, :address, :website,
                :mobile_no, :email, :country_code, :latitude,
                :longitude, :rating, :category, :about_the_company, :customized_whatsapp_message,
                :place_url, :social_media, :featured_image_url, :reservation_url,
                :number_of_reviews, :number_of_images, :price_level, :opening_hours,
                :service_options, :highlights, :accessibility, :payment_types
            )
        """, lead_data)

        conn.commit()
        conn.close()
        return f"Successfully saved lead {lead_data.get('company_name')} to database."
    except sqlite3.IntegrityError:
        return f"Lead with place_id {lead_data.get('place_id')} already exists."
    except Exception as e:
        return f"Error saving lead: {str(e)}"

async def leads_generator(pincode: str) -> str:
    """Fetches shops in the pincode location natively."""
    import sys
    import importlib.util
    import os
    try:
        from logger import adk_logger
        logger_instance = adk_logger
    except ImportError:
        import logging
        logger_instance = logging

    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        scripts_dir = os.path.join(current_dir, "scripts")
        script_path = os.path.join(scripts_dir, "fetch_exhaustive_shops.py")

        spec = importlib.util.spec_from_file_location("fetch_exhaustive_shops", script_path)
        fetch_module = importlib.util.module_from_spec(spec)
        sys.modules["fetch_exhaustive_shops"] = fetch_module
        spec.loader.exec_module(fetch_module)

        logger_instance.info(f"Running fetch_exhaustive_shops for pincode {pincode} natively...")
        fetch_module.main(pincode)
        return f"Successfully fetched shops for pincode {pincode} and stored them in SQLite database."
    except Exception as e:
        return f"Error executing shop fetching script natively: {str(e)}"

# Create the agent
agent = Agent(
    name="leads_generator_agent",
    model="gemini-2.5-flash",
    instruction="""You are a Lead Generation Agent.
Your goal is to fetch shop leads for a specific pincode (scraped from Google Maps) and ensure they are stored in the local SQLite database.
If the user asks questions that are out of context from lead generation, you must politely ignore them and steer the conversation back to finding leads.
Based on the normal chat conversation with the user, figure out the context and if they want to generate leads, extract the pincode from their messages. DO NOT directly ask "please provide a pincode" abruptly, act naturally as a conversational assistant.
Once you determine the pincode, use the `leads_generator` tool to fetch shops in that location.

# Lead Generation Agent Instructions

You are a specialized agent for lead generation. You help users find business leads and organize them in a SQLite Database.

## Capabilities

1. **Lead Generation**: Fetch exhaustive shop data for any pincode.
2. **Personalization**: Generate customized WhatsApp messages for each lead.
3. **Database Integration**: Upload results to SQLite.

## Operating Procedures

1. **Pincode Context Extraction**: Engage the user in a chat to understand their target area. Extract the 6-digit pincode seamlessly.
2. **Execution**: Fetch the shop leads by calling the `leads_generator` tool with the pincode. Internally, this executes the python scraper and populates the database.
3. **Review**: Summarize the success and inform the user that their leads have been stored in the database.
""",
    tools=[leads_generator, save_lead_to_db]
)

if __name__ == "__main__":
    init_db()
