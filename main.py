import argparse
import sys
import uvicorn
from scripts.fetch_exhaustive_shops import main as fetch_shops

def main():
    parser = argparse.ArgumentParser(description="Smart Bill Book Leads Generator")
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Command: serve
    serve_parser = subparsers.add_parser("serve", help="Start the FastAPI SSE server")
    serve_parser.add_argument("--host", default="0.0.0.0", help="Host address")
    serve_parser.add_argument("--port", type=int, default=8000, help="Port number")

    # Command: fetch
    fetch_parser = subparsers.add_parser("fetch", help="Fetch leads for a specific pincode")
    fetch_parser.add_argument("pincode", type=str, help="The pincode to search for leads")

    args = parser.parse_args()

    if args.command == "serve":
        print(f"Starting server on {args.host}:{args.port}...")
        uvicorn.run("api:app", host=args.host, port=args.port, reload=True)
    elif args.command == "fetch":
        print(f"Fetching leads for pincode: {args.pincode}...")
        fetch_shops(args.pincode)
    else:
        parser.print_help()
        sys.exit(1)

if __name__ == "__main__":
    main()
