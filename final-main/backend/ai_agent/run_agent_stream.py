#!/usr/bin/env python
"""
Streaming version of the agent runner.
Outputs JSONL (one JSON object per line) to stdout so the Node.js server
can parse and re-emit as SSE events in real-time.
"""
import sys
import os
import json
import argparse
import traceback
import io
import re
import threading
import time

# Load .env from this directory FIRST so CrewAI can find GROQ_API_KEY, MODEL, etc.
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env'))

# Add src to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

def emit(event_type, data):
    """Print a JSON line that Node.js will parse as an SSE event."""
    line = json.dumps({"event": event_type, **data}, ensure_ascii=False)
    # Use __stdout__ to bypass any redirection
    sys.__stdout__.write(line + "\n")
    sys.__stdout__.flush()

# Map agent names from CrewAI verbose output to our agent IDs
AGENT_MAP = {
    "expert travel planner": "itinerary_planner",
    "travel budget analyst": "budget_calculator",
    "local travel expert": "attractions_recommender",
    "travel advisor": "travel_tips_advisor",
    "weather risk analyst": "weather_safety_analyst",
}

AGENT_DISPLAY = {
    "itinerary_planner": {"name": "Itinerary Planner", "emoji": "🗺️"},
    "budget_calculator": {"name": "Budget Analyst", "emoji": "💰"},
    "attractions_recommender": {"name": "Attractions Expert", "emoji": "🎯"},
    "travel_tips_advisor": {"name": "Local Tips Advisor", "emoji": "💡"},
    "weather_safety_analyst": {"name": "Weather Safety", "emoji": "🌤️"},
}

AGENT_ORDER = [
    "itinerary_planner",
    "budget_calculator",
    "attractions_recommender",
    "travel_tips_advisor",
    "weather_safety_analyst",
]

def identify_agent(text):
    """Try to identify which agent is producing this output."""
    lower = text.lower()
    for keyword, agent_id in AGENT_MAP.items():
        if keyword in lower:
            return agent_id
    return None

class OutputInterceptor(io.TextIOBase):
    """Intercepts all writes to stdout/stderr and emits SSE events."""
    
    def __init__(self, original):
        self.original = original
        self.current_agent = None
        self.current_agent_idx = 0
        self.buffer = ""
        self.agents_started = set()
        self.agents_completed = set()
        self.last_emit_time = 0
        
    def write(self, text):
        if not text or text.strip() == "":
            return len(text) if text else 0
        
        self.buffer += text
        
        # Process complete lines
        while "\n" in self.buffer:
            line, self.buffer = self.buffer.split("\n", 1)
            self._process_line(line)
        
        return len(text)
    
    def _process_line(self, line):
        stripped = line.strip()
        if not stripped:
            return
        
        # Detect agent working patterns from CrewAI verbose output
        agent_id = identify_agent(stripped)
        
        # Check for "Agent:" prefix pattern
        if "# Agent:" in stripped or "## Agent:" in stripped:
            if agent_id:
                if agent_id not in self.agents_started:
                    self.agents_started.add(agent_id)
                    emit("agent_start", {
                        "agent": agent_id,
                        "name": AGENT_DISPLAY.get(agent_id, {}).get("name", agent_id),
                        "emoji": AGENT_DISPLAY.get(agent_id, {}).get("emoji", "🤖"),
                    })
                self.current_agent = agent_id
                
        # Check for task completion patterns
        if "## Final Answer" in stripped or "Final Answer:" in stripped:
            pass  # Final answer coming next
            
        # Detect output file creation (task completed)
        file_agent_map = {
            "itinerary.md": "itinerary_planner",
            "budget.md": "budget_calculator",
            "attractions.md": "attractions_recommender",
            "travel_tips.md": "travel_tips_advisor",
            "weather_safety.md": "weather_safety_analyst",
        }
        for filename, aid in file_agent_map.items():
            if filename in stripped and ("saved" in stripped.lower() or "output" in stripped.lower() or "file" in stripped.lower()):
                if aid not in self.agents_completed:
                    self.agents_completed.add(aid)
                    emit("agent_complete", {
                        "agent": aid,
                        "name": AGENT_DISPLAY.get(aid, {}).get("name", aid),
                    })
        
        # Emit thought events (throttled to avoid flooding)  
        now = time.time()
        if now - self.last_emit_time > 0.5:  # Max 2 events/second
            # Clean up the text for display
            clean = stripped
            # Remove ANSI color codes
            clean = re.sub(r'\x1b\[[0-9;]*m', '', clean)
            clean = re.sub(r'\[1m|\[0m|\[95m|\[92m|\[96m', '', clean)
            
            if len(clean) > 10 and not clean.startswith("---"):
                emit("agent_thought", {
                    "agent": self.current_agent or "system",
                    "thought": clean[:200],  # Limit length
                })
                self.last_emit_time = now
    
    def flush(self):
        pass
    
    def fileno(self):
        return self.original.fileno()


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

    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    emit("system", {"message": f"Initializing 5 AI agents for {args.destination}..."})
    emit("system", {"message": f"Trip: {args.days} days, ${args.budget} budget"})

    # Set up output interception
    interceptor = OutputInterceptor(sys.__stdout__)
    sys.stdout = interceptor
    sys.stderr = interceptor  # CrewAI prints a lot to stderr too

    try:
        from travel_agents.crew import TravelAgents
        
        # Emit that we're starting
        sys.__stdout__.write(json.dumps({"event": "agents_init", "agents": [
            {**AGENT_DISPLAY[aid], "id": aid} for aid in AGENT_ORDER
        ]}) + "\n")
        sys.__stdout__.flush()
        
        # Run the crew
        result = TravelAgents().crew().kickoff(inputs=inputs)
        
        # Restore stdout
        sys.stdout = sys.__stdout__
        sys.stderr = sys.__stderr__
        
        # Read generated files
        files = ['itinerary.md', 'budget.md', 'attractions.md', 'travel_tips.md', 'weather_safety.md']
        output = {}
        for f in files:
            if os.path.exists(f):
                with open(f, 'r', encoding='utf-8') as fh:
                    output[f.replace('.md', '')] = fh.read()
            else:
                output[f.replace('.md', '')] = "Content not generated."
        
        # Mark all agents as complete
        for aid in AGENT_ORDER:
            if aid not in interceptor.agents_completed:
                emit("agent_complete", {
                    "agent": aid,
                    "name": AGENT_DISPLAY.get(aid, {}).get("name", aid),
                })
        
        emit("complete", {"success": True, "data": output})
        
    except Exception as e:
        sys.stdout = sys.__stdout__
        sys.stderr = sys.__stderr__
        emit("error", {"error": str(e), "trace": traceback.format_exc()})

if __name__ == "__main__":
    main()
