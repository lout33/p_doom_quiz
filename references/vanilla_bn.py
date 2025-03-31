#!/usr/bin/env python3

# --- Manual Simplified Bayesian Network P(doom) Example - Expanded ---
# Recreates BN logic without pgmpy library.
# NOTE: Uses simplified forward-pass inference. CPTs loaded from JSON.
# MODIFIED: Target year changed to 2035. CPTs may need recalibration.
# MODIFIED: Displays final probability as a range based on simplified sensitivity analysis.
# ADDED: Heuristic calculation for P(doom) by 2050 and 2100 based on 2035 result and Timeline.

import itertools
import csv
import os
import sys
import json
import copy
import numpy as np

# --- Configuration ---
EXPERTS_CSV_PATH = 'experts_pdoom.csv'
CPTS_JSON_PATH = 'bn_cpts.json'
KEY_DELIMITER = '|'
PERTURBATION_DELTA = 0.10 # For sensitivity analysis on 2035 CPT

# --- Heuristic Configuration ---
# Base percentage points to add from 2035 -> 2050 and 2050 -> 2100
# Represents general risk increase over time if unresolved
BASE_INCREASE_2050 = 7.5  # Add 7.5 points (e.g., 20% -> 27.5%)
BASE_INCREASE_2100 = 12.5 # Add another 12.5 points (e.g., 27.5% -> 40%)

# Multipliers based on the most likely Timeline outcome from the BN
TIMELINE_MULTIPLIER = {
    'Early': 0.6, # Less added increase if risk manifests early
    'Mid':   1.0, # Standard increase
    'Late':  1.5  # More added increase if risk manifests late
}
DEFAULT_TIMELINE_FOR_HEURISTIC = 'Mid' # Use if Timeline calculation fails

# --- Helper Functions ---
def safe_float(value, default=None):
    """Safely convert to float, return default on failure."""
    if value is None or value == '': return default
    try: return float(value)
    except (ValueError, TypeError): return default

def normalize_dist(dist):
    """Normalizes a probability distribution dictionary."""
    if not isinstance(dist, dict):
        # print(f"Warning: normalize_dist received non-dict type: {type(dist)}. Returning as is.")
        return dist
    total = sum(dist.values())
    if total == 0:
        num_states = len(dist)
        return {k: 1.0 / num_states for k in dist} if num_states > 0 else dist
    return {k: v / total for k, v in dist.items()}

def format_prob_range(prob, delta=5):
    """Formats a point probability into an approximate percentage range string."""
    # [Function unchanged - keep as is]
    if prob is None:
        return "N/A"
    pct = prob * 100
    if pct < 0.01:
        return "< 1%" # Handle very small probabilities
    if pct > 99.99:
        return "> 99%" # Handle very large probabilities

    # Calculate range, clamping between 0 and 100
    lower = max(0, round(pct) - delta)
    upper = min(100, round(pct) + delta)

    # Avoid invalid ranges like 5%-5% if delta is small or rounding aligns
    if lower == upper:
         # If it rounds to exactly 0 or 100, give a slightly wider range feel
         if lower == 0:
             upper = min(100, lower + delta) # e.g., 0%-5%
         elif upper == 100:
             lower = max(0, upper - delta) # e.g., 95%-100%
         else:
             # Otherwise, just show the rounded percentage
             return f"approx. {lower:.0f}%"

    # Ensure lower is strictly less than upper for standard ranges
    if lower >= upper:
         return f"approx. {round(pct):.0f}%"

    return f"{lower:.0f}% - {upper:.0f}%"


# --- 1. Define Simplified Expert Data ---
def load_real_experts(file_path):
    """Loads expert data from the specified CSV, including 2035, 2050, 2100 estimates."""
    experts = []
    if not os.path.exists(file_path):
        print(f"Warning: Experts file not found at {file_path}", file=sys.stderr)
        return experts
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            required_cols = ['Name', 'P_Doom_Estimate_By_2035_Percent', 'P_Doom_Estimate_By_2050_Percent', 'P_Doom_Estimate_By_2100_Percent']
            # Check if essential columns seem present (optional check)
            if not all(col in reader.fieldnames for col in required_cols if col != 'Name'):
                 print(f"Warning: Experts CSV ({file_path}) might be missing expected P_Doom percentage columns for 2035/2050/2100.", file=sys.stderr)

            for row in reader:
                name = row.get('Name')
                if not name: continue # Skip rows without a name

                # Try loading estimates, defaulting to None if missing/invalid
                pdoom_2035 = safe_float(row.get('P_Doom_Estimate_By_2035_Percent'))
                pdoom_2050 = safe_float(row.get('P_Doom_Estimate_By_2050_Percent'))
                pdoom_2100 = safe_float(row.get('P_Doom_Estimate_By_2100_Percent'))

                # Only add expert if they have a name and at least one valid estimate
                if pdoom_2035 is not None or pdoom_2050 is not None or pdoom_2100 is not None:
                    experts.append({
                        'name': name,
                        'pdoom_2035_percent': pdoom_2035,
                        'pdoom_2050_percent': pdoom_2050,
                        'pdoom_2100_percent': pdoom_2100
                    })

    except Exception as e: print(f"Error loading experts file {file_path}: {e}", file=sys.stderr)
    if not experts: print(f"Warning: No valid expert data loaded from {file_path} (checked Name and any P_Doom estimate).", file=sys.stderr)
    return experts

# --- 2. Define Network Structure (Parents) and Node States ---
# [Unchanged - Must match CPT JSON structure]
PARENTS = {
    'Timeline': [], 'Coordination': [], 'Interpretability': [], 'MisusePotential': [], # Priors
    'AlignmentSolvability': ['Timeline', 'Interpretability'],
    'Competition': ['Coordination'],
    'WarningShot': ['Coordination'],
    'Regulation': ['Coordination', 'Competition', 'WarningShot'],
    'DeceptionRisk': ['AlignmentSolvability'],
    'SelfReplication': ['Timeline'],
    'PowerConcentration': ['Competition'],
    'ControlLossRisk': ['Timeline', 'MisusePotential', 'DeceptionRisk'],
    'P_doom_2035': ['AlignmentSolvability', 'Regulation', 'ControlLossRisk']
}

STATES = {
    'Timeline': ['Early', 'Mid', 'Late'],
    'Coordination': ['Good', 'Med', 'Poor'],
    'Interpretability': ['Good', 'Med', 'Poor'],
    'MisusePotential': ['Low', 'Med', 'High'],
    'AlignmentSolvability': ['Easy', 'Med', 'Hard'],
    'Competition': ['Low', 'Med', 'High'],
    'WarningShot': ['Low', 'Med', 'High'],
    'Regulation': ['High', 'Med', 'Low'],
    'DeceptionRisk': ['Low', 'Med', 'High'],
    'SelfReplication': ['Low', 'Med', 'High'],
    'ControlLossRisk': ['Low', 'Med', 'High'],
    'PowerConcentration': ['Low', 'Med', 'High'],
    'P_doom_2035': ['Low', 'Medium', 'High', 'VeryHigh']
}

# --- 3. Load CPTs from JSON File ---
def load_cpts_from_json(json_path, parents_map, delimiter):
    """Loads CPTs from JSON, converting string keys back to tuples."""
    # [Function mostly unchanged, minor warning refinement]
    print(f"Loading CPTs from {json_path}...")
    if not os.path.exists(json_path):
        print(f"Error: CPTs file not found at {json_path}", file=sys.stderr)
        return None

    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            raw_cpts = json.load(f)
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON from {json_path}: {e}", file=sys.stderr)
        return None
    except IOError as e:
        print(f"Error reading file {json_path}: {e}", file=sys.stderr)
        return None

    reconstructed_cpts = {}
    nodes_processed = set()
    for node_name, node_data in raw_cpts.items():
        nodes_processed.add(node_name)
        if node_name not in parents_map:
            print(f"Warning: Node '{node_name}' found in JSON but not in PARENTS definition. Skipping.", file=sys.stderr)
            continue

        parent_nodes = parents_map.get(node_name, [])

        if not parent_nodes: # Prior
            if isinstance(node_data, dict):
                 reconstructed_cpts[node_name] = node_data
            else:
                 print(f"Warning: Invalid format for prior node '{node_name}' in JSON. Expected dict, got {type(node_data)}. Skipping.", file=sys.stderr)
        else: # Conditional
            if not isinstance(node_data, dict):
                 print(f"Warning: Invalid format for conditional node '{node_name}' in JSON. Expected dict, got {type(node_data)}. Skipping.", file=sys.stderr)
                 continue

            converted_conditional_cpt = {}
            num_expected_parents = len(parent_nodes)
            for joined_key, child_distribution in node_data.items():
                parent_states_list = joined_key.split(delimiter)
                if len(parent_states_list) != num_expected_parents:
                    print(f"Warning: Key '{joined_key}' for node '{node_name}' has {len(parent_states_list)} states, but expected {num_expected_parents} based on PARENTS {parent_nodes}. Skipping entry.", file=sys.stderr)
                    continue
                tuple_key = tuple(parent_states_list)
                if not isinstance(child_distribution, dict):
                     print(f"Warning: Invalid child distribution format for node '{node_name}', key '{joined_key}'. Expected dict, got {type(child_distribution)}. Skipping entry.", file=sys.stderr)
                     continue
                converted_conditional_cpt[tuple_key] = child_distribution
            reconstructed_cpts[node_name] = converted_conditional_cpt

    # Final check: Ensure all nodes defined in PARENTS are present in the loaded CPTs
    missing_nodes = set(parents_map.keys()) - nodes_processed
    if missing_nodes:
        print(f"Warning: The following nodes defined in PARENTS were NOT found in {json_path}: {missing_nodes}", file=sys.stderr)

    print(f"Successfully loaded and processed CPTs for {len(reconstructed_cpts)} nodes found in JSON.")
    return reconstructed_cpts

# --- Load the CPTs ---
LOADED_CPTS = load_cpts_from_json(CPTS_JSON_PATH, PARENTS, KEY_DELIMITER)
if LOADED_CPTS is None:
    print("Exiting due to CPT loading failure.", file=sys.stderr)
    sys.exit(1)

# --- Perturbation Helper Function (Unchanged from previous version) ---
def perturb_distribution(dist, delta, pessimistic=True):
    """
    Shifts probability mass towards (pessimistic) or away from (optimistic)
    High/VeryHigh states by a total amount delta for P_doom_2035 node.
    Handles clipping and normalization.
    """
    is_pdoom_node = list(dist.keys()) == STATES['P_doom_2035']
    if not is_pdoom_node: return dist # Only perturb P_doom_2035 for now

    new_dist = dist.copy()
    states_ordered = STATES['P_doom_2035']
    shift_per_state_pair = delta / 2.0

    if pessimistic:
        take_from_low = min(new_dist.get('Low',0), shift_per_state_pair)
        take_from_med = min(new_dist.get('Medium',0), shift_per_state_pair)
        total_taken = take_from_low + take_from_med
        new_dist['Low'] = new_dist.get('Low', 0) - take_from_low
        new_dist['Medium'] = new_dist.get('Medium', 0) - take_from_med
        add_to_high = total_taken / 2.0
        add_to_vh = total_taken / 2.0
        new_dist['High'] = new_dist.get('High', 0) + add_to_high
        new_dist['VeryHigh'] = new_dist.get('VeryHigh', 0) + add_to_vh
    else: # Optimistic
        take_from_high = min(new_dist.get('High',0), shift_per_state_pair)
        take_from_vh = min(new_dist.get('VeryHigh',0), shift_per_state_pair)
        total_taken = take_from_high + take_from_vh
        new_dist['High'] = new_dist.get('High', 0) - take_from_high
        new_dist['VeryHigh'] = new_dist.get('VeryHigh', 0) - take_from_vh
        add_to_low = total_taken / 2.0
        add_to_med = total_taken / 2.0
        new_dist['Low'] = new_dist.get('Low', 0) + add_to_low
        new_dist['Medium'] = new_dist.get('Medium', 0) + add_to_med

    for state in states_ordered: new_dist[state] = np.clip(new_dist.get(state, 0), 0, 1)
    return normalize_dist(new_dist)

# --- Create Perturbed CPTs based on Loaded Data ---
CPTS_central = LOADED_CPTS
CPTS_optimistic = copy.deepcopy(LOADED_CPTS)
CPTS_pessimistic = copy.deepcopy(LOADED_CPTS)

target_node_for_perturbation = 'P_doom_2035'
if target_node_for_perturbation in CPTS_central:
    original_pdoom_cpt = CPTS_central[target_node_for_perturbation]
    perturbed_pdoom_optimistic = {}
    perturbed_pdoom_pessimistic = {}
    if isinstance(original_pdoom_cpt, dict):
        print(f"Perturbing CPT for node: {target_node_for_perturbation}")
        for condition, dist in original_pdoom_cpt.items():
             if isinstance(condition, tuple) and isinstance(dist, dict):
                  normalized_original_dist = normalize_dist(dist)
                  perturbed_pdoom_optimistic[condition] = perturb_distribution(normalized_original_dist, PERTURBATION_DELTA, pessimistic=False)
                  perturbed_pdoom_pessimistic[condition] = perturb_distribution(normalized_original_dist, PERTURBATION_DELTA, pessimistic=True)
             else: # Keep original if format is wrong
                 perturbed_pdoom_optimistic[condition] = dist
                 perturbed_pdoom_pessimistic[condition] = dist
        CPTS_optimistic[target_node_for_perturbation] = perturbed_pdoom_optimistic
        CPTS_pessimistic[target_node_for_perturbation] = perturbed_pdoom_pessimistic
        print(f"Finished perturbing CPT for {target_node_for_perturbation}.")
    else: print(f"Error: Expected CPT for '{target_node_for_perturbation}' to be dict. Cannot perturb.", file=sys.stderr)
else:
    print(f"Warning: Node '{target_node_for_perturbation}' not found in loaded CPTs. Sensitivity analysis based on perturbation will not run.", file=sys.stderr)
    CPTS_optimistic = CPTS_central # Fallback
    CPTS_pessimistic = CPTS_central # Fallback

# --- 4. Simplified Inference Logic ---
def calculate_marginal_manual(node, evidence, current_probabilities, all_cpts):
    """Calculates marginal probability distribution for a node manually. Uses provided CPT dict."""
    # [Function unchanged internally, relies on load_cpts_from_json providing correct format]
    # [Includes robustness checks added in previous step]
    if node in evidence:
        if node not in STATES: return {}
        dist = {state: 0.0 for state in STATES[node]}
        dist[evidence[node]] = 1.0
        return dist

    parent_nodes = PARENTS.get(node, [])

    if not parent_nodes: # Root Node
        if node not in all_cpts:
             print(f"Error: Prior CPT missing for root node '{node}'. Returning uniform.", file=sys.stderr)
             node_states = STATES.get(node, [])
             return {state: 1.0 / len(node_states) for state in node_states} if node_states else {}
        prior = all_cpts.get(node, {})
        if not isinstance(prior, dict):
             print(f"Error: Prior for '{node}' not dict: {type(prior)}. Returning uniform.", file=sys.stderr)
             node_states = STATES.get(node, [])
             return {state: 1.0 / len(node_states) for state in node_states} if node_states else {}
        return normalize_dist(prior) if prior else {}

    # Conditional Node
    node_states = STATES.get(node)
    if not node_states: return {}
    node_dist = {state: 0.0 for state in node_states}
    cpt = all_cpts.get(node)
    if not cpt or not isinstance(cpt, dict):
        print(f"Error: CPT missing or invalid type for node '{node}'.", file=sys.stderr)
        return node_dist

    parent_states_list = [STATES.get(p_node) for p_node in parent_nodes]
    if not all(parent_states_list): return node_dist

    parent_state_combinations = list(itertools.product(*parent_states_list))

    for parent_combo in parent_state_combinations:
        prob_parents = 1.0
        valid_combo = True
        parent_key_tuple = tuple(parent_combo)

        for i, p_node in enumerate(parent_nodes):
            parent_state = parent_combo[i]
            parent_prob_dist = current_probabilities.get(p_node)
            if parent_prob_dist is None or not isinstance(parent_prob_dist, dict):
                valid_combo = False; break
            prob_parents *= parent_prob_dist.get(parent_state, 0.0)

        if not valid_combo or prob_parents == 0: continue

        conditional_prob_dist = cpt.get(parent_key_tuple)
        if conditional_prob_dist is None or not isinstance(conditional_prob_dist, dict):
             # print(f"Warning: CPT entry missing/invalid for {node}|{parent_key_tuple}. Skipping.", file=sys.stderr) # Optional Debug
             continue

        norm_cond_dist = normalize_dist(conditional_prob_dist) if conditional_prob_dist else {}
        for node_state in node_states:
            prob_node_given_parents = norm_cond_dist.get(node_state, 0.0)
            node_dist[node_state] += prob_node_given_parents * prob_parents

    normalized_node_dist = normalize_dist(node_dist)
    # Optional: Final sum check warning
    # if abs(sum(normalized_node_dist.values()) - 1.0) > 1e-4 and sum(normalized_node_dist.values()) > 0:
    #      print(f"Warning: Final dist for {node} sums to {sum(normalized_node_dist.values())}")
    return normalized_node_dist


def update_all_probabilities_manual(evidence, master_cpt_dict):
    """Updates probabilities for all nodes using a manual forward pass. Uses provided CPT dict."""
    # [Function unchanged internally, relies on calculate_marginal_manual]
    # [Includes robustness checks added in previous step]
    calculation_order = [
        'Timeline', 'Coordination', 'Interpretability', 'MisusePotential',
        'AlignmentSolvability', 'Competition', 'WarningShot', 'SelfReplication',
        'Regulation', 'DeceptionRisk', 'PowerConcentration',
        'ControlLossRisk',
        'P_doom_2035'
    ]
    defined_nodes = set(PARENTS.keys())
    ordered_nodes = set(calculation_order)
    if defined_nodes != ordered_nodes: # Basic check
         print(f"Warning: Mismatch PARENTS vs calculation_order!")

    current_probabilities = {}
    if not master_cpt_dict or not isinstance(master_cpt_dict, dict):
        print("Error: Invalid master_cpt_dict provided to update_all_probabilities_manual. Returning empty.", file=sys.stderr)
        return {}

    for node in calculation_order:
        if node not in master_cpt_dict and node not in evidence:
             print(f"Critical Warning: Node '{node}' missing from CPTs and evidence. Assigning uniform.", file=sys.stderr)
             node_states = STATES.get(node, [])
             current_probabilities[node] = {state: 1.0/len(node_states) for state in node_states} if node_states else {}
             continue

        current_probabilities[node] = calculate_marginal_manual(node, evidence, current_probabilities, master_cpt_dict)

    return current_probabilities

# --- 5. Define Questions and Mapping (Unchanged) ---
questions_map = {
    'Q14': {'level': 1, 'text': "Broadly, when do you expect AI systems to significantly surpass human cognitive abilities?", 'node': 'Timeline', 'options': {'1': ('Before 2035', 'Early'), '2': ('2035-2050', 'Mid'), '3': ('2050-2070', 'Late'), '4': ('After 2070 / Never', 'Late')}},
    'Q15': {'level': 1, 'text': "What is your general intuition about the potential for AI to pose an existential risk (by 2035)?", 'node': 'P_doom_2035', 'is_prior_belief': True, 'options': {'1': ('Very Low (<5%)', 0.03), '2': ('Low (5-15%)', 0.10), '3': ('Moderate (15-35%)', 0.25), '4': ('High (35-60%)', 0.50), '5': ('Very High (>60%)', 0.80)}},
    'Q16': {'level': 1, 'text': "How optimistic about humanity's general ability to cooperate effectively on AI safety?", 'node': 'Coordination', 'options': {'1': ('Very Optimistic', 'Good'), '2': ('Somewhat Optimistic', 'Good'), '3': ('Neutral / Mixed', 'Med'), '4': ('Somewhat Pessimistic', 'Poor'), '5': ('Very Pessimistic', 'Poor')}},
    'Q4': {'level': 1, 'text': "How likely are robust technical solutions to AI alignment BEFORE superintelligence?", 'node': 'AlignmentSolvability', 'options': {'1': ('Very likely (>80%)', 'Easy'), '2': ('Somewhat likely (40-80%)', 'Med'), '3': ('Somewhat unlikely (20-40%)', 'Hard'), '4': ('Very unlikely (<20%)', 'Hard')}},
    'Q6': {'level': 2, 'text': "When will labs implement robust, verifiable INTERPRETABILITY techniques?", 'node': 'Interpretability', 'options': {'1': ('Before 2035', 'Good'), '2': ('2035-2050', 'Med'), '3': ('After 2050 / Never', 'Poor')}},
    'Q1_Control': {'level': 2, 'text': "When will AI autonomously replicate its own R&D cycle? (Proxy for Control Loss)", 'node': 'ControlLossRisk', 'options': {'1': ('Before 2030', 'High'), '2': ('2030-2040', 'High'), '3': ('After 2040', 'Med'), '4': ('Never/>100 years', 'Low')}},
    'Q2_Misuse': {'level': 2, 'text': "How likely are novel dangerous capabilities (e.g., autonomous bioweapons) from AI before 2035?", 'node': 'MisusePotential', 'options': {'1': ('Very Unlikely', 'Low'), '2': ('Possible', 'Med'), '3': ('Likely', 'High'), '4': ('Almost Certain', 'High')}},
    'Q10': {'level': 2, 'text': "How likely will capable AI systems develop DECEPTIVE behaviors by 2035?", 'node': 'DeceptionRisk', 'options': {'1': ('Very likely (>80%)', 'High'), '2': ('Somewhat likely (40-80%)', 'High'), '3': ('Somewhat unlikely (20-40%)', 'Med'), '4': ('Very unlikely (<20%)', 'Low')}},
    'Q13': {'level': 2, 'text': "How likely are AI systems deployed with capability to SELF-REPLICATE online by 2035?", 'node': 'SelfReplication', 'options': {'1': ('Very likely (>80%)', 'High'), '2': ('Somewhat likely (40-80%)', 'High'), '3': ('Somewhat unlikely (20-40%)', 'Med'), '4': ('Very unlikely (<20%)', 'Low')}},
    'Q11': {'level': 3, 'text': "How intense will the COMPETITIVE race for AI capabilities be leading up to 2035?", 'node': 'Competition', 'options': {'1': ('Extreme competition, few safety considerations', 'High'), '2': ('Strong competition, some safety considerations', 'High'), '3': ('Moderate competition, significant safety', 'Med'), '4': ('Collaborative development, strong safety focus', 'Low')}},
    'Q8_Reg': {'level': 3, 'text': "How likely are binding COMPUTE governance frameworks by 2035?", 'node': 'Regulation', 'options': {'1': ('Very likely (>80%)', 'High'), '2': ('Somewhat likely (40-80%)', 'High'), '3': ('Somewhat unlikely (20-40%)', 'Med'), '4': ('Very unlikely (<20%)', 'Low')}},
    'Q12': {'level': 3, 'text': "How likely is significant POWER CONCENTRATION in AI development by 2035?", 'node': 'PowerConcentration', 'options': {'1': ('Very likely (>80%)', 'High'), '2': ('Somewhat likely (40-80%)', 'High'), '3': ('Somewhat unlikely (20-40%)', 'Med'), '4': ('Very unlikely (<20%)', 'Low')}},
    'Q9': {'level': 3, 'text': "How likely is a major 'WARNING SHOT' catastrophe before AI surpasses humans (relevant before 2035)?", 'node': 'WarningShot', 'options': {'1': ('Very likely (>80%)', 'High'), '2': ('Somewhat likely (40-80%)', 'High'), '3': ('Somewhat unlikely (20-40%)', 'Med'), '4': ('Very unlikely (<20%)', 'Low')}},
}
sorted_qids = sorted(questions_map.keys(), key=lambda q: (questions_map[q]['level'], q))


# --- 6. Run the Quiz ---
def run_quiz(initial_cpts):
    """Gets user evidence through questions."""
    user_evidence = {}
    current_level = 0
    print("\n" + "="*50)
    print("--- AI Risk Assessment (Manual BN Simulation - Target 2035) ---")
    print("="*50)
    print("NOTE: Probabilities loaded from JSON. Final result shown as a range.")
    print("      Includes heuristic estimates for 2050 & 2100.")

    # Initial state calculation (using central CPTs)
    if not initial_cpts or not isinstance(initial_cpts, dict):
         print("Error: Central CPTs invalid. Cannot calculate initial state.", file=sys.stderr)
         initial_prob_dist = {}
    else:
        all_probs_initial = update_all_probabilities_manual({}, initial_cpts)
        initial_prob_dist = all_probs_initial.get('P_doom_2035', {})

    print("\nInitial Estimated P(doom by 2035) Distribution (Approximate Ranges):")
    if not initial_prob_dist or not isinstance(initial_prob_dist, dict):
        print("  Error: Could not calculate initial distribution.")
    else:
        pdoom_sum_check = 0.0
        for state in STATES['P_doom_2035']:
            prob = initial_prob_dist.get(state, 0.0)
            print(f"  P(Doom={state}) = {format_prob_range(prob)}")
            pdoom_sum_check += prob
        initial_pdoom_high_vh = initial_prob_dist.get('High', 0.0) + initial_prob_dist.get('VeryHigh', 0.0)
        print(f"Initial P(Doom=High or VeryHigh): {initial_pdoom_high_vh * 100:.1f}% (point estimate)")
        if abs(pdoom_sum_check - 1.0) > 0.01:
              print(f"  (Note: Underlying point probabilities sum to {pdoom_sum_check:.3f})")

    print("\nPlease answer the following questions:")
    prior_belief_adjustment = None

    for qid in sorted_qids:
        q_data = questions_map[qid]
        if q_data.get('is_prior_belief', False): # Q15 Handling
            print(f"\n{qid}: {q_data['text']} (Provides baseline intuition)")
            for key, val in q_data['options'].items(): print(f"  {key}. {val[0]}")
            while True:
                choice = input("Enter your choice (number): ")
                if choice in q_data['options']:
                    prior_belief_adjustment = q_data['options'][choice][1]
                    print(f" -> Baseline intuition noted (~{prior_belief_adjustment*100:.0f}% High/VH range). Not used in calculation.")
                    break
                else: print("Invalid choice.")
            continue

        # Standard Question
        if q_data['level'] > current_level:
            current_level = q_data['level']; print(f"\n--- LEVEL {current_level} ---")
        print(f"\n{qid}: {q_data['text']}")
        for key, val in q_data['options'].items(): print(f"  {key}. {val[0]}")

        while True:
            choice = input("Enter your choice (number): ")
            if choice in q_data['options']:
                chosen_text, chosen_state = q_data['options'][choice]
                node = q_data['node']
                if node not in STATES:
                    print(f"!! Internal Error: Node '{node}' map Q:{qid} not in STATES. Skip evidence.")
                    break
                if chosen_state not in STATES[node]:
                    print(f"!! Warn: State '{chosen_state}' map Q:{qid} inconsistent node '{node}' STATES: {STATES[node]}. Proceed.")

                user_evidence[node] = chosen_state
                print(f" -> Setting Evidence: {node} = {chosen_state}")

                # Intermediate feedback using CENTRAL estimate
                if initial_cpts: # Check CPTs valid
                    all_probs_updated = update_all_probabilities_manual(user_evidence, initial_cpts)
                    updated_prob_dist = all_probs_updated.get('P_doom_2035', {})
                    print("\n   Updated P(doom by 2035) Distribution (Approximate Ranges - Central Estimate):")
                    if updated_prob_dist and isinstance(updated_prob_dist, dict):
                        total_check = 0
                        for state in STATES['P_doom_2035']:
                            prob = updated_prob_dist.get(state, 0.0)
                            print(f"     P(Doom={state}) = {format_prob_range(prob)}")
                            total_check += prob
                        pdoom_high_vh = updated_prob_dist.get('High', 0.0) + updated_prob_dist.get('VeryHigh', 0.0)
                        print(f"   Current P(Doom=High or VeryHigh): {pdoom_high_vh * 100:.1f}% (point estimate)")
                        if abs(total_check - 1.0) > 0.01: print(f"   (Note: Sum {total_check:.3f})")
                    else: print("     Error: Could not calculate updated distribution.")
                else: print("     Skipping intermediate update due to invalid initial CPTs.")
                break # Question answered, move to next
            else: print("Invalid choice, please try again.")
    return user_evidence

# --- 7. Heuristic Calculation for Later Years ---

def get_most_likely_state(prob_dist):
    """Finds the state with the highest probability in a distribution."""
    if not prob_dist or not isinstance(prob_dist, dict):
        return None
    # Find the state with the maximum value (probability)
    return max(prob_dist, key=prob_dist.get)

def calculate_heuristic_pdoom(pdoom_start_percent, most_likely_timeline, target_year):
    """Applies heuristic rules to estimate P(doom) for 2050 or 2100."""
    if pdoom_start_percent is None: return None # Cannot calculate if starting point is missing

    timeline_mult = TIMELINE_MULTIPLIER.get(most_likely_timeline, TIMELINE_MULTIPLIER[DEFAULT_TIMELINE_FOR_HEURISTIC])

    pdoom_adjusted = pdoom_start_percent
    if target_year == 2050:
        increase = BASE_INCREASE_2050 * timeline_mult
        pdoom_adjusted += increase
    elif target_year == 2100:
        # Calculate 2050 increase first, then 2100 increase from that
        increase_to_2050 = BASE_INCREASE_2050 * timeline_mult
        increase_from_2050_to_2100 = BASE_INCREASE_2100 * timeline_mult
        pdoom_adjusted += (increase_to_2050 + increase_from_2050_to_2100)
    else:
        print(f"Warning: Unsupported target year for heuristic: {target_year}", file=sys.stderr)
        return pdoom_start_percent # Return original if year not recognized

    # Ensure probability is capped between 0 and 100
    return np.clip(pdoom_adjusted, 0.0, 100.0)


# --- 8. Final Results & Comparison ---

def display_final_results(user_evidence, cpts_c, cpts_o, cpts_p):
    """Calculates final results including sensitivity and heuristics, then displays."""
    print("\n" + "="*50)
    print("--- FINAL RESULT (Target Year 2035) ---")
    print("="*50)

    # --- Run 2035 Sensitivity Analysis ---
    pdoom_high_vh_central = None
    pdoom_high_vh_optimistic = None
    pdoom_high_vh_pessimistic = None
    final_probs_central = {} # Store central probabilities for heuristic input

    print(f"Calculating 2035 range using P(doom) CPT perturbation delta: +/- {PERTURBATION_DELTA*100:.0f}% points...")

    if cpts_c and isinstance(cpts_c, dict):
        print("Running central estimate...")
        final_probs_central = update_all_probabilities_manual(user_evidence, cpts_c)
        p_doom_dist_c = final_probs_central.get('P_doom_2035', {})
        if p_doom_dist_c and isinstance(p_doom_dist_c, dict):
            pdoom_high_vh_central = p_doom_dist_c.get('High', 0.0) + p_doom_dist_c.get('VeryHigh', 0.0)
        else: print("  Warning: Central estimate failed or returned invalid type.")
    else: print("  Warning: Central CPTs invalid. Skipping central estimate.")

    if cpts_o and isinstance(cpts_o, dict) and cpts_o != cpts_c: # Check if different from central
        print("Running optimistic estimate...")
        final_probs_o = update_all_probabilities_manual(user_evidence, cpts_o)
        p_doom_dist_o = final_probs_o.get('P_doom_2035', {})
        if p_doom_dist_o and isinstance(p_doom_dist_o, dict):
            pdoom_high_vh_optimistic = p_doom_dist_o.get('High', 0.0) + p_doom_dist_o.get('VeryHigh', 0.0)
        else: print("  Warning: Optimistic estimate failed or returned invalid type.")
    else: print("  Skipping optimistic estimate (CPTs invalid or same as central).")

    if cpts_p and isinstance(cpts_p, dict) and cpts_p != cpts_c: # Check if different from central
        print("Running pessimistic estimate...")
        final_probs_p = update_all_probabilities_manual(user_evidence, cpts_p)
        p_doom_dist_p = final_probs_p.get('P_doom_2035', {})
        if p_doom_dist_p and isinstance(p_doom_dist_p, dict):
            pdoom_high_vh_pessimistic = p_doom_dist_p.get('High', 0.0) + p_doom_dist_p.get('VeryHigh', 0.0)
        else: print("  Warning: Pessimistic estimate failed or returned invalid type.")
    else: print("  Skipping pessimistic estimate (CPTs invalid or same as central).")

    # --- Determine 2035 Bounds ---
    valid_results_2035 = []
    if pdoom_high_vh_central is not None: valid_results_2035.append(pdoom_high_vh_central)
    if pdoom_high_vh_optimistic is not None: valid_results_2035.append(pdoom_high_vh_optimistic)
    if pdoom_high_vh_pessimistic is not None: valid_results_2035.append(pdoom_high_vh_pessimistic)

    if not valid_results_2035:
        print("\nError: Could not calculate any valid P(doom by 2035) estimates.")
        final_pdoom_lower_2035 = 0.0
        final_pdoom_upper_2035 = 0.0
        central_point_2035_percent = 0.0
        timeline_state_for_heuristic = DEFAULT_TIMELINE_FOR_HEURISTIC # Fallback timeline
    else:
        final_pdoom_lower_2035 = min(valid_results_2035) * 100
        final_pdoom_upper_2035 = max(valid_results_2035) * 100
        central_point_2035_percent = (pdoom_high_vh_central * 100) if pdoom_high_vh_central is not None else (final_pdoom_lower_2035 + final_pdoom_upper_2035) / 2

        print("\nFinal P(doom by 2035) Estimate Range based on your answers:")
        print(f" -> Lower Bound (Optimistic Sensitivity): {final_pdoom_lower_2035:.1f}%")
        if pdoom_high_vh_central is not None:
             print(f" -> Central Estimate:                   {central_point_2035_percent:.1f}%")
        else:
             print(f" -> Central Estimate:                   (Calculation Failed, Midpoint Shown: {central_point_2035_percent:.1f}%)")
        print(f" -> Upper Bound (Pessimistic Sensitivity): {final_pdoom_upper_2035:.1f}%")
        print(f"\n   Suggesting a plausible 2035 range of: {final_pdoom_lower_2035:.0f}% - {final_pdoom_upper_2035:.0f}% for P(Doom=High or VeryHigh)")

        # --- Get Timeline for Heuristics ---
        timeline_dist = final_probs_central.get('Timeline', {})
        timeline_state_for_heuristic = get_most_likely_state(timeline_dist)
        if not timeline_state_for_heuristic:
            print(f"Warning: Could not determine most likely timeline. Using default '{DEFAULT_TIMELINE_FOR_HEURISTIC}' for heuristics.", file=sys.stderr)
            timeline_state_for_heuristic = DEFAULT_TIMELINE_FOR_HEURISTIC
        else:
            print(f"\n(Using most likely timeline '{timeline_state_for_heuristic}' for 2050/2100 heuristics)")

    # --- Calculate Heuristic Estimates for 2050 and 2100 ---
    print("\n" + "="*50)
    print("--- HEURISTIC ESTIMATES (2050 & 2100) ---")
    print("="*50)
    print("These are simple extrapolations based on the 2035 result and timeline.")

    # Calculate heuristic ranges
    pdoom_lower_2050 = calculate_heuristic_pdoom(final_pdoom_lower_2035, timeline_state_for_heuristic, 2050)
    pdoom_central_2050 = calculate_heuristic_pdoom(central_point_2035_percent, timeline_state_for_heuristic, 2050)
    pdoom_upper_2050 = calculate_heuristic_pdoom(final_pdoom_upper_2035, timeline_state_for_heuristic, 2050)

    pdoom_lower_2100 = calculate_heuristic_pdoom(final_pdoom_lower_2035, timeline_state_for_heuristic, 2100)
    pdoom_central_2100 = calculate_heuristic_pdoom(central_point_2035_percent, timeline_state_for_heuristic, 2100)
    pdoom_upper_2100 = calculate_heuristic_pdoom(final_pdoom_upper_2035, timeline_state_for_heuristic, 2100)

    # Display Heuristic Results
    if all(p is not None for p in [pdoom_lower_2050, pdoom_central_2050, pdoom_upper_2050]):
        print("\nHeuristic P(doom by 2050) Estimate Range:")
        print(f" -> Lower Bound:   ~{pdoom_lower_2050:.1f}%")
        print(f" -> Central Guess: ~{pdoom_central_2050:.1f}%")
        print(f" -> Upper Bound:   ~{pdoom_upper_2050:.1f}%")
        print(f"   Suggesting a plausible 2050 range of: {pdoom_lower_2050:.0f}% - {pdoom_upper_2050:.0f}%")
    else:
        print("\nCould not calculate heuristic P(doom by 2050) range.")

    if all(p is not None for p in [pdoom_lower_2100, pdoom_central_2100, pdoom_upper_2100]):
        print("\nHeuristic P(doom by 2100) Estimate Range:")
        print(f" -> Lower Bound:   ~{pdoom_lower_2100:.1f}%")
        print(f" -> Central Guess: ~{pdoom_central_2100:.1f}%")
        print(f" -> Upper Bound:   ~{pdoom_upper_2100:.1f}%")
        print(f"   Suggesting a plausible 2100 range of: {pdoom_lower_2100:.0f}% - {pdoom_upper_2100:.0f}%")
    else:
        print("\nCould not calculate heuristic P(doom by 2100) range.")


    # --- Expert Comparison ---
    print("\n" + "="*50)
    print("--- EXPERT COMPARISON ---")
    print("="*50)
    experts_data = load_real_experts(EXPERTS_CSV_PATH)
    if not experts_data:
         print("Could not load expert data for comparison.")
    else:
        # Compare 2035
        if pdoom_high_vh_central is not None:
            compare_expert('2035', central_point_2035_percent, experts_data)
        else:
            print("Skipping 2035 expert comparison (central estimate failed).")

        # Compare 2050 (Heuristic Central Guess)
        if pdoom_central_2050 is not None:
            compare_expert('2050', pdoom_central_2050, experts_data)
        else:
            print("Skipping 2050 expert comparison (heuristic calculation failed).")

        # Compare 2100 (Heuristic Central Guess)
        if pdoom_central_2100 is not None:
            compare_expert('2100', pdoom_central_2100, experts_data)
        else:
             print("Skipping 2100 expert comparison (heuristic calculation failed).")

    # --- Final Reminder ---
    print("\nReminder: The 2035 range results from sensitivity analysis on the final P(doom) CPT.")
    print("The 2050 and 2100 values are *heuristic estimates* based on simple rules,")
    print("not a full Bayesian network calculation for those years.")
    print("Accuracy depends on model structure, CPT calibration, and heuristic validity.")
    print("="*50)

def compare_expert(year_str, user_estimate_percent, experts_data):
     """Finds and prints the closest expert for a given year."""
     print(f"\nComparing your estimate for {year_str} ({user_estimate_percent:.1f}%) to experts:")
     col_name = f'pdoom_{year_str}_percent' # Construct column name like 'pdoom_2035_percent'

     valid_experts = [e for e in experts_data if safe_float(e.get(col_name)) is not None]

     if not valid_experts:
         print(f" -> No experts found with a valid estimate for {year_str} in the CSV.")
         return

     try:
         closest_expert = min(valid_experts, key=lambda x: abs(x[col_name] - user_estimate_percent))
         expert_val = closest_expert[col_name]
         print(f" -> Your {year_str} estimate is closest to {closest_expert['name']} (~{expert_val:.0f}%) based on available estimates.")
     except KeyError:
         print(f" -> Error: Column '{col_name}' likely missing or inconsistent in expert data during comparison.", file=sys.stderr)
     except Exception as e:
         print(f" -> An unexpected error occurred during expert comparison for {year_str}: {e}")


# --- Main execution ---
if __name__ == "__main__":
    # Perform quiz to get evidence
    user_evidence = run_quiz(CPTS_central)

    # Calculate and display final results including sensitivity and heuristics
    display_final_results(user_evidence, CPTS_central, CPTS_optimistic, CPTS_pessimistic)