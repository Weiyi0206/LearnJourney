import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.ai_architect.graph_inference import GraphInferenceEngine

def run_test():
    print("🚀 Initializing AI Curriculum Architect (Asymmetric Co-occurrence & Center of Mass)...")
    engine = GraphInferenceEngine()
    
    # A raw list of unstructured skills an educator might type
    test_skills =[
        "variables",
        "for loops",
        "list comprehension",
        "nested loops",
        "functions",
        "classes"
    ]
    
    print(f"\n📥 Input Skills: {test_skills}")
    
    # Run the engine (it has internal print statements now)
    print("\n--- GRAPH INFERENCE PIPELINE ---")
    result_graph = engine.build_prerequisite_graph(test_skills)
    
    print("\n✅ AI Generation Complete! Here is the resulting Graph JSON format:\n")
    
    # Print Nodes
    print("--- FINAL NODES ---")
    for node in result_graph["nodes"]:
        print(f"- {node['data']['label']} (ID: {node['id']})")
        
    # Print Edges (The Learning Path)
    print("\n--- FINAL LEARNING PATH (EDGES) ---")
    if not result_graph["edges"]:
        print("No edges were inferred.")
    for edge in result_graph["edges"]:
        source_name = edge['source']
        target_name = edge['target']
        print(f"➡️  {source_name}  MUST BE LEARNED BEFORE  {target_name}")

if __name__ == "__main__":
    run_test()