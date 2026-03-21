import os
import string
import re

class ComplexityCalculator:
    def __init__(self, corpus_path: str = "corpus/python_corpus.txt"):
        """
        Initializes the ComplexityCalculator with a pedagogical corpus.
        """
        self.corpus_path = corpus_path
        self.preprocessed_corpus = ""
        self._load_and_preprocess()

    def _load_and_preprocess(self):
        """
        Loads the text file from corpus_path and preprocesses it by 
        converting to lowercase and removing punctuation.
        """
        # Error handling if the corpus file is missing
        if not os.path.exists(self.corpus_path):
            print(f"Warning: Corpus file not found at '{self.corpus_path}'. All frequencies will evaluate to 0.")
            return

        try:
            with open(self.corpus_path, "r", encoding="utf-8") as f:
                text = f.read()

            # Preprocessing: lowercase
            text = text.lower()

            # Preprocessing: remove punctuation
            translator = str.maketrans('', '', string.punctuation)
            self.preprocessed_corpus = text.translate(translator)
            
        except Exception as e:
            print(f"Error reading and preprocessing corpus file: {e}")

    def get_frequency(self, term: str) -> int:
        """
        Counts how many times a skill appears in the preprocessed corpus.
        
        Logic based on Zipfian distribution:
        - Higher frequency = Foundational (Lower Complexity)
        - Lower frequency = Advanced (Higher Complexity)
        """
        if not self.preprocessed_corpus:
            return 0
            
        # Clean the input term the same way as the corpus
        clean_term = term.lower().translate(str.maketrans('', '', string.punctuation))
        
        # If the term becomes empty after cleaning, return 0
        if not clean_term:
            return 0
            
        # Use regex to match exact words or phrases to avoid partial matches 
        # (e.g., searching for "for" shouldn't match "format")
        try:
            # Pattern looking for exact word bounds
            pattern = r'\b' + re.escape(clean_term) + r'\b'
            matches = re.findall(pattern, self.preprocessed_corpus)
            return len(matches)
        except re.error:
            # Fallback to simple substring counting if regex fails for any reason
            return self.preprocessed_corpus.count(clean_term)
