import os
import string
import re
import statistics
from typing import List

DEFAULT_CORPUS_PATH = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'corpus', 'python_corpus.txt')

class ComplexityCalculator:
    def __init__(self, corpus_path: str = DEFAULT_CORPUS_PATH):
        """
        Initializes the ComplexityCalculator with a pedagogical corpus.
        Analyzes the text by paragraphs.
        """
        self.corpus_path = corpus_path
        self.paragraphs = []
        self._load_and_preprocess()

    def _load_and_preprocess(self):
        """
        Loads the text file from corpus_path and preprocesses it by 
        splitting into paragraphs. Lowercases and removes punctuation for each.
        """
        if not os.path.exists(self.corpus_path):
            print(f"Warning: Corpus file not found at '{self.corpus_path}'. All frequencies will evaluate to 0.")
            return

        try:
            with open(self.corpus_path, "r", encoding="utf-8") as f:
                text = f.read()

            # Split by double newline to get paragraphs
            raw_paragraphs = text.split("\n\n")
            translator = str.maketrans('', '', string.punctuation)
            
            for p in raw_paragraphs:
                cleaned_p = p.strip().lower().translate(translator)
                if cleaned_p:
                    self.paragraphs.append(cleaned_p)
            
        except Exception as e:
            print(f"Error reading and preprocessing corpus file: {e}")

    def _clean_term(self, term: str) -> str:
        return term.lower().translate(str.maketrans('', '', string.punctuation)).strip()

    def get_paragraph_indices(self, term: str) -> List[int]:
        """
        Returns a list of integer indices representing which paragraphs contain the term.
        """
        if not self.paragraphs:
            return []
            
        clean_term = self._clean_term(term)
        if not clean_term:
            return []
            
        indices = []
        try:
            # Pattern looking for exact word bounds
            pattern = r'\b' + re.escape(clean_term) + r'\b'
            for idx, p in enumerate(self.paragraphs):
                if re.search(pattern, p):
                    indices.append(idx)
        except re.error:
            # Fallback to simple substring matching if regex fails
            for idx, p in enumerate(self.paragraphs):
                if clean_term in p:
                    indices.append(idx)
                    
        return indices

    def get_median_occurrence(self, term: str) -> float:
        """
        Calculate the 'Center of Mass' (Median Occurrence).
        Find all paragraph indices where the term appears and return median.
        """
        indices = self.get_paragraph_indices(term)
        if not indices:
            return float('inf')
        return float(statistics.median(indices))

    def get_paragraph_frequency(self, term: str) -> int:
        """
        Returns the total number of paragraphs that contain the term.
        """
        return len(self.get_paragraph_indices(term))

    def get_co_occurrence(self, term_a: str, term_b: str) -> int:
        """
        Return the number of paragraphs that contain BOTH term_a and term_b.
        """
        indices_a = set(self.get_paragraph_indices(term_a))
        indices_b = set(self.get_paragraph_indices(term_b))
        return len(indices_a.intersection(indices_b))
