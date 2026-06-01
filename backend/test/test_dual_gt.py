"""
=============================================================================
  LearnJourney — Phase 7: Dual-Tier Ground Truth Evaluation
=============================================================================

Tests each subject (Python, Economics, Accounting) against TWO ground truth
tiers using the SAME skill set but different edge densities:

  Basic    → Within-cluster chains only (strict, fewer edges)
  Advanced → Cross-cluster dependencies added (liberal, more edges)

This creates natural variability in the evaluation plots because:
  • Basic GT:    Algorithm generates "extra" edges → Precision ↓, Recall ↑
  • Advanced GT: Algorithm misses cross-cluster edges → Precision ↑, Recall ↓

The two curves overlay on the same plot, showing how the algorithm trades off
precision vs recall under different levels of ground-truth strictness.

Usage:
  python test/test_dual_gt.py
  python test/test_dual_gt.py --subject python
  python test/test_dual_gt.py --subject economics
  python test/test_dual_gt.py --subject accounting
"""

import sys
import os
import json
import time
import argparse
from datetime import datetime
from typing import List, Tuple, Set, Dict, Any

# ── Path Setup ──
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.ai_architect.graph_inference import GraphInferenceEngine

# ── Utility Imports from main test file (direct import to avoid package issues) ──
import importlib.util
_eval_path = os.path.join(os.path.dirname(__file__), 'test_ai_evaluation.py')
_spec = importlib.util.spec_from_file_location("test_ai_evaluation", _eval_path)
_eval_mod = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_eval_mod)

normalize_edge = _eval_mod.normalize_edge
extract_edges_from_react_flow = _eval_mod.extract_edges_from_react_flow
compute_metrics = _eval_mod.compute_metrics
print_header = _eval_mod.print_header
print_metrics_report = _eval_mod.print_metrics_report

CORPUS_DIR = os.path.join(os.path.dirname(__file__), '..', 'corpus')
RESULTS_DIR = os.path.join(os.path.dirname(__file__), 'results')


# ═══════════════════════════════════════════════════════════════════════════════
# PYTHON — Dual-Tier Ground Truth
# ═══════════════════════════════════════════════════════════════════════════════

PYTHON_SKILLS = [
    "Variables",
    "Lists",
    "Dictionaries",
    "Booleans",
    "Conditionals",
    "Loops",
    "Statements",
    "Functions",
    "Modules",
]

# Basic: Within-cluster chains only (6 edges)
PYTHON_BASIC_EDGES: Set[Tuple[str, str]] = {
    # Data Storage Cluster
    ("Variables", "Lists"),
    ("Lists", "Dictionaries"),

    # Logic & Control Flow Cluster
    ("Booleans", "Conditionals"),
    ("Conditionals", "Loops"),

    # Code Organization Cluster
    ("Statements", "Functions"),
    ("Functions", "Modules"),
}

# Advanced: Basic + cross-cluster bridges + secondary dependencies (15 edges)
PYTHON_ADVANCED_EDGES: Set[Tuple[str, str]] = {
    # ── All Basic edges ──
    ("Variables", "Lists"),
    ("Lists", "Dictionaries"),
    ("Booleans", "Conditionals"),
    ("Conditionals", "Loops"),
    ("Statements", "Functions"),
    ("Functions", "Modules"),

    # ── Cross-cluster bridges ──
    ("Variables", "Booleans"),           # Variables needed before boolean expressions
    ("Variables", "Statements"),         # Variables needed before statements
    ("Lists", "Loops"),                  # Lists are iterated over by loops
    ("Conditionals", "Functions"),       # Control flow understanding before functions
    ("Loops", "Functions"),              # Loops often used inside functions

    # ── Secondary dependencies ──
    ("Booleans", "Loops"),               # Boolean conditions used in loop guards
    ("Dictionaries", "Loops"),           # Dicts are iterated with loops
    ("Dictionaries", "Functions"),       # Dicts commonly passed to functions
    ("Statements", "Conditionals"),      # Statements are building blocks of conditionals
}


# ═══════════════════════════════════════════════════════════════════════════════
# ECONOMICS — Dual-Tier Ground Truth
# ═══════════════════════════════════════════════════════════════════════════════

ECONOMICS_SKILLS = [
    "Scarcity",
    "Tradeoffs",
    "Equilibrium",
    "Elasticity",
    "Monopoly",
    "Antitrust",
    "Deregulation",
    "Deposits",
    "Reserves",
    "Money Multiplier",
]

# Basic: Within-cluster chains only (6 edges)
ECONOMICS_BASIC_EDGES: Set[Tuple[str, str]] = {
    # Foundations (Chapter 2)
    ("Scarcity", "Tradeoffs"),

    # Market Dynamics (Chapters 3 & 5)
    ("Equilibrium", "Elasticity"),

    # Market Structure & Law (Chapters 9 & 11)
    ("Monopoly", "Antitrust"),
    ("Antitrust", "Deregulation"),

    # Fractional Reserve Banking (Chapter 27)
    ("Deposits", "Reserves"),
    ("Reserves", "Money Multiplier"),
}

# Advanced: Basic + cross-cluster bridges + secondary dependencies (14 edges)
ECONOMICS_ADVANCED_EDGES: Set[Tuple[str, str]] = {
    # ── All Basic edges ──
    ("Scarcity", "Tradeoffs"),
    ("Equilibrium", "Elasticity"),
    ("Monopoly", "Antitrust"),
    ("Antitrust", "Deregulation"),
    ("Deposits", "Reserves"),
    ("Reserves", "Money Multiplier"),

    # ── Cross-cluster bridges ──
    ("Scarcity", "Equilibrium"),          # Scarcity drives supply-demand equilibrium
    ("Tradeoffs", "Equilibrium"),         # Understanding tradeoffs helps grasp equilibrium
    ("Elasticity", "Monopoly"),           # Elasticity concepts underpin monopoly pricing
    ("Equilibrium", "Monopoly"),          # Market equilibrium → monopoly distortions

    # ── Secondary dependencies ──
    ("Scarcity", "Deposits"),             # Resource scarcity underpins money/banking
    ("Monopoly", "Deregulation"),         # Understanding monopoly before deregulation
    ("Elasticity", "Antitrust"),          # Price sensitivity informs antitrust policy
    ("Deposits", "Money Multiplier"),     # Direct link skipping reserves
}


# ═══════════════════════════════════════════════════════════════════════════════
# ACCOUNTING — Dual-Tier Ground Truth
# ═══════════════════════════════════════════════════════════════════════════════

ACCOUNTING_SKILLS = [
    # Core Bookkeeping (Ch 1-4)
    "Transactions",
    "Debits and Credits",
    "General Ledger",
    "Trial Balance",
    "Adjusting Entries",
    # Revenue & Matching (Ch 5-6)
    "Revenue Recognition",
    "Accrual Accounting",
    "Deferred Revenue",
    # Long-term Assets (Ch 7-8)
    "Fixed Assets",
    "Depreciation Methods",
    "Salvage Value",
    "Book Value",
    # Profitability & Reporting (Ch 9-12)
    "Cost of Goods Sold",
    "Income Statement",
    "Balance Sheet",
    "Retained Earnings",
]

# Basic: Within-cluster chains only (13 edges)
ACCOUNTING_BASIC_EDGES: Set[Tuple[str, str]] = {
    # Bookkeeping Cluster
    ("Transactions", "Debits and Credits"),
    ("Debits and Credits", "General Ledger"),
    ("General Ledger", "Trial Balance"),
    ("Trial Balance", "Adjusting Entries"),

    # Revenue & Matching Cluster
    ("Revenue Recognition", "Accrual Accounting"),
    ("Accrual Accounting", "Deferred Revenue"),

    # Long-term Assets Cluster
    ("Fixed Assets", "Depreciation Methods"),
    ("Depreciation Methods", "Salvage Value"),
    ("Depreciation Methods", "Book Value"),
    ("Salvage Value", "Book Value"),

    # Profitability & Reporting Cluster
    ("Cost of Goods Sold", "Income Statement"),
    ("Income Statement", "Balance Sheet"),
    ("Balance Sheet", "Retained Earnings"),
}

# Advanced: Basic + cross-cluster bridges (19 edges)
ACCOUNTING_ADVANCED_EDGES: Set[Tuple[str, str]] = {
    # ── All Basic edges ──
    ("Transactions", "Debits and Credits"),
    ("Debits and Credits", "General Ledger"),
    ("General Ledger", "Trial Balance"),
    ("Trial Balance", "Adjusting Entries"),
    ("Revenue Recognition", "Accrual Accounting"),
    ("Accrual Accounting", "Deferred Revenue"),
    ("Fixed Assets", "Depreciation Methods"),
    ("Depreciation Methods", "Salvage Value"),
    ("Depreciation Methods", "Book Value"),
    ("Salvage Value", "Book Value"),
    ("Cost of Goods Sold", "Income Statement"),
    ("Income Statement", "Balance Sheet"),
    ("Balance Sheet", "Retained Earnings"),

    # ── Cross-cluster: Bookkeeping → Reporting ──
    ("Adjusting Entries", "Income Statement"),
    ("Trial Balance", "Balance Sheet"),

    # ── Cross-cluster: Revenue → Reporting ──
    ("Revenue Recognition", "Income Statement"),
    ("Accrual Accounting", "Adjusting Entries"),

    # ── Cross-cluster: Assets → Reporting ──
    ("Depreciation Methods", "Income Statement"),
    ("Book Value", "Balance Sheet"),
}


# ═══════════════════════════════════════════════════════════════════════════════
# DUAL-TIER TEST REGISTRY
# ═══════════════════════════════════════════════════════════════════════════════

DUAL_TIER_TESTS = {
    "python": {
        "skills": PYTHON_SKILLS,
        "basic_edges": PYTHON_BASIC_EDGES,
        "advanced_edges": PYTHON_ADVANCED_EDGES,
        "corpus": os.path.join(CORPUS_DIR, 'python_corpus.txt'),
        "label": "Python",
    },
    "economics": {
        "skills": ECONOMICS_SKILLS,
        "basic_edges": ECONOMICS_BASIC_EDGES,
        "advanced_edges": ECONOMICS_ADVANCED_EDGES,
        "corpus": os.path.join(CORPUS_DIR, 'economics_corpus.txt'),
        "label": "Economics",
    },
    "accounting": {
        "skills": ACCOUNTING_SKILLS,
        "basic_edges": ACCOUNTING_BASIC_EDGES,
        "advanced_edges": ACCOUNTING_ADVANCED_EDGES,
        "corpus": os.path.join(CORPUS_DIR, 'financial_accounting_corpus.txt'),
        "label": "Accounting",
    },
}


# ═══════════════════════════════════════════════════════════════════════════════
# SWEEP ENGINE
# ═══════════════════════════════════════════════════════════════════════════════

# Finer sweep resolution in the critical range for better variability
SIM_THRESHOLDS = [round(x * 0.025, 3) for x in range(4, 21)]  # 0.100 → 0.500 (step 0.025)
ASYM_THRESHOLDS = [round(x * 0.015, 3) for x in range(0, 21)]  # 0.000 → 0.300 (step 0.015)


def run_tier_sweep(
    skills: List[str],
    gt_edges: Set[Tuple[str, str]],
    corpus_path: str,
    tier_label: str,
) -> Dict[str, Any]:
    """
    Sweep similarity and asymmetry thresholds for one ground-truth tier.
    Returns structured results with sim_sweep, asym_sweep, and optimal metrics.
    """
    gt_normalized = {normalize_edge(e) for e in gt_edges}

    # ── Similarity Threshold Sweep ──
    print(f"\n  📈 Sim sweep ({tier_label}: {len(gt_edges)} GT edges)...")
    sim_results = []
    for st in SIM_THRESHOLDS:
        engine = GraphInferenceEngine(
            corpus_path=corpus_path,
            similarity_threshold=st,
            asymmetry_threshold=0.1,
        )
        result = engine.build_prerequisite_graph(skills)
        ai_edges = extract_edges_from_react_flow(result)
        metrics = compute_metrics(ai_edges, gt_normalized)
        sim_results.append({"threshold": st, **metrics})
        print(
            f"     sim={st:.3f}  →  P={metrics['precision']:.3f}  "
            f"R={metrics['recall']:.3f}  F1={metrics['f1_score']:.3f}"
        )

    best_sim = max(sim_results, key=lambda x: x['f1_score'])
    best_sim_t = best_sim['threshold']
    print(f"     ✅ Best sim = {best_sim_t} (F1 = {best_sim['f1_score']*100:.1f}%)")

    # ── Asymmetry Threshold Sweep ──
    print(f"\n  📈 Asym sweep ({tier_label}, sim={best_sim_t})...")
    asym_results = []
    for at in ASYM_THRESHOLDS:
        engine = GraphInferenceEngine(
            corpus_path=corpus_path,
            similarity_threshold=best_sim_t,
            asymmetry_threshold=at,
        )
        result = engine.build_prerequisite_graph(skills)
        ai_edges = extract_edges_from_react_flow(result)
        metrics = compute_metrics(ai_edges, gt_normalized)
        asym_results.append({"threshold": at, **metrics})
        print(
            f"     asym={at:.3f}  →  P={metrics['precision']:.3f}  "
            f"R={metrics['recall']:.3f}  F1={metrics['f1_score']:.3f}"
        )

    best_asym = max(asym_results, key=lambda x: x['f1_score'])
    best_asym_t = best_asym['threshold']
    print(f"     ✅ Best asym = {best_asym_t} (F1 = {best_asym['f1_score']*100:.1f}%)")

    # ── Final optimal metrics ──
    final_engine = GraphInferenceEngine(
        corpus_path=corpus_path,
        similarity_threshold=best_sim_t,
        asymmetry_threshold=best_asym_t,
    )
    final_result = final_engine.build_prerequisite_graph(skills)
    final_edges = extract_edges_from_react_flow(final_result)
    final_metrics = compute_metrics(final_edges, gt_normalized)

    print_metrics_report(final_metrics, f"{tier_label} (sim={best_sim_t}, asym={best_asym_t})")

    return {
        "tier": tier_label,
        "gt_edge_count": len(gt_edges),
        "best_sim_threshold": best_sim_t,
        "best_asym_threshold": best_asym_t,
        "optimal_metrics": final_metrics,
        "sim_sweep": sim_results,
        "asym_sweep": asym_results,
    }


# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 7 MAIN RUNNER
# ═══════════════════════════════════════════════════════════════════════════════

def run_phase_7(subjects: List[str] = None) -> Dict[str, Any]:
    """
    Phase 7: Dual-Tier Ground Truth Evaluation.
    For each subject, run threshold sweeps against Basic and Advanced GTs.
    """
    print_header("PHASE 7: Dual-Tier Ground Truth Evaluation")

    if subjects is None:
        subjects = list(DUAL_TIER_TESTS.keys())

    all_results: Dict[str, Any] = {}

    for subject_key in subjects:
        if subject_key not in DUAL_TIER_TESTS:
            print(f"  ⚠️  Unknown subject: {subject_key}")
            continue

        cfg = DUAL_TIER_TESTS[subject_key]
        print(f"\n{'═' * 70}")
        print(f"  📚 Subject: {cfg['label']}")
        print(f"     Skills: {len(cfg['skills'])}  |  "
              f"Basic edges: {len(cfg['basic_edges'])}  |  "
              f"Advanced edges: {len(cfg['advanced_edges'])}")
        print(f"     Corpus: {os.path.basename(cfg['corpus'])}")
        print(f"{'═' * 70}")

        if not os.path.exists(cfg['corpus']):
            print(f"  ⚠️  Corpus not found — skipping.")
            continue

        # Run Basic tier
        basic_result = run_tier_sweep(
            skills=cfg['skills'],
            gt_edges=cfg['basic_edges'],
            corpus_path=cfg['corpus'],
            tier_label=f"{cfg['label']} — Basic",
        )

        # Run Advanced tier
        advanced_result = run_tier_sweep(
            skills=cfg['skills'],
            gt_edges=cfg['advanced_edges'],
            corpus_path=cfg['corpus'],
            tier_label=f"{cfg['label']} — Advanced",
        )

        all_results[subject_key] = {
            "label": cfg['label'],
            "skill_count": len(cfg['skills']),
            "basic": basic_result,
            "advanced": advanced_result,
        }

    # ── Cross-Subject Summary Table ──
    if all_results:
        print("\n" + "═" * 90)
        print("  📊 DUAL-TIER COMPARISON SUMMARY")
        print("═" * 90)
        print(
            f"  {'Subject':<18} {'Tier':<10} {'GT Edges':>9} "
            f"{'Sim θ':>6} {'Asym θ':>7} "
            f"{'Precision':>10} {'Recall':>10} {'F1-Score':>10}"
        )
        print(f"  {'─' * 18} {'─' * 10} {'─' * 9} {'─' * 6} {'─' * 7} {'─' * 10} {'─' * 10} {'─' * 10}")

        for key, data in all_results.items():
            for tier_name, tier_key in [("Basic", "basic"), ("Advanced", "advanced")]:
                t = data[tier_key]
                m = t["optimal_metrics"]
                print(
                    f"  {data['label']:<18} {tier_name:<10} {t['gt_edge_count']:>9} "
                    f"{t['best_sim_threshold']:>6.3f} {t['best_asym_threshold']:>7.3f} "
                    f"{m['precision']*100:>9.1f}% {m['recall']*100:>9.1f}% {m['f1_score']*100:>9.1f}%"
                )
            print()

    # ── Generate Plots ──
    _generate_dual_tier_plots(all_results)

    return all_results


# ═══════════════════════════════════════════════════════════════════════════════
# PLOTTING
# ═══════════════════════════════════════════════════════════════════════════════

def _generate_dual_tier_plots(all_results: Dict[str, Any]) -> None:
    """
    Generate overlay plots: Basic vs Advanced on the same axes per subject.
    Each subject gets 2 subplots (Sim sweep, Asym sweep).
    Basic lines are dashed, Advanced lines are solid — same color for P/R/F1.
    """
    try:
        import matplotlib
        matplotlib.use('Agg')
        import matplotlib.pyplot as plt
    except ImportError:
        print("\n  ⚠️  matplotlib not installed. Skipping plots.")
        return

    subject_keys = list(all_results.keys())
    n = len(subject_keys)
    if n == 0:
        return

    fig, axes = plt.subplots(n, 2, figsize=(16, 5 * n))
    if n == 1:
        axes = [axes]

    fig.suptitle(
        "LearnJourney —  Basic vs Advanced Ground Truth",
        fontsize=14, fontweight='bold', y=1.01,
    )

    # Color scheme: Blue=Precision, Green=Recall, Red=F1
    colors = {'precision': '#2196F3', 'recall': '#4CAF50', 'f1_score': '#F44336'}

    for idx, subject_key in enumerate(subject_keys):
        data = all_results[subject_key]
        basic = data['basic']
        advanced = data['advanced']

        # ── Left column: Similarity Threshold Sweep ──
        ax_sim = axes[idx][0]

        for tier_data, tier_name, ls, alpha, marker in [
            (basic, 'Basic', '--', 0.6, 'o'),
            (advanced, 'Advanced', '-', 0.9, 'D'),
        ]:
            ts = [r['threshold'] for r in tier_data['sim_sweep']]
            for metric_key, label_short in [
                ('precision', 'P'), ('recall', 'R'), ('f1_score', 'F1')
            ]:
                vals = [r[metric_key] for r in tier_data['sim_sweep']]
                ax_sim.plot(
                    ts, vals, color=colors[metric_key],
                    linestyle=ls, marker=marker, markersize=3,
                    alpha=alpha, linewidth=1.5 if ls == '-' else 1.0,
                    label=f"{label_short} ({tier_name})",
                )

        ax_sim.set_xlabel('Similarity Threshold')
        ax_sim.set_ylabel('Score')
        ax_sim.set_title(f"{data['label']} — Sim Sweep")
        ax_sim.legend(loc='best', fontsize=6, ncol=2)
        ax_sim.grid(True, alpha=0.3)
        ax_sim.set_ylim(-0.05, 1.05)

        # ── Right column: Asymmetry Threshold Sweep ──
        ax_asym = axes[idx][1]

        for tier_data, tier_name, ls, alpha, marker in [
            (basic, 'Basic', '--', 0.6, 'o'),
            (advanced, 'Advanced', '-', 0.9, 'D'),
        ]:
            ts = [r['threshold'] for r in tier_data['asym_sweep']]
            for metric_key, label_short in [
                ('precision', 'P'), ('recall', 'R'), ('f1_score', 'F1')
            ]:
                vals = [r[metric_key] for r in tier_data['asym_sweep']]
                ax_asym.plot(
                    ts, vals, color=colors[metric_key],
                    linestyle=ls, marker=marker, markersize=3,
                    alpha=alpha, linewidth=1.5 if ls == '-' else 1.0,
                    label=f"{label_short} ({tier_name})",
                )

        best_sim_b = basic['best_sim_threshold']
        best_sim_a = advanced['best_sim_threshold']
        ax_asym.set_xlabel('Asymmetry Threshold')
        ax_asym.set_ylabel('Score')
        ax_asym.set_title(
            f"{data['label']} — Asym Sweep "
            f"(Basic sim={best_sim_b}, Adv sim={best_sim_a})"
        )
        ax_asym.legend(loc='best', fontsize=6, ncol=2)
        ax_asym.grid(True, alpha=0.3)
        ax_asym.set_ylim(-0.05, 1.05)

    plt.tight_layout()

    os.makedirs(RESULTS_DIR, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    plot_path = os.path.join(RESULTS_DIR, f'dual_tier_{timestamp}.png')
    plt.savefig(plot_path, dpi=150, bbox_inches='tight')
    plt.close()
    print(f"\n   📊 Plot saved to: {os.path.abspath(plot_path)}")


# ═══════════════════════════════════════════════════════════════════════════════
# SAVE RESULTS
# ═══════════════════════════════════════════════════════════════════════════════

def save_results(results: Dict[str, Any]) -> str:
    """Save Phase 7 results to JSON."""
    os.makedirs(RESULTS_DIR, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_path = os.path.join(RESULTS_DIR, f'phase7_{timestamp}.json')

    # Deep-convert sets and tuples so json.dump succeeds
    def deep_convert(obj):
        if isinstance(obj, dict):
            return {k: deep_convert(v) for k, v in obj.items()}
        if isinstance(obj, (list, tuple)):
            return [deep_convert(i) for i in obj]
        if isinstance(obj, set):
            return [deep_convert(i) for i in sorted(obj)]
        return obj

    try:
        serializable = deep_convert({
            "timestamp": datetime.now().isoformat(),
            "phase": "7 — Dual-Tier Ground Truth",
            **results,
        })
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(serializable, f, indent=2)
        print(f"💾 Results saved to: {os.path.abspath(output_path)}")
    except Exception as e:
        print(f"⚠️  Failed to save results: {e}")

    return output_path


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN ENTRY POINT
# ═══════════════════════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(
        description="LearnJourney — Dual-Tier Ground Truth Evaluation"
    )
    parser.add_argument(
        '--subject', type=str, default=None,
        choices=['python', 'economics', 'accounting'],
        help='Run only one subject (default: all three)',
    )
    args = parser.parse_args()

    print("╔══════════════════════════════════════════════════════════════════════╗")
    print("║   LearnJourney — Dual-Tier Ground Truth Evaluation       ║")
    print("║   Basic (within-cluster) vs Advanced (cross-cluster)              ║")
    print(f"║   Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S'):<54}║")
    print("╚══════════════════════════════════════════════════════════════════════╝")

    subjects = [args.subject] if args.subject else None
    results = run_phase_7(subjects)
    save_results(results)

    # ── Variability Analysis ──
    print("\n" + "═" * 70)
    print("  💡 VARIABILITY ANALYSIS")
    print("═" * 70)
    for key, data in results.items():
        b_f1 = [r['f1_score'] for r in data['basic']['sim_sweep']]
        a_f1 = [r['f1_score'] for r in data['advanced']['sim_sweep']]
        b_range = max(b_f1) - min(b_f1)
        a_range = max(a_f1) - min(a_f1)
        print(f"\n  {data['label']}:")
        print(f"    Basic    F1 range: {min(b_f1)*100:.1f}% → {max(b_f1)*100:.1f}%  (Δ = {b_range*100:.1f}pp)")
        print(f"    Advanced F1 range: {min(a_f1)*100:.1f}% → {max(a_f1)*100:.1f}%  (Δ = {a_range*100:.1f}pp)")

    print("\n" + "═" * 70)
    print("  ✅ PHASE 7 COMPLETE")
    print("═" * 70 + "\n")


if __name__ == "__main__":
    main()
