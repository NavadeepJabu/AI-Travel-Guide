#!/usr/bin/env python
"""
Runs a SINGLE agent from the travel crew and outputs its result as JSON.
Usage: python run_single_agent.py --agent itinerary_planner --destination "Paris" --days 3 --budget 2000
"""
import sys
import os
import json
import argparse
import traceback

# Load .env from this directory FIRST so CrewAI can find GROQ_API_KEY, MODEL, etc.
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env'))

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

AGENT_FILE_MAP = {
    'itinerary_planner': 'itinerary.md',
    'budget_calculator': 'budget.md',
    'attractions_recommender': 'attractions.md',
    'travel_tips_advisor': 'travel_tips.md',
    'weather_safety_analyst': 'weather_safety.md',
}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--agent', required=True, choices=list(AGENT_FILE_MAP.keys()))
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

    try:
        from crewai import Agent, Crew, Process, Task
        from travel_agents.crew import TravelAgents

        import io
        from contextlib import redirect_stdout, redirect_stderr

        crew_instance = TravelAgents()

        # Get the specific agent and task methods
        agent_method = getattr(crew_instance, args.agent)
        task_method_map = {
            'itinerary_planner': 'itinerary_planning_task',
            'budget_calculator': 'budget_calculation_task',
            'attractions_recommender': 'attractions_recommendation_task',
            'travel_tips_advisor': 'travel_tips_task',
            'weather_safety_analyst': 'weather_safety_task',
        }
        task_method = getattr(crew_instance, task_method_map[args.agent])

        the_agent = agent_method()
        the_task = task_method()

        # Build a mini crew with just this one agent and task
        mini_crew = Crew(
            agents=[the_agent],
            tasks=[the_task],
            process=Process.sequential,
            verbose=True,
        )

        # Suppress verbose output to keep JSON clean
        f = io.StringIO()
        with redirect_stdout(f), redirect_stderr(f):
            result = mini_crew.kickoff(inputs=inputs)

        # Read the output file
        output_file = AGENT_FILE_MAP[args.agent]
        content = ""
        if os.path.exists(output_file):
            with open(output_file, 'r', encoding='utf-8') as fh:
                content = fh.read()
        else:
            # Fallback to the crew result
            content = str(result)

        print(json.dumps({"success": True, "agent": args.agent, "content": content}))

    except Exception as e:
        print(json.dumps({"success": False, "error": str(e), "trace": traceback.format_exc()}))

if __name__ == "__main__":
    main()
