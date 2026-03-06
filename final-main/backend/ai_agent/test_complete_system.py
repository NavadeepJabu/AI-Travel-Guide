#!/usr/bin/env python
"""
Test script for the complete AI Travel Planner system
Tests both Itinerary Planner Agent and Budget Calculator Agent
"""
import sys
import os

# Add src to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from travel_agents.crew import TravelAgents

def test_travel_planner(destination, number_of_days, user_budget):
    """Test the complete travel planning system"""
    print(f"\n🌍 Testing Complete Travel Planner System")
    print(f"📍 Destination: {destination}")
    print(f"📅 Duration: {number_of_days} days")
    print(f"💰 Budget: ${user_budget}")
    print("=" * 60)
    
    inputs = {
        'destination': destination,
        'number_of_days': number_of_days,
        'user_budget': user_budget
    }
    
    try:
        result = TravelAgents().crew().kickoff(inputs=inputs)
        print(f"\n✅ Travel plan generated successfully!")
        print(f"📄 Itinerary saved to: itinerary.md")
        print(f"💳 Budget breakdown saved to: budget.md")
        return result
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def display_summary(destination, number_of_days, user_budget):
    """Display a summary of what the system generates"""
    print(f"\n📋 System Output Summary for {destination}:")
    print("├── 🗓️  Detailed Day-by-Day Itinerary")
    print("│   ├── Morning activities")
    print("│   ├── Afternoon activities")
    print("│   └── Evening activities")
    print("├── 💰 Comprehensive Budget Breakdown")
    print("│   ├── Accommodation costs")
    print("│   ├── Food expenses")
    print("│   ├── Transportation costs")
    print("│   ├── Attraction entry fees")
    print("│   └── Miscellaneous expenses")
    print("└── ✅ Budget Analysis (Within/Over Budget)")

if __name__ == "__main__":
    # Test cases with different budgets
    test_cases = [
        ("Paris, France", "3", "2000"),
        ("Tokyo, Japan", "4", "3000"),
        ("Rome, Italy", "2", "1500")
    ]
    
    for destination, days, budget in test_cases:
        display_summary(destination, days, budget)
        test_travel_planner(destination, days, budget)
        print("\n" + "="*80 + "\n")
        
        # Ask user if they want to continue
        if len(test_cases) > 1:
            try:
                continue_test = input("Press Enter to continue to next test case, or 'q' to quit: ")
                if continue_test.lower() == 'q':
                    break
            except KeyboardInterrupt:
                break
    
    print("\n🎉 All tests completed! Check the generated files:")
    print("📄 itinerary.md - Detailed travel itineraries")
    print("💳 budget.md - Comprehensive budget breakdowns")
