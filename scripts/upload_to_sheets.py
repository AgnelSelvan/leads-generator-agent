import os
import sys

# Add parent directory to sys.path to allow importing from the root (e.g. config)
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(script_dir)
if project_root not in sys.path:
    sys.path.insert(0, project_root)

import gspread
import pandas as pd
from mcp.server.fastmcp import FastMCP
from config import settings

# Initialize FastMCP Server
mcp = FastMCP("Google Sheets Uploader")

@mcp.tool()
def upload_xlsx_to_sheets(pincode: str) -> str:
    """
    Reads the {pincode}.xlsx file and uploads it to a specific Google Sheet.
    Creates a new worksheet named Pincode_{pincode}.
    """
    filepath = f"{pincode}.xlsx"
    worksheet_name = f"Pincode_{pincode}"

    # 1. Verify file extension and read data locally using Pandas
    if not os.path.exists(filepath):
        nested_xlsx = os.path.join("marketting", filepath)
        if os.path.exists(nested_xlsx):
            filepath = nested_xlsx
        else:
            return f"Error: {filepath} not found."

    file_ext = os.path.splitext(filepath)[-1].lower()

    try:
        if file_ext == '.csv':
            df = pd.read_csv(filepath)
        elif file_ext in ['.xlsx', '.xls']:
            df = pd.read_excel(filepath)
        else:
            return "Unsupported file format. Please use a CSV or Excel file."
    except Exception as e:
        return f"Error reading file {filepath}: {str(e)}"

    # 2. Authenticate using the Service Account JSON credentials
    # Look for 'config/credentials.json' relative to the project root
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    credentials_path = os.path.join(project_root, "configs", "credentials.json")

    try:
        gc = gspread.service_account(filename=credentials_path)
    except Exception as e:
        return f"Authentication error (make sure {credentials_path} exists): {str(e)}"

    # 3. Open the Spreadsheet using its unique ID
    spreadsheet_id = settings.google_spread_sheet_id
    try:
        spreadsheet = gc.open_by_key(spreadsheet_id)
    except Exception as e:
        return f"Error opening spreadsheet {spreadsheet_id}: {str(e)}"

    try:
        # Get the targeted worksheet if it exists
        worksheet = spreadsheet.worksheet(worksheet_name)
    except gspread.exceptions.WorksheetNotFound:
        # Create it if it does not exist
        worksheet = spreadsheet.add_worksheet(title=worksheet_name, rows=str(len(df) + 10), cols="20")

    # 4. Clean out old data before injecting new rows
    worksheet.clear()

    # 5. Format data (Convert dataframe to list of lists, including header)
    # Replaces NaN/Null values with empty strings so JSON serialization doesn't fail
    df_clean = df.fillna("")
    data_to_upload = [df_clean.columns.values.tolist()] + df_clean.values.tolist()

    # 6. Push data to Sheet starting at top-left cell A1
    try:
        worksheet.update(range_name='A1', values=data_to_upload)
    except TypeError:
        # Fallback for older gspread versions
        worksheet.update('A1', data_to_upload)

    return f"Successfully uploaded {len(df)} rows to worksheet '{worksheet_name}' inside spreadsheet '{spreadsheet_id}'!"

if __name__ == "__main__":
    if len(sys.argv) > 1:
        # Standalone mode
        test_pincode = sys.argv[1]
        # Note: We must await or run it if it was async, but here the tool is synchronous
        result = upload_xlsx_to_sheets(test_pincode)
        print(result)
    else:
        # MCP Server mode (used by ADK)
        mcp.run()
