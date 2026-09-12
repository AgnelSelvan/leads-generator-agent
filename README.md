# Pincode Leads Generator & WhatsApp Outreach

A Python-based open-source tool designed to generate local business leads based on geographic pincodes and automate personalized outreach via WhatsApp using OpenWA.

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

1. **Start the OpenWA Server:**
   Launch the WhatsApp client and scan the QR code to authenticate your session.
   ```bash
   node wa-server.js
   ```

2. **Run the Leads Generator:**
   Use the Python script to search for leads by pincode and initiate the outreach pipeline.
   ```bash
   python main.py --pincode 10001 --niche "Restaurants"
   ```

## ⚠️ Important Disclaimer and Legal Notice

- **WhatsApp Terms of Service**: Automated messaging can violate WhatsApp's Terms of Service. This tool should be used responsibly. Sending unsolicited bulk messages (spam) will likely result in your WhatsApp account being permanently banned. It is highly recommended to use the official WhatsApp Cloud API for business use cases.
- **Data Privacy**: Ensure that your scraping and outreach activities comply with local data protection and privacy regulations (such as GDPR, CCPA, or CAN-SPAM). Only reach out to businesses and individuals who have public-facing contact information intended for business inquiries.
- **Liability**: The creators of this software are not responsible for any account bans, legal disputes, or damages caused by the misuse of this tool.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.
