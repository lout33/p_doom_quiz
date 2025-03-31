#!/usr/bin/env python3

# --- Manual Simplified Bayesian Network P(doom) Example - Expanded ---
# Recreates BN logic without pgmpy library.
# NOTE: Uses simplified forward-pass inference. CPTs loaded from JSON.
# MODIFIED: Target year changed to 2035. CPTs may need recalibration.
# MODIFIED: Displays final probability as a range based on simplified sensitivity analysis.
# ADDED: Heuristic calculation for P(doom) by 2050 and 2100 based on 2035 result and Timeline.
# ADDED: Text-based bar chart comparing user's 2035 estimate to expert spectrum.

import itertools
import csv
import os
import sys
import json
import copy
import numpy as np
import shutil # For getting terminal width

# --- Configuration ---
EXPERTS_CSV_PATH = 'experts_pdoom.csv'
CPTS_JSON_PATH = 'bn_cpts.json'
KEY_DELIMITER = '|'
PERTURBATION_DELTA = 0.10 # For sensitivity analysis on 2035 CPT

# --- Heuristic Configuration ---
BASE_INCREASE_2050 = 7.5
BASE_INCREASE_2100 = 12.5
TIMELINE_MULTIPLIER = {'Early': 0.6, 'Mid': 1.0, 'Late': 1.5}
DEFAULT_TIMELINE_FOR_HEURISTIC = 'Mid'

# --- Chart Configuration ---
CHART_BAR_CHAR = '█'
CHART_MAX_BAR_WIDTH_RATIO = 0.6 # Use 60% of terminal width for the bar itself
CHART_MIN_BAR_WIDTH = 30
CHART_LABEL_WIDTH_RATIO = 0.3 # Use 30% for labels
CHART_VALUE_SPACE = 6 # Space for printing the value (e.g., " 55.0%")

# --- Helper Functions ---
def safe_float(value, default=None):
    if value is None or value == '': return default
    try: return float(value)
    except (ValueError, TypeError): return default

def normalize_dist(dist):
    if not isinstance(dist, dict): return dist
    total = sum(dist.values())
    if total == 0:
        num_states = len(dist); return {k: 1.0 / num_states for k in dist} if num_states > 0 else dist
    return {k: v / total for k, v in dist.items()}

def format_prob_range(prob, delta=5):
    if prob is None: return "N/A"
    pct = prob * 100
    if pct < 0.01: return "< 1%"
    if pct > 99.99: return "> 99%"
    lower = max(0, round(pct) - delta)
    upper = min(100, round(pct) + delta)
    if lower == upper:
         if lower == 0: upper = min(100, lower + delta)
         elif upper == 100: lower = max(0, upper - delta)
         else: return f"approx. {lower:.0f}%"
    if lower >= upper: return f"approx. {round(pct):.0f}%"
    return f"{lower:.0f}% - {upper:.0f}%"

# --- 1. Define Simplified Expert Data ---
def load_real_experts(file_path):
    experts = []
    if not os.path.exists(file_path):
        print(f"Warning: Experts file not found at {file_path}", file=sys.stderr)
        return experts
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                name = row.get('Name')
                if not name: continue
                pdoom_2035 = safe_float(row.get('P_Doom_Estimate_By_2035_Percent'))
                pdoom_2050 = safe_float(row.get('P_Doom_Estimate_By_2050_Percent'))
                pdoom_2100 = safe_float(row.get('P_Doom_Estimate_By_2100_Percent'))
                if pdoom_2035 is not None or pdoom_2050 is not None or pdoom_2100 is not None:
                    experts.append({
                        'name': name,
                        'pdoom_2035_percent': pdoom_2035,
                        'pdoom_2050_percent': pdoom_2050,
                        'pdoom_2100_percent': pdoom_2100
                    })
    except Exception as e: print(f"Error loading experts file {file_path}: {e}", file=sys.stderr)
    if not experts: print(f"Warning: No valid expert data loaded from {file_path}.", file=sys.stderr)
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
    'Timeline': ['Early', 'Mid', 'Late'], 'Coordination': ['Good', 'Med', 'Poor'],
    'Interpretability': ['Good', 'Med', 'Poor'], 'MisusePotential': ['Low', 'Med', 'High'],
    'AlignmentSolvability': ['Easy', 'Med', 'Hard'], 'Competition': ['Low', 'Med', 'High'],
    'WarningShot': ['Low', 'Med', 'High'], 'Regulation': ['High', 'Med', 'Low'],
    'DeceptionRisk': ['Low', 'Med', 'High'], 'SelfReplication': ['Low', 'Med', 'High'],
    'ControlLossRisk': ['Low', 'Med', 'High'], 'PowerConcentration': ['Low', 'Med', 'High'],
    'P_doom_2035': ['Low', 'Medium', 'High', 'VeryHigh']
}

# --- 3. Load CPTs from JSON File ---
def load_cpts_from_json(json_path, parents_map, delimiter):
    # [Function unchanged from previous version]
    print(f"Loading CPTs from {json_path}...")
    if not os.path.exists(json_path):
        print(f"Error: CPTs file not found at {json_path}", file=sys.stderr); return None
    try:
        with open(json_path, 'r', encoding='utf-8') as f: raw_cpts = json.load(f)
    except Exception as e: print(f"Error reading/parsing {json_path}: {e}", file=sys.stderr); return None

    reconstructed_cpts = {}; nodes_processed = set()
    for node_name, node_data in raw_cpts.items():
        nodes_processed.add(node_name)
        if node_name not in parents_map: continue # Skip unknown node
        parent_nodes = parents_map.get(node_name, [])
        if not parent_nodes: # Prior
            if isinstance(node_data, dict): reconstructed_cpts[node_name] = node_data
        else: # Conditional
            if not isinstance(node_data, dict): continue # Skip invalid format
            converted_conditional_cpt = {}
            num_expected_parents = len(parent_nodes)
            for joined_key, child_distribution in node_data.items():
                parent_states_list = joined_key.split(delimiter)
                if len(parent_states_list) != num_expected_parents: continue # Skip mismatched key
                tuple_key = tuple(parent_states_list)
                if isinstance(child_distribution, dict):
                    converted_conditional_cpt[tuple_key] = child_distribution
            reconstructed_cpts[node_name] = converted_conditional_cpt

    missing_nodes = set(parents_map.keys()) - nodes_processed
    if missing_nodes: print(f"Warning: Nodes in PARENTS but not in JSON: {missing_nodes}", file=sys.stderr)
    print(f"Successfully loaded CPTs for {len(reconstructed_cpts)} nodes found in JSON.")
    return reconstructed_cpts

# --- Load the CPTs ---
LOADED_CPTS = load_cpts_from_json(CPTS_JSON_PATH, PARENTS, KEY_DELIMITER)
if LOADED_CPTS is None: sys.exit("Exiting due to CPT loading failure.")

# --- Perturbation Helper Function ---
def perturb_distribution(dist, delta, pessimistic=True):
    # [Function unchanged from previous version]
    is_pdoom_node = list(dist.keys()) == STATES['P_doom_2035']
    if not is_pdoom_node: return dist
    new_dist = dist.copy(); states_ordered = STATES['P_doom_2035']
    shift_per_state_pair = delta / 2.0
    if pessimistic:
        take_from_low = min(new_dist.get('Low',0), shift_per_state_pair)
        take_from_med = min(new_dist.get('Medium',0), shift_per_state_pair)
        total_taken = take_from_low + take_from_med
        new_dist['Low'] = new_dist.get('Low', 0) - take_from_low
        new_dist['Medium'] = new_dist.get('Medium', 0) - take_from_med
        add_to_high = total_taken / 2.0; add_to_vh = total_taken / 2.0
        new_dist['High'] = new_dist.get('High', 0) + add_to_high
        new_dist['VeryHigh'] = new_dist.get('VeryHigh', 0) + add_to_vh
    else: # Optimistic
        take_from_high = min(new_dist.get('High',0), shift_per_state_pair)
        take_from_vh = min(new_dist.get('VeryHigh',0), shift_per_state_pair)
        total_taken = take_from_high + take_from_vh
        new_dist['High'] = new_dist.get('High', 0) - take_from_high
        new_dist['VeryHigh'] = new_dist.get('VeryHigh', 0) - take_from_vh
        add_to_low = total_taken / 2.0; add_to_med = total_taken / 2.0
        new_dist['Low'] = new_dist.get('Low', 0) + add_to_low
        new_dist['Medium'] = new_dist.get('Medium', 0) + add_to_med
    for state in states_ordered: new_dist[state] = np.clip(new_dist.get(state, 0), 0, 1)
    return normalize_dist(new_dist)

# --- Create Perturbed CPTs based on Loaded Data ---
CPTS_central = LOADED_CPTS
CPTS_optimistic = copy.deepcopy(LOADED_CPTS)
CPTS_pessimistic = copy.deepcopy(LOADED_CPTS)
target_node_for_perturbation = 'P_doom_2035'
# [Perturbation logic unchanged from previous version - applies perturbation if possible]
if target_node_for_perturbation in CPTS_central and isinstance(CPTS_central[target_node_for_perturbation], dict):
    print(f"Perturbing CPT for node: {target_node_for_perturbation}")
    original_pdoom_cpt = CPTS_central[target_node_for_perturbation]
    perturbed_pdoom_optimistic = {}
    perturbed_pdoom_pessimistic = {}
    for condition, dist in original_pdoom_cpt.items():
         if isinstance(condition, tuple) and isinstance(dist, dict):
              norm_dist = normalize_dist(dist)
              perturbed_pdoom_optimistic[condition] = perturb_distribution(norm_dist, PERTURBATION_DELTA, pessimistic=False)
              perturbed_pdoom_pessimistic[condition] = perturb_distribution(norm_dist, PERTURBATION_DELTA, pessimistic=True)
         else: perturbed_pdoom_optimistic[condition] = dist; perturbed_pdoom_pessimistic[condition] = dist # Keep original if format wrong
    CPTS_optimistic[target_node_for_perturbation] = perturbed_pdoom_optimistic
    CPTS_pessimistic[target_node_for_perturbation] = perturbed_pdoom_pessimistic
else:
    print(f"Warning: Cannot perturb '{target_node_for_perturbation}'. Sensitivity range will be based on central estimate only.", file=sys.stderr)
    CPTS_optimistic = CPTS_central; CPTS_pessimistic = CPTS_central # Fallback

# --- 4. Simplified Inference Logic ---
def calculate_marginal_manual(node, evidence, current_probabilities, all_cpts):
    # [Function unchanged internally from previous version - includes robustness checks]
    if node in evidence:
        if node not in STATES: return {}; dist = {state: 0.0 for state in STATES[node]}; dist[evidence[node]] = 1.0; return dist
    parent_nodes = PARENTS.get(node, [])
    if not parent_nodes: # Root
        if node not in all_cpts: print(f"Error: Prior CPT missing '{node}'. Uniform.", file=sys.stderr); node_states = STATES.get(node, []); return {s: 1./len(node_states) for s in node_states} if node_states else {}
        prior = all_cpts.get(node, {}); return normalize_dist(prior) if isinstance(prior, dict) else {}
    # Conditional
    node_states = STATES.get(node); node_dist = {state: 0.0 for state in node_states} if node_states else {}
    if not node_states: return node_dist
    cpt = all_cpts.get(node)
    if not cpt or not isinstance(cpt, dict): print(f"Error: CPT missing/invalid '{node}'.", file=sys.stderr); return node_dist
    parent_states_list = [STATES.get(p_node) for p_node in parent_nodes]
    if not all(parent_states_list): return node_dist
    parent_state_combinations = list(itertools.product(*parent_states_list))
    for parent_combo in parent_state_combinations:
        prob_parents = 1.0; valid_combo = True; parent_key_tuple = tuple(parent_combo)
        for i, p_node in enumerate(parent_nodes):
            parent_state = parent_combo[i]; parent_prob_dist = current_probabilities.get(p_node)
            if parent_prob_dist is None or not isinstance(parent_prob_dist, dict): valid_combo = False; break
            prob_parents *= parent_prob_dist.get(parent_state, 0.0)
        if not valid_combo or prob_parents == 0: continue
        cond_dist = cpt.get(parent_key_tuple)
        if cond_dist is None or not isinstance(cond_dist, dict): continue
        norm_cond_dist = normalize_dist(cond_dist)
        for node_state in node_states: node_dist[node_state] += norm_cond_dist.get(node_state, 0.0) * prob_parents
    return normalize_dist(node_dist)

def update_all_probabilities_manual(evidence, master_cpt_dict):
    # [Function unchanged internally from previous version - includes robustness checks]
    calculation_order = [
        'Timeline', 'Coordination', 'Interpretability', 'MisusePotential', 'AlignmentSolvability',
        'Competition', 'WarningShot', 'SelfReplication', 'Regulation', 'DeceptionRisk',
        'PowerConcentration', 'ControlLossRisk', 'P_doom_2035'
    ]
    current_probabilities = {}
    if not master_cpt_dict or not isinstance(master_cpt_dict, dict): print("Error: Invalid master_cpt_dict.", file=sys.stderr); return {}
    for node in calculation_order:
        if node not in master_cpt_dict and node not in evidence:
            print(f"Crit Warn: Node '{node}' missing CPTs/evidence. Uniform.", file=sys.stderr)
            node_states = STATES.get(node, []); current_probabilities[node] = {s: 1./len(node_states) for s in node_states} if node_states else {}; continue
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
    # [Function unchanged internally from previous version]
    user_evidence = {}; current_level = 0
    print("\n" + "="*50 + "\n--- AI Risk Assessment (Manual BN Simulation - Target 2035) ---\n" + "="*50)
    print("NOTE: Probabilities loaded from JSON. Includes sensitivity range & heuristics.")
    if initial_cpts and isinstance(initial_cpts, dict):
        all_probs_initial = update_all_probabilities_manual({}, initial_cpts)
        initial_prob_dist = all_probs_initial.get('P_doom_2035', {})
        print("\nInitial Estimated P(doom by 2035) Distribution (Approx Ranges):")
        if initial_prob_dist and isinstance(initial_prob_dist, dict):
            pdoom_sum_check = 0.0
            for state in STATES['P_doom_2035']: prob = initial_prob_dist.get(state, 0.0); print(f"  P(Doom={state}) = {format_prob_range(prob)}"); pdoom_sum_check += prob
            initial_pdoom_high_vh = initial_prob_dist.get('High', 0.0) + initial_prob_dist.get('VeryHigh', 0.0)
            print(f"Initial P(Doom=High or VeryHigh): {initial_pdoom_high_vh * 100:.1f}% (point estimate)")
        else: print("  Error: Could not calculate initial distribution.")
    else: print("Error: Central CPTs invalid. Cannot show initial state.", file=sys.stderr)
    print("\nPlease answer the following questions:")
    for qid in sorted_qids:
        q_data = questions_map[qid]
        if q_data.get('is_prior_belief', False): continue # Skip prior belief Q display here
        if q_data['level'] > current_level: current_level = q_data['level']; print(f"\n--- LEVEL {current_level} ---")
        print(f"\n{qid}: {q_data['text']}")
        for key, val in q_data['options'].items(): print(f"  {key}. {val[0]}")
        while True:
            choice = input("Enter your choice (number): ")
            if choice in q_data['options']:
                chosen_text, chosen_state = q_data['options'][choice]; node = q_data['node']
                if node not in STATES or chosen_state not in STATES[node]: print(f"!! Warn: Inconsistent state/node map Q:{qid}. Proceed.")
                user_evidence[node] = chosen_state; print(f" -> Setting Evidence: {node} = {chosen_state}")
                if initial_cpts: # Intermediate feedback
                    all_probs_updated = update_all_probabilities_manual(user_evidence, initial_cpts)
                    updated_prob_dist = all_probs_updated.get('P_doom_2035', {})
                    print("\n   Updated P(doom by 2035) (Approx Ranges - Central Est.):")
                    if updated_prob_dist and isinstance(updated_prob_dist, dict):
                        for state in STATES['P_doom_2035']: print(f"     P(Doom={state}) = {format_prob_range(updated_prob_dist.get(state, 0.0))}")
                        pdoom_high_vh = updated_prob_dist.get('High', 0.0) + updated_prob_dist.get('VeryHigh', 0.0)
                        print(f"   Current P(Doom=High or VeryHigh): {pdoom_high_vh * 100:.1f}% (point estimate)")
                    else: print("     Error calculating updated distribution.")
                break
            else: print("Invalid choice.")
    return user_evidence

# --- 7. Heuristic Calculation & Helpers ---
def get_most_likely_state(prob_dist):
    if not prob_dist or not isinstance(prob_dist, dict): return None
    return max(prob_dist, key=prob_dist.get)

def calculate_heuristic_pdoom(pdoom_start_percent, most_likely_timeline, target_year):
    # [Function unchanged from previous version]
    if pdoom_start_percent is None: return None
    timeline_mult = TIMELINE_MULTIPLIER.get(most_likely_timeline, TIMELINE_MULTIPLIER[DEFAULT_TIMELINE_FOR_HEURISTIC])
    pdoom_adjusted = pdoom_start_percent
    if target_year == 2050: pdoom_adjusted += (BASE_INCREASE_2050 * timeline_mult)
    elif target_year == 2100: pdoom_adjusted += ((BASE_INCREASE_2050 + BASE_INCREASE_2100) * timeline_mult) # Simple cumulative addition
    else: return pdoom_start_percent # Unknown year
    return np.clip(pdoom_adjusted, 0.0, 100.0)

# --- 8. Text-Based Chart Visualization ---
def display_text_comparison_chart(year_str, user_estimate_percent, experts_data):
    """Generates and prints a simple text-based bar chart comparing user to experts."""
    print(f"\n--- Comparison Chart: P(doom) by {year_str} ---")
    col_name = f'pdoom_{year_str}_percent' # e.g., pdoom_2035_percent

    # Filter experts with valid data for the specific year
    valid_experts = [{'name': e['name'], 'value': e[col_name]}
                     for e in experts_data if safe_float(e.get(col_name)) is not None]

    if user_estimate_percent is None:
        print("Cannot display chart: User estimate is not available.")
        return
    if not valid_experts:
        print(f"No expert data available for {year_str} to display chart.")
        return

    # Add user data
    chart_data = valid_experts + [{'name': "YOUR ESTIMATE", 'value': user_estimate_percent}]

    # Sort by value
    chart_data.sort(key=lambda x: x['value'])

    # Determine chart dimensions based on terminal size
    try:
        term_width = shutil.get_terminal_size((80, 24)).columns # Default 80 if failed
    except Exception:
        term_width = 80
        print("Warning: Could not get terminal width, using default 80.", file=sys.stderr)

    max_label_width = int(term_width * CHART_LABEL_WIDTH_RATIO)
    max_bar_portion_width = int(term_width * CHART_MAX_BAR_WIDTH_RATIO)
    available_bar_width = max(CHART_MIN_BAR_WIDTH, max_bar_portion_width - CHART_VALUE_SPACE)

    # Find max value for scaling (cap at 100 for pdoom %)
    max_val = 100.0 # max(item['value'] for item in chart_data) -- P(doom) capped at 100
    scale = available_bar_width / max_val if max_val > 0 else 0

    # Find max name length for padding (truncated if too long)
    max_name_len = 0
    for item in chart_data:
        max_name_len = max(max_name_len, len(item['name']))
    max_name_len = min(max_name_len, max_label_width) # Truncate labels if needed

    # Print chart rows
    for item in chart_data:
        name = item['name']
        value = item['value']
        bar_len = int(round(value * scale))
        bar = CHART_BAR_CHAR * bar_len

        # Truncate name if necessary
        display_name = (name[:max_name_len-1] + '…') if len(name) > max_name_len else name

        # Prepare row string with padding
        row = f"{display_name:<{max_name_len}} |{bar:<{available_bar_width}} {value:>5.1f}%"

        # Highlight user's row
        if name == "YOUR ESTIMATE":
            # Simple highlight by adding markers (could use ANSI colors if desired)
            row += "   <<<<< YOU"

        print(row)

    print("-" * (max_name_len + 1 + available_bar_width + CHART_VALUE_SPACE))

# --- 9. Final Results & Comparison ---
def display_final_results(user_evidence, cpts_c, cpts_o, cpts_p):
    # [Function structure mostly unchanged from previous version]
    # [Calls the new display_text_comparison_chart function]
    print("\n" + "="*50 + "\n--- FINAL RESULT (Target Year 2035) ---\n" + "="*50)
    pdoom_high_vh_central = None; pdoom_high_vh_optimistic = None; pdoom_high_vh_pessimistic = None
    final_probs_central = {}

    print(f"Calculating 2035 range using P(doom) CPT perturbation delta: +/- {PERTURBATION_DELTA*100:.0f}% points...")
    if cpts_c and isinstance(cpts_c, dict):
        print("Running central estimate..."); final_probs_central = update_all_probabilities_manual(user_evidence, cpts_c)
        p_doom_dist_c = final_probs_central.get('P_doom_2035', {})
        if p_doom_dist_c and isinstance(p_doom_dist_c, dict): pdoom_high_vh_central = p_doom_dist_c.get('High', 0.0) + p_doom_dist_c.get('VeryHigh', 0.0)
    if cpts_o and isinstance(cpts_o, dict) and cpts_o != cpts_c:
        print("Running optimistic estimate..."); final_probs_o = update_all_probabilities_manual(user_evidence, cpts_o)
        p_doom_dist_o = final_probs_o.get('P_doom_2035', {})
        if p_doom_dist_o and isinstance(p_doom_dist_o, dict): pdoom_high_vh_optimistic = p_doom_dist_o.get('High', 0.0) + p_doom_dist_o.get('VeryHigh', 0.0)
    if cpts_p and isinstance(cpts_p, dict) and cpts_p != cpts_c:
        print("Running pessimistic estimate..."); final_probs_p = update_all_probabilities_manual(user_evidence, cpts_p)
        p_doom_dist_p = final_probs_p.get('P_doom_2035', {})
        if p_doom_dist_p and isinstance(p_doom_dist_p, dict): pdoom_high_vh_pessimistic = p_doom_dist_p.get('High', 0.0) + p_doom_dist_p.get('VeryHigh', 0.0)

    valid_results_2035 = [p for p in [pdoom_high_vh_central, pdoom_high_vh_optimistic, pdoom_high_vh_pessimistic] if p is not None]
    if not valid_results_2035:
        print("\nError: Could not calculate valid P(doom by 2035) estimates.")
        final_pdoom_lower_2035, final_pdoom_upper_2035, central_point_2035_percent = 0.0, 0.0, 0.0
        timeline_state_for_heuristic = DEFAULT_TIMELINE_FOR_HEURISTIC
    else:
        final_pdoom_lower_2035 = min(valid_results_2035) * 100
        final_pdoom_upper_2035 = max(valid_results_2035) * 100
        # Use the calculated central point estimate if available, otherwise use the midpoint of the range
        central_point_2035_percent = (pdoom_high_vh_central * 100) if pdoom_high_vh_central is not None else (final_pdoom_lower_2035 + final_pdoom_upper_2035) / 2
        print("\nFinal P(doom by 2035) Estimate Range:"); print(f" -> Lower: {final_pdoom_lower_2035:.1f}%"); print(f" -> Central: {central_point_2035_percent:.1f}%" + ("" if pdoom_high_vh_central is not None else " (Midpoint)")); print(f" -> Upper: {final_pdoom_upper_2035:.1f}%")
        print(f"\n   Suggesting 2035 range: {final_pdoom_lower_2035:.0f}% - {final_pdoom_upper_2035:.0f}% (P(Doom=High/VH))")
        timeline_dist = final_probs_central.get('Timeline', {}); timeline_state_for_heuristic = get_most_likely_state(timeline_dist) or DEFAULT_TIMELINE_FOR_HEURISTIC
        if timeline_dist: print(f"\n(Using most likely timeline '{timeline_state_for_heuristic}' for heuristics)")

    # --- Calculate & Display Heuristics ---
    print("\n" + "="*50 + "\n--- HEURISTIC ESTIMATES (2050 & 2100) ---\n" + "="*50)
    pdoom_lower_2050 = calculate_heuristic_pdoom(final_pdoom_lower_2035, timeline_state_for_heuristic, 2050)
    pdoom_central_2050 = calculate_heuristic_pdoom(central_point_2035_percent, timeline_state_for_heuristic, 2050)
    pdoom_upper_2050 = calculate_heuristic_pdoom(final_pdoom_upper_2035, timeline_state_for_heuristic, 2050)
    pdoom_lower_2100 = calculate_heuristic_pdoom(final_pdoom_lower_2035, timeline_state_for_heuristic, 2100)
    pdoom_central_2100 = calculate_heuristic_pdoom(central_point_2035_percent, timeline_state_for_heuristic, 2100)
    pdoom_upper_2100 = calculate_heuristic_pdoom(final_pdoom_upper_2035, timeline_state_for_heuristic, 2100)
    if all(p is not None for p in [pdoom_lower_2050, pdoom_central_2050, pdoom_upper_2050]):
        print("\nHeuristic P(doom by 2050) Estimate Range:"); print(f" -> Lower: ~{pdoom_lower_2050:.1f}%"); print(f" -> Central: ~{pdoom_central_2050:.1f}%"); print(f" -> Upper: ~{pdoom_upper_2050:.1f}%"); print(f"   Suggesting 2050 range: {pdoom_lower_2050:.0f}% - {pdoom_upper_2050:.0f}%")
    else:
        print("\nHeuristic P(doom by 2050) Estimate Range: Could not be calculated.") # Handle case where calculation failed

    if all(p is not None for p in [pdoom_lower_2100, pdoom_central_2100, pdoom_upper_2100]):
        print("\nHeuristic P(doom by 2100) Estimate Range:"); print(f" -> Lower: ~{pdoom_lower_2100:.1f}%"); print(f" -> Central: ~{pdoom_central_2100:.1f}%"); print(f" -> Upper: ~{pdoom_upper_2100:.1f}%"); print(f"   Suggesting 2100 range: {pdoom_lower_2100:.0f}% - {pdoom_upper_2100:.0f}%")
    else:
        print("\nHeuristic P(doom by 2100) Estimate Range: Could not be calculated.") # Handle case where calculation failed


    # --- Expert Comparison & Charts ---
    print("\n" + "="*50 + "\n--- EXPERT COMPARISON ---\n" + "="*50)
    experts_data = load_real_experts(EXPERTS_CSV_PATH)
    if not experts_data: print("Could not load expert data.")
    else:
        # --- Display 2035 Chart ---
        # Pass the central point estimate (either directly calculated or midpoint)
        display_text_comparison_chart('2035', central_point_2035_percent, experts_data)

        # --- Display 2050 Chart ---
        # Pass the central heuristic estimate for 2050
        display_text_comparison_chart('2050', pdoom_central_2050, experts_data)

        # --- Display 2100 Chart ---
        # Pass the central heuristic estimate for 2100
        display_text_comparison_chart('2100', pdoom_central_2100, experts_data)

        # --- Compare point estimates (closest expert) ---
        # Compare 2035 (using the central estimate)
        if pdoom_high_vh_central is not None: # Only compare if we had a direct central calculation
             compare_expert('2035', central_point_2035_percent, experts_data)
        elif central_point_2035_percent > 0: # If we only have the range midpoint, compare that if non-zero
             print(f"\nComparing your estimate range midpoint for 2035 ({central_point_2035_percent:.1f}%) to closest expert:")
             compare_expert('2035', central_point_2035_percent, experts_data)

        # Compare 2050 (using the central heuristic)
        if pdoom_central_2050 is not None:
            compare_expert('2050', pdoom_central_2050, experts_data)

        # Compare 2100 (using the central heuristic)
        if pdoom_central_2100 is not None:
            compare_expert('2100', pdoom_central_2100, experts_data)

    print("\nReminder: 2035 range uses sensitivity analysis. 2050/2100 are heuristics based on 2035.")
    print("Accuracy depends on model, CPTs, and heuristic validity.")
    print("="*50)

# --- compare_expert function (ensure it handles different years - already does) ---
def compare_expert(year_str, user_estimate_percent, experts_data):
     # Add check for None user estimate
     if user_estimate_percent is None:
         print(f" -> Cannot compare for {year_str}, user estimate is not available.")
         return

     print(f"\nComparing your estimate for {year_str} ({user_estimate_percent:.1f}%) to closest expert:")
     col_name = f'pdoom_{year_str}_percent'
     valid_experts = [{'name': e['name'], col_name: e[col_name]} for e in experts_data if safe_float(e.get(col_name)) is not None]
     if not valid_experts: print(f" -> No experts found with valid estimate for {year_str}."); return
     try:
         closest_expert = min(valid_experts, key=lambda x: abs(x[col_name] - user_estimate_percent))
         expert_val = closest_expert[col_name]
         print(f" -> Your {year_str} estimate is closest to {closest_expert['name']} (~{expert_val:.0f}%)")
     except Exception as e: print(f" -> Error during comparison for {year_str}: {e}")

# --- Main execution ---
if __name__ == "__main__":
    user_evidence = run_quiz(CPTS_central)
    display_final_results(user_evidence, CPTS_central, CPTS_optimistic, CPTS_pessimistic)