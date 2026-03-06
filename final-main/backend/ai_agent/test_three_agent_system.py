#!/usr/bin/env python
"""
Test script for the complete three-agent AI Travel Planner system
Tests Itinerary Planner, Budget Calculator, and Attractions Recommendation Agents
"""
import sys
import os

# Add src to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from travel_agents.crew import TravelAgents

def test_three_agent_system(destination, number_of_days, user_budget):
    """Test the complete three-agent travel planning system"""
    print(f"\n🌍 Testing Three-Agent Travel Planner System")
    print(f"📍 Destination: {destination}")
    print(f"📅 Duration: {number_of_days} days")
    print(f"💰 Budget: ${user_budget}")
    print("=" * 70)
    
    inputs = {
        'destination': destination,
        'number_of_days': number_of_days,
        'user_budget': user_budget
    }
    
    try:
        result = TravelAgents().crew().kickoff(inputs=inputs)
        print(f"\n✅ Complete travel plan generated successfully!")
        print(f"📄 Itinerary saved to: itinerary.md")
        print(f"💳 Budget breakdown saved to: budget.md")
        print(f"🎯 Attractions guide saved to: attractions.md")
        return result
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def display_system_capabilities():
    """Display what the three-agent system generates"""
    print(f"\n📋 Three-Agent System Capabilities:")
    print("├── 🗓️  Itinerary Planner Agent")
    print("│   ├── Day-by-day structured itinerary")
    print("│   ├── Morning/Afternoon/Evening activities")
    print("│   └── Geographically efficient routing")
    print("├── 💰 Budget Calculator Agent")
    print("│   ├── Comprehensive cost breakdown")
    print("│   ├── Accommodation, food, transport estimates")
    print("│   └── Budget fit analysis")
    print("└── 🎯 Attractions Recommendation Agent")
    print    ├── Historical sites and landmarks")
    print("    ├── Natural attractions and parks")
    print("    ├── Activities and experiences")
    print("    ├── Local food and cuisine")
    print("    └── Cultural experiences")

def show_output_summary(destination):
    """Show summary of generated outputs"""
    print(f"\n📊 Generated Travel Plan for {destination}:")
    print("┌─────────────────────────────────────────┐")
    print("│ 📄 itinerary.md                          │")
    print("│ Detailed day-by-day travel schedule     │")
    print("├─────────────────────────────────────────┤")
    print("│ 💳 budget.md                            │")
    print("│ Complete financial breakdown & analysis │")
    print("├─────────────────────────────────────────┤")
    print("│ 🎯 attractions.md                        │")
    print("│ Top attractions with expert insights    │")
    print("└─────────────────────────────────────────┘")

if __name__ == "__main__":
    # Test cases with different destinations and budgets
    test_cases = [
        ("Paris, France", "3", "2000"),
        ("Tokyo, Japan", "4", "3500"),
        ("Rome, Italy", "2", "1800")
    ]
    
    print("🚀 AI Travel Planner - Three-Agent System Test")
    print("=" * 70)
    
    display_system_capabilities()
    
    for i, (destination, days, budget) in enumerate(test_cases, 1):
        print(f"\n🧪 Test Case {i}/{len(test_cases)}")
        show_output_summary(destination)
        test_three_agent_system(destination, days, budget)
        
        if i < len(test_cases):
            print("\n" + "="*70)
            try:
                continue_test = input("Press Enter to continue to next test case, or 'q' to quit: ")
                if continue_test.lower() == 'q':
                    break
            except KeyboardInterrupt:
                print("\n\n👋 Testing interrupted by user")
                break
    
    print("\n🎉 All tests completed!")
    print("📁 Generated files:")
    print("   📄 itinerary.md - Detailed travel itineraries")
    print("   💳 budget.md - Comprehensive budget breakdowns")
    print("   🎯 attractions.md - Expert attraction recommendations")
    print("\n✨ Your three-agent AI Travel Planner is ready to use!")
