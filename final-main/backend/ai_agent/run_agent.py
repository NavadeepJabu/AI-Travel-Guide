import sys
import os
import json
import argparse
import traceback

# Load .env from this directory FIRST so CrewAI can find GROQ_API_KEY, MODEL, etc.
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env'))

# Add src to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--destination', required=True)
    parser.add_argument('--days', required=True)
    parser.add_argument('--budget', required=True)
    args = parser.parse_args()

    inputs = {
        'destination': args.destination,
        'number_of_days': args.days,
        'user_budget': args.budget
    }

    try:
        from travel_agents.crew import TravelAgents
        # Set cwd to this directory so that files are generated here or can be read from here
        os.chdir(os.path.dirname(os.path.abspath(__file__)))
        
        # Disable logging to stdout to keep JSON clean if possible
        import io
        from contextlib import redirect_stdout
        
        f = io.StringIO()
        with redirect_stdout(f):
            result = TravelAgents().crew().kickoff(inputs=inputs)
            
        # Read the generated markdown files
        files = ['itinerary.md', 'budget.md', 'attractions.md', 'travel_tips.md', 'weather_safety.md']
        output = {}
        for file in files:
            if os.path.exists(file):
                with open(file, 'r', encoding='utf-8') as f_read:
                    output[file.replace('.md', '')] = f_read.read()
            else:
                output[file.replace('.md', '')] = "File not generated."
                
        # Print valid JSON to stdout strictly
        # We write to sys.__stdout__ to avoid redirect_stdout context if needed, but we are outside it here.
        print(json.dumps({"success": True, "data": output}))
        
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e), "trace": traceback.format_exc()}))

if __name__ == "__main__":
    main()
