import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.ai_architect.graph_inference import GraphInferenceEngine

def run_test():
    print("🚀 Initializing AI Curriculum Architect...")
    engine = GraphInferenceEngine()
    
    # A raw list of unstructured skills an educator might type
    test_skills =[
        "variables",
        "for loops",
        "functions",
        "classes",
        "list comprehension",
        "nested loops"
    ]
    
    print(f"\n📥 Input Skills: {test_skills}")
    
    # --- DETAILED LOGGING PIPELINE ---
    
    # Step 1: Show Complexity/Frequencies
    print("\n📊 Step 1: Calculating Complexity (Corpus Frequency)")
    frequencies = {}
    for skill in test_skills:
        freq = engine.complexity_calculator.get_frequency(skill)
        frequencies[skill] = freq
        print(f"   - '{skill}': {freq} occurrences (Higher = Foundation, Lower = Advanced)")

    # Step 2: Show Semantic Analysis (SBERT)
    print("\n🧠 Step 2: Semantic Analysis (SBERT Cosine Similarity)")
    similarity_matrix = engine.semantic_analyzer.calculate_similarity_matrix(test_skills)
    
    print(f"\n🔍 Step 3: Graph Inference Logic (Similarity Threshold: {engine.similarity_threshold})")
    n = len(test_skills)
    for i in range(n):
        for j in range(i + 1, n):
            skill_a = test_skills[i]
            skill_b = test_skills[j]
            sim = similarity_matrix[i][j]
            
            # Print the similarity of this specific pair
            print(f"   [{skill_a}] <--> [{skill_b}] | Similarity: {sim:.3f}")
            
            # Show the heuristic logic decision
            if sim > engine.similarity_threshold:
                freq_a = frequencies[skill_a]
                freq_b = frequencies[skill_b]
                print(f"      ✅ Related! Compared frequencies:")
                
                if freq_a > freq_b:
                    print(f"      ➡️  Inferring Edge: '{skill_a}' (freq: {freq_a}) -> '{skill_b}' (freq: {freq_b})")
                elif freq_b > freq_a:
                    print(f"      ➡️  Inferring Edge: '{skill_b}' (freq: {freq_b}) -> '{skill_a}' (freq: {freq_a})")
                else:
                    print("      ⚖️  Equal frequency. Skipping edge connection.")
            else:
                print(f"      ❌ Not closely related (<= {engine.similarity_threshold}). Skipping.")
    # Step 4: Validate Complexity Fallback
    print("\n🏝️ Step 4: Complexity Fallback (Rescuing isolated concepts)")
    
    # Track which nodes got connected to simulate the Graph's degree check
    connected_nodes = set()
    for i in range(n):
        for j in range(i+1, n):
            if similarity_matrix[i][j] > engine.similarity_threshold:
                if frequencies[test_skills[i]] != frequencies[test_skills[j]]:
                    connected_nodes.add(test_skills[i])
                    connected_nodes.add(test_skills[j])
                    
    isolated_nodes = [skill for skill in test_skills if skill not in connected_nodes]
    
    if isolated_nodes:
        print(f"   ⚠️ Found isolated nodes: {isolated_nodes}.")
        # Sort ALL skills by frequency (Highest frequency = Easiest/Foundational)
        sorted_by_freq = sorted(test_skills, key=lambda x: frequencies[x], reverse=True)
        
        for isolated in isolated_nodes:
            rank_index = sorted_by_freq.index(isolated)
            if rank_index > 0:
                fallback_parent = sorted_by_freq[rank_index - 1]
                print(f"      🔗 Fallback Edge: Linking strictly by difficulty '{fallback_parent}' -> '{isolated}'")
            else:
                print(f"      ⚓ '{isolated}' is the easiest overall concept. Leaving untouched as root.")
    else:
        print("   ✅ No isolated islands found.")

    # --- END DETAILED LOGGING PIPELINE ---
                
    print("\n⚙️ Step 5: Transitive Reduction Cleanup inside the formal engine func...")
    
    # Run the engine
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
        # Find the names for easier reading
        source_name = next(n['data']['label'] for n in result_graph['nodes'] if n['id'] == edge['source'])
        target_name = next(n['data']['label'] for n in result_graph['nodes'] if n['id'] == edge['target'])
        print(f"➡️  {source_name}  MUST BE LEARNED BEFORE  {target_name}")

if __name__ == "__main__":
    run_test()