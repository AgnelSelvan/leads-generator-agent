# 🚀 AI Leads Generator

An open-source, AI-powered lead generation dashboard built with **FastAPI**, **Google ADK (Gemini)**, and **Next.js**.

This platform allows you to conversationally ask an AI agent to find business leads (e.g., "Find software agencies in 10001"). The agent understands your query, triggers a backend search, saves the leads to a local SQLite database, and plots them beautifully on an interactive map.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green.svg)

---

## ✨ Features

- **🤖 Conversational AI Agent**: Built with Google ADK (Agent Development Kit). Just chat with the agent to request leads!
- **📍 Interactive Maps**: Visualizes all discovered leads on an OpenStreetMap using Leaflet and React-Leaflet.
- **🎨 Modern UI/UX**: An elegant, Gen Z / Airbnb-inspired design system built entirely with **Tailwind CSS v4**. Features smooth animations, pill-shaped UI components, and high-contrast typography.
- **💾 Local Database**: Persists chat history, target keywords, and fetched leads into a local SQLite database (`leads.sqlite`).
- **⚡ Real-time Streaming**: Uses Server-Sent Events (SSE) to stream data from the backend to the frontend seamlessly.

## 🛠️ Tech Stack

**Frontend:**
- [Next.js](https://nextjs.org/) (App Router)
- React 19
- Tailwind CSS v4
- React-Leaflet (OpenStreetMap)

**Backend:**
- [FastAPI](https://fastapi.tiangolo.com/)
- Python 3.10+
- Google ADK (Agent Development Kit) & Gemini API
- SQLite

---

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine.

### 1. Clone the repository

```bash
git clone https://github.com/AgnelSelvan/leads-generator-agent.git
cd leads-generator
```

### 2. Backend Setup (FastAPI & Agent)

Create a virtual environment and install the dependencies:

```bash
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

Set up your environment variables:
1. Copy `.env.example` to a new file named `.env`
2. Open `.env` and add your API Keys:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   ```
   *(You can get a Gemini key from [Google AI Studio](https://aistudio.google.com/) and a Maps key from [Google Cloud Console](https://console.cloud.google.com/))*

Run the backend server:

```bash
python api.py
```
*The API will start running at `http://localhost:8000`*

### 3. Frontend Setup (Next.js)

Open a new terminal window and navigate to the `web` directory:

```bash
cd web
npm install
```

Start the Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the dashboard!

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
Feel free to check [issues page](https://github.com/AgnelSelvan/leads-generator-agent/issues).

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## ⚠️ Important Legal Disclaimer

**This project is provided for educational and research purposes only.**

**Scraping Google Maps violates Google's Terms of Service.**
The creators and contributors of this repository assume **no liability** for how you use this code.

If you plan to use this project in a production or commercial environment, you **must** replace the scraping script with a legitimate, ToS-compliant data source such as the [official Google Places API](https://developers.google.com/maps/documentation/places/web-service/overview), Yelp API, Apollo, or OpenStreetMap.
