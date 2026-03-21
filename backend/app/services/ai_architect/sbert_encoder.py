from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from typing import List
import numpy as np

class SemanticAnalyzer:
    def __init__(self, model_name: str = 'all-MiniLM-L6-v2'):
        """
        Initializes the SemanticAnalyzer using a lightweight sentence-transformers model.
        """
        self.model_name = model_name
        # The 'all-MiniLM-L6-v2' model is fast, lightweight, and suitable for semantic relatedness.
        self.model = SentenceTransformer(self.model_name)

    def calculate_similarity_matrix(self, skills_list: List[str]) -> np.ndarray:
        """
        Encodes a list of strings into high-dimensional vectors and 
        returns the Cosine Similarity matrix.
        
        Args:
            skills_list (List[str]): List of skills to encode.
            
        Returns:
            np.ndarray: A 2D array representing the cosine similarity matrix.
        """
        if not skills_list:
            return np.array([])
            
        # Encode words into high-dimensional math (vectors)
        embeddings = self.model.encode(skills_list)
        
        # Calculate cosine similarity using scikit-learn
        similarity_matrix = cosine_similarity(embeddings)
        
        return similarity_matrix
