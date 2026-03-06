#!/usr/bin/env python
"""
Test script for just the Travel Tips Agent
"""
import sys
import os

# Add src to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

def test_travel_tips_only():
    """Test just the travel tips agent"""
    print("🌍 Testing Travel Tips Agent Only")
    print("=" * 50)
    
    try:
        from travel_agents.crew import TravelAgents
        
        # Create inputs for just travel tips
        inputs = {
            'destination': 'Paris, France'
        }
        
        # We'll create a simplified version to test just the travel tips
        from crewai import Agent, Task, Crew
        
        # Load the config directly
        import yaml
        with open('src/travel_agents/config/agents.yaml', 'r') as f:
            agents_config = yaml.safe_load(f)
        with open('src/travel_agents/config/tasks.yaml', 'r') as f:
            tasks_config = yaml.safe_load(f)
        
        # Create just the travel tips agent
        travel_tips_agent = Agent(
            config=agents_config['travel_tips_advisor'],
            verbose=True
        )
        
        # Create just the travel tips task
        travel_tips_task = Task(
            config=tasks_config['travel_tips_task'],
            agent=travel_tips_agent,
            output_file='travel_tips.md'
        )
        
        # Create a minimal crew
        crew = Crew(
            agents=[travel_tips_agent],
            tasks=[travel_tips_task],
            verbose=True
        )
        
        result = crew.kickoff(inputs=inputs)
        print("✅ Travel tips generated successfully!")
        return result
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

if __name__ == "__main__":
    test_travel_tips_only()
