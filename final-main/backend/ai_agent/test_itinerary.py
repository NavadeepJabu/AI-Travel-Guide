#!/usr/bin/env python
"""
Test script for the Itinerary Planner Agent
"""
import sys
import os

# Add src to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from travel_agents.crew import TravelAgents

def test_itinerary_planner(destination, number_of_days):
    """Test the itinerary planner with different inputs"""
    print(f"\n🌍 Testing Itinerary Planner for: {destination} ({number_of_days} days)")
    print("=" * 60)
    
    inputs = {
        'destination': destination,
        'number_of_days': number_of_days
    }
    
    try:
        result = TravelAgents().crew().kickoff(inputs=inputs)
        print(f"\n✅ Itinerary generated successfully for {destination}!")
        return result
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

if __name__ == "__main__":
    # Test cases
    test_cases = [
        ("Tokyo, Japan", "2"),
        ("Rome, Italy", "4"),
        ("New York City, USA", "3")
    ]
    
    for destination, days in test_cases:
        test_itinerary_planner(destination, days)
        print("\n" + "="*80 + "\n")
