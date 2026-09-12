# Leads Generator Agent

A conversational ADK-powered AI agent and full-stack web dashboard designed to discover local business leads based on geographic pincodes and organize them for personalized outreach.

## 🚀 Features

- **Conversational AI Agent**: Chat with the Google ADK agent to dynamically extract target contexts and trigger lead generation naturally.
- **Next.js Web Dashboard**: A modern, responsive React interface to chat with the agent and view all your generated leads visually grouped by pincode.
- **Pincode-Based Discovery**: Scrapes and gathers exhaustive local business information, formatting phone numbers and emails automatically via Google Maps.
- **Personalized Message Generation**: Dynamically crafts tailored WhatsApp outreach messages based on the lead's business category and profile.
- **SQLite Persistence**: Organizes all leads robustly in a local `leads.sqlite` database.

## 📋 Prerequisites

To run this project, you will need:
- **Python 3.8+** (for the FastAPI backend, ADK agent, and lead generation script)
- **Node.js** (for running the Next.js web dashboard frontend)
- A **Google Maps API Key** (for data fetching)
- A **Gemini API Key** (for the ADK Agent reasoning)

## 🛠️ Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Smart-Bill-Book/leads-generator-agent.git
   cd leads-generator-agent
   ```

2. **Set up the Environment Variables:**
   Rename `.env.example` to `.env` and fill in your API keys:
   ```env
   GOOGLE_MAPS_API_KEY="your_maps_key_here"
   GEMINI_API_KEY="your_gemini_key_here"
   ```

3. **Set up the Python Backend:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use: .\venv\Scripts\activate
   pip install -r requirements.txt
   ```

4. **Set up the Next.js Frontend:**
   ```bash
   cd web
   npm install
   cd ..
   ```

## 💻 Usage

The easiest way to run the full stack (both the Python backend and Next.js frontend) is using the provided launch scripts.

**On Windows:**
Simply double-click `start.bat` or run:
```powershell
.\start.bat
```

**On Linux / macOS:**
```bash
chmod +x start.sh
./start.sh
```

This will spin up both the FastAPI backend on port `8000` and the Next.js Dashboard on port `3000`. You can access the UI by opening `http://localhost:3000` in your web browser.

### Advanced CLI Usage (Backend Only)
If you only want to use the backend tools without the UI:

- **Run the Fetcher directly:**
  ```bash
  python main.py fetch 10001
  ```
- **Start the API Server manually:**
  ```bash
  python main.py serve
  ```

## ⚠️ Important Disclaimer and Legal Notice

- **WhatsApp Terms of Service**: If you plan to automate the personalized messages via OpenWA or other libraries, note that automated messaging can violate WhatsApp's Terms of Service. Sending unsolicited bulk messages will likely result in account bans. It is highly recommended to use the official WhatsApp Cloud API for business use cases.
- **Data Privacy**: Ensure that your scraping and outreach activities comply with local data protection and privacy regulations. Only reach out to businesses who have public-facing contact information intended for business inquiries.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.
