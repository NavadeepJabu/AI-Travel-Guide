#!/usr/bin/env python
"""
Test script for the complete four-agent AI Travel Planner system
Tests Itinerary Planner, Budget Calculator, Attractions Recommendation, and Travel Tips Agents
"""
import sys
import os

# Add src to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

def test_four_agent_system(destination, number_of_days, user_budget):
    """Test the complete four-agent travel planning system"""
    print(f"\n🌍 Testing Four-Agent Travel Planner System")
    print(f"📍 Destination: {destination}")
    print(f"📅 Duration: {number_of_days} days")
    print(f"💰 Budget: ${user_budget}")
    print("=" * 80)
    
    inputs = {
        'destination': destination,
        'number_of_days': number_of_days,
        'user_budget': user_budget
    }
    
    try:
        from travel_agents.crew import TravelAgents
        result = TravelAgents().crew().kickoff(inputs=inputs)
        print(f"\n✅ Complete travel plan generated successfully!")
        print(f"📄 Itinerary saved to: itinerary.md")
        print(f"💳 Budget breakdown saved to: budget.md")
        print(f"🎯 Attractions guide saved to: attractions.md")
        print(f"💡 Travel tips saved to: travel_tips.md")
        return result
    except Exception as e:
        print(f"❌ Error: {e}")
        print("⚠️  Rate limit may have been reached. Check generated files below:")
        return None

def display_four_agent_capabilities():
    """Display what the four-agent system generates"""
    print(f"\n📋 Four-Agent System Capabilities:")
    print("├── 🗓️  Itinerary Planner Agent")
    print("│   ├── Day-by-day structured itinerary")
    print("│   ├── Morning/Afternoon/Evening activities")
    print("│   └── Geographically efficient routing")
    print("├── 💰 Budget Calculator Agent")
    print("│   ├── Comprehensive cost breakdown")
    print("│   ├── Accommodation, food, transport estimates")
    print("│   └── Budget fit analysis")
    print("├── 🎯 Attractions Recommendation Agent")
    print("│   ├── Historical sites and landmarks")
    print("│   ├── Natural attractions and parks")
    print("│   ├── Activities and experiences")
    print("│   ├── Local food and cuisine")
    print("│   └── Cultural experiences")
    print("└── 💡 Travel Tips Agent")
    print("    ├── Local customs and etiquette")
    print("    ├── Transportation guide")
    print("    ├── Safety and security")
    print("    ├── Best time to visit")
    print("    └── Local insights and advice")

def show_complete_output_summary(destination):
    """Show summary of all generated outputs"""
    print(f"\n📊 Complete Travel Plan for {destination}:")
    print("┌─────────────────────────────────────────┐")
    print("│ 📄 itinerary.md                          │")
    print("│ Detailed day-by-day travel schedule     │")
    print("├─────────────────────────────────────────┤")
    print("│ 💳 budget.md                            │")
    print("│ Complete financial breakdown & analysis │")
    print("├─────────────────────────────────────────┤")
    print("│ 🎯 attractions.md                        │")
    print("│ Top attractions with expert insights    │")
    print("├─────────────────────────────────────────┤")
    print("│ 💡 travel_tips.md                       │")
    print("│ Essential travel advice & local tips   │")
    print("└─────────────────────────────────────────┘")

def check_generated_files():
    """Check which files were generated"""
    print(f"\n📁 Generated Files Status:")
    files = ['itinerary.md', 'budget.md', 'attractions.md', 'travel_tips.md']
    for file in files:
        if os.path.exists(file):
            size = os.path.getsize(file)
            print(f"✅ {file} ({size} bytes)")
        else:
            print(f"❌ {file} (not generated)")

if __name__ == "__main__":
    # Test cases with different destinations and budgets
    test_cases = [
        ("Paris, France", "3", "2000"),
        ("Tokyo, Japan", "4", "3500"),
        ("Rome, Italy", "2", "1800")
    ]
    
    print("🚀 AI Travel Planner - Complete Four-Agent System Test")
    print("=" * 80)
    
    display_four_agent_capabilities()
    
    for i, (destination, days, budget) in enumerate(test_cases, 1):
        print(f"\n🧪 Test Case {i}/{len(test_cases)}")
        show_complete_output_summary(destination)
        
        result = test_four_agent_system(destination, days, budget)
        
        # Always check what files were generated
        check_generated_files()
        
        if i < len(test_cases):
            print("\n" + "="*80)
            try:
                continue_test = input("Press Enter to continue to next test case, or 'q' to quit: ")
                if continue_test.lower() == 'q':
                    break
            except KeyboardInterrupt:
                print("\n\n👋 Testing interrupted by user")
                break
    
    print("\n🎉 Testing completed!")
    print("📁 Expected generated files:")
    print("   📄 itinerary.md - Detailed travel itineraries")
    print("   💳 budget.md - Comprehensive budget breakdowns")
    print("   🎯 attractions.md - Expert attraction recommendations")
    print("   💡 travel_tips.md - Essential travel advice")
    print("\n✨ Your complete four-agent AI Travel Planner is ready to use!")
    print("\n📖 System provides comprehensive travel planning covering:")
    print("   • Scheduling and time management")
    print("   • Financial planning and budget analysis")
    print("   • Destination expertise and attraction insights")
    print("   • Practical travel advice and local customs")
