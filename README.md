# Leads Generator Agent

A Python-based open-source ADK agent designed to generate local business leads based on geographic pincodes and automate personalized outreach.

## 🚀 Features

- **Pincode-Based Discovery**: Scrape and gather public business information and contact details from the internet using localized pincodes.
- **Personalized Message Generation**: Dynamically generate tailored outreach messages based on the lead's profile, business name, and industry.
- **OpenWA Integration**: Automate the delivery of personalized direct messages (DMs) to leads on WhatsApp using the OpenWA library.
- **Export & Manage**: Save generated leads to CSV/JSON formats for CRM integration.

## 📋 Prerequisites

To run this project, you will need:
- **Python 3.8+** (for the lead generation and message generation logic)
- **Node.js** (required to run the OpenWA backend)
- **Chrome/Chromium** browser (for web scraping and OpenWA session handling)
- An active WhatsApp account (to scan the OpenWA QR code)

## 🛠️ Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/leads-generator.git
   cd leads-generator
   ```

2. **Set up the Python Virtual Environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use: .\venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Set up OpenWA:**
   Navigate to the OpenWA directory (if separated) and install the Node.js dependencies:
   ```bash
   npm install @open-wa/wa-automate
   ```

## 💻 Usage

The project features a single entry point `main.py` for simplicity.

1. **Run the Fetcher directly (CLI):**
   You can fetch leads for a specific pincode directly via the command line. This will store the leads directly into `leads.sqlite`.
   ```bash
   python main.py fetch 10001
   ```

2. **Start the API Server (SSE):**
   Run the FastAPI server which exposes an SSE endpoint `/stream_leads?pincode={pincode}`.
   ```bash
   python main.py serve
   ```
   *(Optional)* You can define host and port: `python main.py serve --host 127.0.0.1 --port 8000`

## ⚠️ Important Disclaimer and Legal Notice

- **WhatsApp Terms of Service**: Automated messaging can violate WhatsApp's Terms of Service. This tool should be used responsibly. Sending unsolicited bulk messages (spam) will likely result in your WhatsApp account being permanently banned. It is highly recommended to use the official WhatsApp Cloud API for business use cases.
- **Data Privacy**: Ensure that your scraping and outreach activities comply with local data protection and privacy regulations (such as GDPR, CCPA, or CAN-SPAM). Only reach out to businesses and individuals who have public-facing contact information intended for business inquiries.
- **Liability**: The creators of this software are not responsible for any account bans, legal disputes, or damages caused by the misuse of this tool.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.
