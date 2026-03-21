import re
from collections import Counter
import matplotlib.pyplot as plt

# --- CONFIGURATION ---
CORPUS_FILE = 'python_corpus.txt'
OUTPUT_IMAGE = 'eda_chart.png'

# Specific terms we want to check to prove your hypothesis
# Green = Easy, Orange = Medium, Red = Hard
target_terms = {
    'variable': 'Foundational',
    'string': 'Foundational',
    'print': 'Foundational',
    'if': 'Foundational',
    'list': 'Foundational',
    
    'function': 'Intermediate',
    'dictionary': 'Intermediate',
    'module': 'Intermediate',
    'loop': 'Intermediate',
    
    'class': 'Advanced',
    'object': 'Advanced',
    'inheritance': 'Advanced',
    'recursion': 'Advanced',
    'async': 'Advanced'
}

def analyze_corpus():
    print("1. Loading Corpus...")
    try:
        with open(CORPUS_FILE, 'r', encoding='utf-8') as f:
            text = f.read().lower()
    except FileNotFoundError:
        print(f"Error: Could not find '{CORPUS_FILE}'. Make sure it is in the same folder.")
        return

    # 2. Cleaning and Tokenization
    # Regex: Find words with 2 or more letters
    words = re.findall(r'\b[a-z]{2,}\b', text)
    total_words = len(words)
    
    # 3. Frequency Counting
    word_counts = Counter(words)
    unique_words = len(word_counts)

    print(f"\n--- DATASET STATISTICS ---")
    print(f"Total Words Processed: {total_words}")
    print(f"Unique Vocabulary Size: {unique_words}")
    
    # 4. Extract Counts for our Target Terms
    data = {}
    print("\n--- TERM FREQUENCY RESULTS ---")
    print(f"{'Term':<15} | {'Category':<15} | {'Count':<10}")
    print("-" * 45)
    
    for term, category in target_terms.items():
        count = word_counts.get(term, 0)
        data[term] = count
        print(f"{term:<15} | {category:<15} | {count:<10}")

    # 5. Generate Visualization
    print("\n5. Generating Chart...")
    
    # Define colors based on category
    colors = []
    for term in data.keys():
        cat = target_terms[term]
        if cat == 'Foundational': colors.append('#4CAF50') # Green
        elif cat == 'Intermediate': colors.append('#FF9800') # Orange
        else: colors.append('#F44336') # Red

    plt.figure(figsize=(12, 6))
    bars = plt.bar(data.keys(), data.values(), color=colors)
    
    # Add counts on top of bars
    for bar in bars:
        yval = bar.get_height()
        plt.text(bar.get_x() + bar.get_width()/2, yval + 5, int(yval), ha='center', va='bottom')

    plt.title(f"Term Frequency Analysis: Python Corpus ({total_words} words)", fontsize=14)
    plt.xlabel("Concepts (Green=Basic, Orange=Inter., Red=Adv.)", fontsize=12)
    plt.ylabel("Frequency Count", fontsize=12)
    plt.xticks(rotation=45)
    plt.tight_layout()
    
    # Save
    plt.savefig(OUTPUT_IMAGE)
    print(f"Success! Chart saved as '{OUTPUT_IMAGE}'")
    print("Open this image and paste it into your Word document.")

if __name__ == "__main__":
    analyze_corpus()