import networkx as nx
import os
from typing import List, Dict, Any

from .sbert_encoder import SemanticAnalyzer
from .complexity_calc import ComplexityCalculator

DEFAULT_CORPUS_PATH = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'corpus', 'python_corpus.txt')

class GraphInferenceEngine:
    def __init__(self, 
                 corpus_path: str = DEFAULT_CORPUS_PATH, 
                 similarity_threshold: float = 0.25,
                 asymmetry_threshold: float = 0.08):
        """
        Initializes the Prerequisite Inference Engine.
        Combines SemanticAnalyzer (SBERT) and ComplexityCalculator (The Corpus).
        """
        self.similarity_threshold = similarity_threshold
        self.asymmetry_threshold = asymmetry_threshold
        # Instantiate internal engines
        self.semantic_analyzer = SemanticAnalyzer()
        self.complexity_calculator = ComplexityCalculator(corpus_path=corpus_path)

    def build_prerequisite_graph(self, skills_list: List[str]) -> Dict[str, Any]:
        """
        Takes a list of unstructured string concepts and converts them into a 
        Prerequisite Graph (Directed Acyclic Graph) using SBERT and heuristics.
        Returns a dictionary formatted for React Flow.
        """
        if not skills_list:
            return {"nodes": [], "edges": []}

        # Step 1: Semantic Analyzer -> Similarity Matrix
        similarity_matrix = self.semantic_analyzer.calculate_similarity_matrix(skills_list)
        
        # Precompute frequencies and median occurrences for all skills
        paragraph_frequencies = {skill: self.complexity_calculator.get_paragraph_frequency(skill) for skill in skills_list}
        median_occurrences = {skill: self.complexity_calculator.get_median_occurrence(skill) for skill in skills_list}
        
        # Initialize a directed graph
        G = nx.DiGraph()
        
        # Add nodes to the graph
        for skill in skills_list:
            G.add_node(skill)
            
        n = len(skills_list)
        
        # Iterate through all unique pairs of skills (A, B)
        for i in range(n):
            for j in range(i + 1, n):
                skill_a = skills_list[i]
                skill_b = skills_list[j]
                
                similarity = similarity_matrix[i][j]
                
                # Rule: Check their Cosine Similarity. If > threshold, they are candidates.
                if similarity > self.similarity_threshold:
                    # Step 2: Asymmetric Co-occurrence
                    co_occur = self.complexity_calculator.get_co_occurrence(skill_a, skill_b)
                    freq_a = paragraph_frequencies[skill_a]
                    freq_b = paragraph_frequencies[skill_b]
                    
                    p_a_given_b = co_occur / freq_b if freq_b > 0 else 0.0
                    p_b_given_a = co_occur / freq_a if freq_a > 0 else 0.0
                    
                    diff = p_a_given_b - p_b_given_a
                    
                    # Logic: If P(A|B) is significantly greater than P(B|A), it means B relies heavily on A's context. A -> B.
                    if diff > self.asymmetry_threshold:
                        print(f"[{skill_a}] <--> [{skill_b}] | Similarity: {similarity:.3f}")
                        print("   ✅ Related! Checking Asymmetric Co-occurrence...")
                        print(f"   P({skill_a} | {skill_b}) = {p_a_given_b:.2f}")
                        print(f"   P({skill_b} | {skill_a}) = {p_b_given_a:.2f}")
                        print(f"   ➡️  Inferring Edge: '{skill_a}' -> '{skill_b}' (Asymmetric Context)")
                        G.add_edge(skill_a, skill_b)
                        
                    elif diff < -self.asymmetry_threshold:
                        print(f"[{skill_a}] <--> [{skill_b}] | Similarity: {similarity:.3f}")
                        print("   ✅ Related! Checking Asymmetric Co-occurrence...")
                        print(f"   P({skill_a} | {skill_b}) = {p_a_given_b:.2f}")
                        print(f"   P({skill_b} | {skill_a}) = {p_b_given_a:.2f}")
                        print(f"   ➡️  Inferring Edge: '{skill_b}' -> '{skill_a}' (Asymmetric Context)")
                        G.add_edge(skill_b, skill_a)
                        
                    else:
                        # Step 3: Center of Mass (The Fallback Heuristic)
                        # If probabilities are too close or co-occurrence is 0, fallback to Median Occurrence.
                        median_a = median_occurrences[skill_a]
                        median_b = median_occurrences[skill_b]
                        
                        if median_a < median_b:
                            print(f"[{skill_a}] <--> [{skill_b}] | Similarity: {similarity:.3f}")
                            print("   ✅ Related! Asymmetric too close. Checking Center of Mass...")
                            print(f"   Median({skill_a}) = {median_a:.1f}")
                            print(f"   Median({skill_b}) = {median_b:.1f}")
                            print(f"   ➡️  Inferring Edge: '{skill_a}' -> '{skill_b}' (Center of Mass Backup)")
                            G.add_edge(skill_a, skill_b)
                            
                        elif median_b < median_a:
                            print(f"[{skill_a}] <--> [{skill_b}] | Similarity: {similarity:.3f}")
                            print("   ✅ Related! Asymmetric too close. Checking Center of Mass...")
                            print(f"   Median({skill_a}) = {median_a:.1f}")
                            print(f"   Median({skill_b}) = {median_b:.1f}")
                            print(f"   ➡️  Inferring Edge: '{skill_b}' -> '{skill_a}' (Center of Mass Backup)")
                            G.add_edge(skill_b, skill_a)

        # Break any cycles generated by combining the two heuristics
        try:
            cycles = list(nx.simple_cycles(G))
            while cycles:
                for cycle in cycles:
                    if G.has_edge(cycle[-1], cycle[0]):
                        G.remove_edge(cycle[-1], cycle[0])
                cycles = list(nx.simple_cycles(G))
        except nx.NetworkXNoCycle:
            pass

        # Step 4: Island Handling
        # Find all isolated nodes (degree == 0, not connected at all)
        isolated_nodes = [node for node in G.nodes() if G.degree(node) == 0]
        
        if isolated_nodes:
            # Sort ALL skills by median occurrence
            sorted_by_median = sorted(skills_list, key=lambda x: median_occurrences[x])
            
            for isolated in isolated_nodes:
                rank_index = sorted_by_median.index(isolated)
                
                # If it's the absolute earliest concept (index 0), it SHOULD be an island (Day 1 unlock)
                if rank_index > 0:
                    # Draw an edge from the next-easiest concept
                    fallback_parent = sorted_by_median[rank_index - 1]
                    if not nx.has_path(G, isolated, fallback_parent): # Prevent cycle
                        print(f"[{isolated}] Formed an island. Forcing link from preceding concept.")
                        print(f"   ➡️  Inferring Edge: '{fallback_parent}' -> '{isolated}' (Island Handling)")
                        G.add_edge(fallback_parent, isolated)

        # Break any returning cycles one last time
        try:
            cycles = list(nx.simple_cycles(G))
            while cycles:
                for cycle in cycles:
                    if G.has_edge(cycle[-1], cycle[0]):
                        G.remove_edge(cycle[-1], cycle[0])
                cycles = list(nx.simple_cycles(G))
        except nx.NetworkXNoCycle:
            pass

        # Step 5: Transitive Reduction
        # Clean up the graph (e.g. if A->B and B->C, remove A->C)
        try:
            reduced_G = nx.transitive_reduction(G)
        except nx.NetworkXError:
            reduced_G = G
            pass
            
        # Format the Output for React Flow
        react_flow_data = {
            "nodes": [],
            "edges": []
        }

        # Add nodes
        for skill in reduced_G.nodes():
            react_flow_data["nodes"].append({
                "id": skill,
                "data": {"label": skill}
            })
            
        # Add edges
        for source, target in reduced_G.edges():
            edge_id = f"e-{source}-{target}"
            react_flow_data["edges"].append({
                "id": edge_id,
                "source": source,
                "target": target
            })

        return react_flow_data
