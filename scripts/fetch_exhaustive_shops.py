import requests
import os
import time
import sys
from typing import List, Dict
from dotenv import load_dotenv

# Add parent directory to path to import agent
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from agent import init_db, save_lead_to_db

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

# CONFIGURATION
API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")

# Field Mask for Places API (New)
FIELD_MASK = (
    "places.id,"
    "places.displayName,"
    "places.formattedAddress,"
    "places.websiteUri,"
    "places.internationalPhoneNumber,"
    "places.nationalPhoneNumber,"
    "places.location,"
    "places.rating,"
    "places.primaryType,"
    "places.types,"
    "places.editorialSummary,"
    "places.googleMapsUri,"
    "places.userRatingCount,"
    "places.photos,"
    "places.reservable,"
    "places.priceLevel,"
    "places.regularOpeningHours,"
    "places.paymentOptions,"
    "places.accessibilityOptions"
)

def get_keywords_from_db() -> List[str]:
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'leads.sqlite')
    try:
        import sqlite3
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT keyword FROM keywords")
        rows = cursor.fetchall()
        conn.close()
        keywords = [row[0] for row in rows]
        if not keywords:
            return ["shops", "stores"] # fallback
        return keywords
    except Exception as e:
        print(f"Error fetching keywords: {e}")
        return ["shops", "stores"] # fallback

KEYWORDS = get_keywords_from_db()

def fetch_places(query: str, api_key: str) -> List[Dict]:
    url = "https://places.googleapis.com/v1/places:searchText"
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": FIELD_MASK
    }

    all_places = []
    page_token = None

    while True:
        payload = {"textQuery": query}
        if page_token:
            payload["pageToken"] = page_token

        response = requests.post(url, json=payload, headers=headers)
        if response.status_code != 200:
            print(f"Error for query '{query}': {response.status_code}")
            break

        data = response.json()
        places = data.get("places", [])
        all_places.extend(places)

        page_token = data.get("nextPageToken")
        if not page_token:
            break
        time.sleep(1.5) # Respect rate limits and allow token to propagate

    return all_places

def main(pincode: str = "627117"):
    PINCODE = pincode
    OUTPUT_FILE = f"{PINCODE}.xlsx"
    unique_places = {}

    print(f"Starting exhaustive search for Pincode {PINCODE}...")

    for i, keyword in enumerate(KEYWORDS):
        query = f"{keyword} in {PINCODE}"
        print(f"[{i+1}/{len(KEYWORDS)}] Searching for: {query}")
        places = fetch_places(query, API_KEY)

        new_count = 0
        for place in places:
            place_id = place.get("id")
            if place_id and place_id not in unique_places:
                unique_places[place_id] = place
                new_count += 1

        print(f"  Found {len(places)} results, {new_count} were new. Total unique: {len(unique_places)}")

    if not unique_places:
        print("No places found.")
        return

    # Process data
    init_db()
    for place_id, place in unique_places.items():
        name = place.get("displayName", {}).get("text", "N/A")
        address = place.get("formattedAddress", "N/A")
        website = place.get("websiteUri", "N/A")

        # Phone numbers
        national_phone = place.get("nationalPhoneNumber", "")
        international_phone = place.get("internationalPhoneNumber", "")

        # Extract country code from international phone
        country_code = "+91" # Default for India
        if international_phone and international_phone.startswith("+"):
            parts = international_phone.split(" ")
            if parts:
                country_code = parts[0]

        # Combine mobile numbers with country code followed by comma
        mobile_nos = []
        if international_phone:
            mobile_nos.append(international_phone)
        elif national_phone:
            mobile_nos.append(f"{country_code} {national_phone}")

        mobile_no = ", ".join(mobile_nos)

        # Emails
        raw_emails = place.get("email", place.get("emails", []))
        if isinstance(raw_emails, str):
            email = raw_emails
        elif isinstance(raw_emails, list):
            email = ", ".join(raw_emails)
        else:
            email = "N/A"
        if not email:
            email = "N/A"

        location = place.get("location", {})
        lat = location.get("latitude", "N/A")
        lng = location.get("longitude", "N/A")
        rating = place.get("rating", "N/A")

        # Category
        primary_type = place.get("primaryType", "N/A")
        types = place.get("types", [])
        category = primary_type if primary_type != "N/A" else (types[0] if types else "N/A")

        # About / Description
        about = place.get("editorialSummary", {}).get("text", "")
        if not about:
            # Generate a simple description
            clean_category = category.replace("_", " ").title()
            about = f"{name} is a {clean_category} located in the area with pincode {PINCODE}, providing quality services and products to the local community."

        # Additional Fields for the new Schema
        place_url = place.get("googleMapsUri", "N/A")
        social_media = "N/A" # Not provided natively by this API endpoint

        photos = place.get("photos", [])
        featured_image_url = photos[0].get("name", "N/A") if photos else "N/A"

        reservation_url = str(place.get("reservable", "N/A"))
        number_of_reviews = place.get("userRatingCount", 0)
        number_of_images = len(photos)

        price_level = place.get("priceLevel", "N/A")

        import json

        opening_hours_dict = place.get("regularOpeningHours", {})
        opening_hours = json.dumps(opening_hours_dict.get("weekdayDescriptions", [])) if opening_hours_dict else "[]"

        payment_options = place.get("paymentOptions", {})
        payment_types = json.dumps(payment_options) if payment_options else "{}"

        accessibility_options = place.get("accessibilityOptions", {})
        accessibility = json.dumps(accessibility_options) if accessibility_options else "{}"

        service_options = "N/A" # Kept generic as features aren't always present
        highlights = about # We already extracted editorial summary for about

        lead_data = {
            "pincode": PINCODE,
            "place_id": place_id,
            "company_name": name,
            "address": address,
            "website": website,
            "mobile_no": mobile_no,
            "email": email,
            "country_code": country_code,
            "latitude": lat if lat != "N/A" else 0.0,
            "longitude": lng if lng != "N/A" else 0.0,
            "rating": rating if rating != "N/A" else 0.0,
            "category": category,
            "about_the_company": about,
            "place_url": place_url,
            "social_media": social_media,
            "featured_image_url": featured_image_url,
            "reservation_url": reservation_url,
            "number_of_reviews": number_of_reviews,
            "number_of_images": number_of_images,
            "price_level": price_level,
            "opening_hours": opening_hours,
            "service_options": service_options,
            "highlights": highlights,
            "accessibility": accessibility,
            "payment_types": payment_types
        }
        result = save_lead_to_db(lead_data)
        print(result)

if __name__ == "__main__":
    pincode_arg = sys.argv[1] if len(sys.argv) > 1 else "627117"
    main(pincode_arg)
