import networkx as nx
from typing import List, Dict, Any

from .sbert_encoder import SemanticAnalyzer
from .complexity_calc import ComplexityCalculator

class GraphInferenceEngine:
    def __init__(self, 
                 corpus_path: str = "corpus/python_corpus.txt", 
                 similarity_threshold: float = 0.3):
        """
        Initializes the Prerequisite Inference Engine.
        Combines SemanticAnalyzer (SBERT) and ComplexityCalculator (The Corpus).
        """
        self.similarity_threshold = similarity_threshold
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

        # Step 2: Semantic Analyzer -> Similarity Matrix
        similarity_matrix = self.semantic_analyzer.calculate_similarity_matrix(skills_list)
        
        # Step 3: Complexity Calculator -> Get frequencies for all skills
        frequencies = {skill: self.complexity_calculator.get_frequency(skill) for skill in skills_list}
        
        # Initialize a directed graph
        G = nx.DiGraph()
        
        # Add nodes to the graph
        for skill in skills_list:
            G.add_node(skill)
            
        # Step 4: Prerequisite Inference Engine (Heuristics)
        n = len(skills_list)
        # Iterate through all unique pairs of skills (A, B)
        for i in range(n):
            for j in range(i + 1, n):
                skill_a = skills_list[i]
                skill_b = skills_list[j]
                
                similarity = similarity_matrix[i][j]
                
                # Rule: Check their Cosine Similarity. If > threshold, they are related.
                if similarity > self.similarity_threshold:
                    freq_a = frequencies[skill_a]
                    freq_b = frequencies[skill_b]
                    
                    # Rule: If related, compare complexities.
                    # Higher frequency in corpus implies the concept is foundational (prerequisite)
                    if freq_a > freq_b:
                        G.add_edge(skill_a, skill_b)  # Skill A -> Skill B
                    elif freq_b > freq_a:
                        G.add_edge(skill_b, skill_a)  # Skill B -> Skill A
        # NEW STEP: The Complexity Fallback (Connect isolated islands)
        # Find all nodes that have absolutely no edges (degree == 0)
        isolated_nodes = [node for node in G.nodes() if G.degree(node) == 0]
        
        if isolated_nodes:
            # Sort ALL skills by frequency (Highest frequency = Easiest/Foundational)
            sorted_by_freq = sorted(skills_list, key=lambda x: frequencies[x], reverse=True)
            
            for isolated in isolated_nodes:
                # Find where this isolated node sits in the difficulty ranking
                rank_index = sorted_by_freq.index(isolated)
                
                # If it's the absolute easiest concept (index 0), it SHOULD be an island (Day 1 unlock)
                if rank_index > 0:
                    # Draw an edge from the next-easiest concept
                    fallback_parent = sorted_by_freq[rank_index - 1]
                    G.add_edge(fallback_parent, isolated)

        # Step 5: Transitive Reduction
        # Clean up the graph (e.g. if A->B and B->C, remove A->C)
        try:
            # networkx.transitive_reduction returns the reduced graph
            # This graph has the same nodes and same reachability, but redundant shortcut edges are removed.
            reduced_G = nx.transitive_reduction(G)
        except nx.NetworkXError:
            # If a cycle somehow exists, transitive_reduction will fail.
            # In our case, cycles shouldn't happen because we only add edges from High frequency -> Low frequency.
            # But just as a fallback in case there are identical frequencies and a cycle occurs:
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
