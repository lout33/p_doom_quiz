#!/usr/bin/env python3

import json
import os
import sys

# --- Configuration ---
OUTPUT_JSON_PATH = 'bn_cpts.json'
KEY_DELIMITER = '|' # Delimiter for joining parent states in JSON keys

# --- Network Structure (Needed to identify priors vs conditionals) ---
# Copy this from your main script (vanilla_bn.py)
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

# --- Node States (Optional but useful for context/validation if extended) ---
# Copy this from your main script (vanilla_bn.py)
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


# --- SOURCE CPT Data ---
# This dictionary holds the probability tables before JSON export.
# Modifications are primarily focused on P_doom_2035 based on feedback.
CPTS_SOURCE = {}

# Priors (Unchanged)
CPTS_SOURCE['Timeline'] = {'Early': 0.3, 'Mid': 0.4, 'Late': 0.3}
CPTS_SOURCE['Coordination'] = {'Good': 0.2, 'Med': 0.4, 'Poor': 0.4}
CPTS_SOURCE['Interpretability'] = {'Good': 0.2, 'Med': 0.5, 'Poor': 0.3}
CPTS_SOURCE['MisusePotential'] = {'Low': 0.3, 'Med': 0.4, 'High': 0.3}

# Conditionals (Unchanged, except for P_doom_2035)
CPTS_SOURCE['AlignmentSolvability'] = {
    ('Early', 'Good'): {'Easy': 0.1, 'Med': 0.3, 'Hard': 0.6}, ('Early', 'Med'): {'Easy': 0.1, 'Med': 0.2, 'Hard': 0.7}, ('Early', 'Poor'): {'Easy': 0.05, 'Med': 0.15, 'Hard': 0.8},
    ('Mid', 'Good'): {'Easy': 0.2, 'Med': 0.4, 'Hard': 0.4}, ('Mid', 'Med'): {'Easy': 0.2, 'Med': 0.3, 'Hard': 0.5}, ('Mid', 'Poor'): {'Easy': 0.15, 'Med': 0.25, 'Hard': 0.6},
    ('Late', 'Good'): {'Easy': 0.3, 'Med': 0.5, 'Hard': 0.2}, ('Late', 'Med'): {'Easy': 0.3, 'Med': 0.4, 'Hard': 0.3}, ('Late', 'Poor'): {'Easy': 0.3, 'Med': 0.3, 'Hard': 0.4},
}
CPTS_SOURCE['Competition'] = {
    ('Good',): {'Low': 0.4, 'Med': 0.4, 'High': 0.2}, ('Med',): {'Low': 0.2, 'Med': 0.3, 'High': 0.5}, ('Poor',): {'Low': 0.05, 'Med': 0.15, 'High': 0.8},
}
CPTS_SOURCE['WarningShot'] = {
    ('Good',): {'Low': 0.4, 'Med': 0.4, 'High': 0.2}, ('Med',): {'Low': 0.2, 'Med': 0.4, 'High': 0.4}, ('Poor',): {'Low': 0.1, 'Med': 0.3, 'High': 0.6},
}
CPTS_SOURCE['Regulation'] = {
    ('Good', 'Low', 'Low'): {'High': 0.8, 'Med': 0.15, 'Low': 0.05}, ('Good', 'Low', 'Med'): {'High': 0.85, 'Med': 0.1, 'Low': 0.05}, ('Good', 'Low', 'High'): {'High': 0.9, 'Med': 0.08, 'Low': 0.02},
    ('Good', 'Med', 'Low'): {'High': 0.7, 'Med': 0.2, 'Low': 0.1}, ('Good', 'Med', 'Med'): {'High': 0.75, 'Med': 0.15, 'Low': 0.1}, ('Good', 'Med', 'High'): {'High': 0.8, 'Med': 0.12, 'Low': 0.08},
    ('Good', 'High', 'Low'): {'High': 0.5, 'Med': 0.3, 'Low': 0.2}, ('Good', 'High', 'Med'): {'High': 0.55, 'Med': 0.25, 'Low': 0.2}, ('Good', 'High', 'High'): {'High': 0.6, 'Med': 0.25, 'Low': 0.15},
    ('Med', 'Low', 'Low'): {'High': 0.5, 'Med': 0.3, 'Low': 0.2}, ('Med', 'Low', 'Med'): {'High': 0.55, 'Med': 0.3, 'Low': 0.15}, ('Med', 'Low', 'High'): {'High': 0.6, 'Med': 0.25, 'Low': 0.15},
    ('Med', 'Med', 'Low'): {'High': 0.3, 'Med': 0.4, 'Low': 0.3}, ('Med', 'Med', 'Med'): {'High': 0.35, 'Med': 0.4, 'Low': 0.25}, ('Med', 'Med', 'High'): {'High': 0.4, 'Med': 0.35, 'Low': 0.25},
    ('Med', 'High', 'Low'): {'High': 0.1, 'Med': 0.4, 'Low': 0.5}, ('Med', 'High', 'Med'): {'High': 0.15, 'Med': 0.35, 'Low': 0.5}, ('Med', 'High', 'High'): {'High': 0.2, 'Med': 0.35, 'Low': 0.45},
    ('Poor', 'Low', 'Low'): {'High': 0.2, 'Med': 0.4, 'Low': 0.4}, ('Poor', 'Low', 'Med'): {'High': 0.25, 'Med': 0.4, 'Low': 0.35}, ('Poor', 'Low', 'High'): {'High': 0.3, 'Med': 0.35, 'Low': 0.35},
    ('Poor', 'Med', 'Low'): {'High': 0.1, 'Med': 0.3, 'Low': 0.6}, ('Poor', 'Med', 'Med'): {'High': 0.15, 'Med': 0.3, 'Low': 0.55}, ('Poor', 'Med', 'High'): {'High': 0.2, 'Med': 0.25, 'Low': 0.55},
    ('Poor', 'High', 'Low'): {'High': 0.02, 'Med': 0.18, 'Low': 0.8}, ('Poor', 'High', 'Med'): {'High': 0.05, 'Med': 0.15, 'Low': 0.8}, ('Poor', 'High', 'High'): {'High': 0.1, 'Med': 0.15, 'Low': 0.75},
}
CPTS_SOURCE['DeceptionRisk'] = {
    ('Easy',): {'Low': 0.6, 'Med': 0.3, 'High': 0.1}, ('Med',): {'Low': 0.2, 'Med': 0.4, 'High': 0.4}, ('Hard',): {'Low': 0.1, 'Med': 0.2, 'High': 0.7},
}
CPTS_SOURCE['SelfReplication'] = {
    ('Early',): {'Low': 0.1, 'Med': 0.3, 'High': 0.6}, ('Mid',): {'Low': 0.3, 'Med': 0.4, 'High': 0.3}, ('Late',): {'Low': 0.6, 'Med': 0.3, 'High': 0.1},
}
CPTS_SOURCE['PowerConcentration'] = {
    ('Low',): {'Low': 0.4, 'Med': 0.4, 'High': 0.2}, ('Med',): {'Low': 0.2, 'Med': 0.4, 'High': 0.4}, ('High',): {'Low': 0.1, 'Med': 0.3, 'High': 0.6},
}
CPTS_SOURCE['ControlLossRisk'] = {
    ('Early', 'Low', 'Low'): {'Low': 0.35, 'Med': 0.40, 'High': 0.25}, ('Early', 'Low', 'Med'): {'Low': 0.25, 'Med': 0.40, 'High': 0.35}, ('Early', 'Low', 'High'): {'Low': 0.10, 'Med': 0.30, 'High': 0.60},
    ('Early', 'Med', 'Low'): {'Low': 0.20, 'Med': 0.40, 'High': 0.40}, ('Early', 'Med', 'Med'): {'Low': 0.15, 'Med': 0.35, 'High': 0.50}, ('Early', 'Med', 'High'): {'Low': 0.05, 'Med': 0.25, 'High': 0.70},
    ('Early', 'High', 'Low'): {'Low': 0.10, 'Med': 0.30, 'High': 0.60}, ('Early', 'High', 'Med'): {'Low': 0.05, 'Med': 0.25, 'High': 0.70}, ('Early', 'High', 'High'): {'Low': 0.02, 'Med': 0.18, 'High': 0.80},
    ('Mid', 'Low', 'Low'): {'Low': 0.50, 'Med': 0.35, 'High': 0.15}, ('Mid', 'Low', 'Med'): {'Low': 0.40, 'Med': 0.35, 'High': 0.25}, ('Mid', 'Low', 'High'): {'Low': 0.20, 'Med': 0.30, 'High': 0.50},
    ('Mid', 'Med', 'Low'): {'Low': 0.40, 'Med': 0.35, 'High': 0.25}, ('Mid', 'Med', 'Med'): {'Low': 0.30, 'Med': 0.35, 'High': 0.35}, ('Mid', 'Med', 'High'): {'Low': 0.15, 'Med': 0.30, 'High': 0.55},
    ('Mid', 'High', 'Low'): {'Low': 0.30, 'Med': 0.30, 'High': 0.40}, ('Mid', 'High', 'Med'): {'Low': 0.20, 'Med': 0.30, 'High': 0.50}, ('Mid', 'High', 'High'): {'Low': 0.10, 'Med': 0.25, 'High': 0.65},
    ('Late', 'Low', 'Low'): {'Low': 0.70, 'Med': 0.25, 'High': 0.05}, ('Late', 'Low', 'Med'): {'Low': 0.60, 'Med': 0.25, 'High': 0.15}, ('Late', 'Low', 'High'): {'Low': 0.40, 'Med': 0.30, 'High': 0.30},
    ('Late', 'Med', 'Low'): {'Low': 0.60, 'Med': 0.25, 'High': 0.15}, ('Late', 'Med', 'Med'): {'Low': 0.50, 'Med': 0.30, 'High': 0.20}, ('Late', 'Med', 'High'): {'Low': 0.30, 'Med': 0.35, 'High': 0.35},
    ('Late', 'High', 'Low'): {'Low': 0.50, 'Med': 0.25, 'High': 0.25}, ('Late', 'High', 'Med'): {'Low': 0.40, 'Med': 0.30, 'High': 0.30}, ('Late', 'High', 'High'): {'Low': 0.20, 'Med': 0.35, 'High': 0.45},
}

# *** MODIFIED CPT FOR P_doom_2035 ***
# Goal: Significantly reduce P(Doom=High/VeryHigh) when AlignmentSolvability=Easy.
#       Also slightly reduce risk for Regulation=High and ControlLossRisk=Low.
# Parent Order: (AlignmentSolvability, Regulation, ControlLossRisk)
CPTS_SOURCE['P_doom_2035'] = {
    # --- AlignmentSolvability = Easy --- (Major reduction in High/VH risk)
    # ('Easy', 'Regulation', 'ControlLossRisk')
    ('Easy', 'High', 'Low'):   {'Low': 0.88, 'Medium': 0.10, 'High': 0.01, 'VeryHigh': 0.01}, # Was 70/20/7/3 -> High/VH=10% -> Now 2%
    ('Easy', 'High', 'Med'):   {'Low': 0.80, 'Medium': 0.15, 'High': 0.03, 'VeryHigh': 0.02}, # Was 60/25/10/5 -> High/VH=15% -> Now 5%
    ('Easy', 'High', 'High'):  {'Low': 0.65, 'Medium': 0.25, 'High': 0.07, 'VeryHigh': 0.03}, # Was 40/30/20/10 -> High/VH=30% -> Now 10%

    ('Easy', 'Med', 'Low'):    {'Low': 0.75, 'Medium': 0.18, 'High': 0.04, 'VeryHigh': 0.03}, # Was 50/30/15/5 -> High/VH=20% -> Now 7%
    ('Easy', 'Med', 'Med'):    {'Low': 0.60, 'Medium': 0.25, 'High': 0.10, 'VeryHigh': 0.05}, # Was 40/35/18/7 -> High/VH=25% -> Now 15%
    ('Easy', 'Med', 'High'):   {'Low': 0.45, 'Medium': 0.30, 'High': 0.15, 'VeryHigh': 0.10}, # Was 25/35/25/15 -> High/VH=40% -> Now 25%

    ('Easy', 'Low', 'Low'):    {'Low': 0.55, 'Medium': 0.25, 'High': 0.13, 'VeryHigh': 0.07}, # Was 30/40/20/10 -> High/VH=30% -> Now 20%
    ('Easy', 'Low', 'Med'):    {'Low': 0.40, 'Medium': 0.30, 'High': 0.18, 'VeryHigh': 0.12}, # Was 20/40/25/15 -> High/VH=40% -> Now 30%
    ('Easy', 'Low', 'High'):   {'Low': 0.25, 'Medium': 0.35, 'High': 0.25, 'VeryHigh': 0.15}, # Was 10/30/35/25 -> High/VH=60% -> Now 40%

    # --- AlignmentSolvability = Med --- (Minor reduction for safety factors)
    # ('Med', 'Regulation', 'ControlLossRisk')
    ('Med', 'High', 'Low'):   {'Low': 0.35, 'Medium': 0.40, 'High': 0.15, 'VeryHigh': 0.10}, # Was 30/40/20/10 -> High/VH=30% -> Now 25%
    ('Med', 'High', 'Med'):   {'Low': 0.25, 'Medium': 0.40, 'High': 0.22, 'VeryHigh': 0.13}, # Was 20/40/25/15 -> High/VH=40% -> Now 35%
    ('Med', 'High', 'High'):  {'Low': 0.15, 'Medium': 0.30, 'High': 0.32, 'VeryHigh': 0.23}, # Was 10/30/35/25 -> High/VH=60% -> Now 55%

    ('Med', 'Med', 'Low'):    {'Low': 0.25, 'Medium': 0.35, 'High': 0.25, 'VeryHigh': 0.15}, # Was 20/35/30/15 -> High/VH=45% -> Now 40%
    ('Med', 'Med', 'Med'):    {'Low': 0.15, 'Medium': 0.35, 'High': 0.30, 'VeryHigh': 0.20}, # Was 10/35/35/20 -> High/VH=55% -> Now 50%
    ('Med', 'Med', 'High'):   {'Low': 0.08, 'Medium': 0.27, 'High': 0.35, 'VeryHigh': 0.30}, # Was 5/25/40/30 -> High/VH=70% -> Now 65%

    ('Med', 'Low', 'Low'):    {'Low': 0.12, 'Medium': 0.30, 'High': 0.33, 'VeryHigh': 0.25}, # Was 10/30/35/25 -> High/VH=60% -> Now 58% (Minor change)
    ('Med', 'Low', 'Med'):    {'Low': 0.07, 'Medium': 0.25, 'High': 0.38, 'VeryHigh': 0.30}, # Was 5/25/40/30 -> High/VH=70% -> Now 68% (Minor change)
    ('Med', 'Low', 'High'):   {'Low': 0.03, 'Medium': 0.17, 'High': 0.45, 'VeryHigh': 0.35}, # Was 2/18/45/35 -> High/VH=80% -> Now 80% (Unchanged here)

    # --- AlignmentSolvability = Hard --- (Keep risk high, minor tweaks for consistency)
    # ('Hard', 'Regulation', 'ControlLossRisk')
    ('Hard', 'High', 'Low'):  {'Low': 0.12, 'Medium': 0.20, 'High': 0.38, 'VeryHigh': 0.30}, # Was 10/20/40/30 -> High/VH=70% -> Now 68%
    ('Hard', 'High', 'Med'):  {'Low': 0.07, 'Medium': 0.15, 'High': 0.43, 'VeryHigh': 0.35}, # Was 5/15/45/35 -> High/VH=80% -> Now 78%
    ('Hard', 'High', 'High'): {'Low': 0.03, 'Medium': 0.10, 'High': 0.47, 'VeryHigh': 0.40}, # Was 2/10/48/40 -> High/VH=88% -> Now 87%

    ('Hard', 'Med', 'Low'):   {'Low': 0.07, 'Medium': 0.15, 'High': 0.43, 'VeryHigh': 0.35}, # Was 5/15/45/35 -> High/VH=80% -> Now 78%
    ('Hard', 'Med', 'Med'):   {'Low': 0.04, 'Medium': 0.12, 'High': 0.49, 'VeryHigh': 0.35}, # Was 3/12/50/35 -> High/VH=85% -> Now 84%
    ('Hard', 'Med', 'High'):  {'Low': 0.02, 'Medium': 0.09, 'High': 0.49, 'VeryHigh': 0.40}, # Was 1/9/50/40 -> High/VH=90% -> Now 89%

    ('Hard', 'Low', 'Low'):   {'Low': 0.03, 'Medium': 0.10, 'High': 0.52, 'VeryHigh': 0.35}, # Was 2/10/53/35 -> High/VH=88% -> Now 87%
    ('Hard', 'Low', 'Med'):   {'Low': 0.02, 'Medium': 0.07, 'High': 0.51, 'VeryHigh': 0.40}, # Was 1/7/52/40 -> High/VH=92% -> Now 91%
    ('Hard', 'Low', 'High'):  {'Low': 0.01, 'Medium': 0.05, 'High': 0.49, 'VeryHigh': 0.45}, # Was 0/5/50/45 -> High/VH=95% -> Now 94%
}
# *** End of MODIFIED CPT ***


# --- Helper Function for Validation ---
def validate_distribution(dist, context_msg):
    """Checks if probabilities sum close to 1.0."""
    if not isinstance(dist, dict):
        print(f"  Error: Validation skipped for {context_msg}. Input is not a dictionary ({type(dist)}).", file=sys.stderr)
        return False # Cannot validate non-dict

    if not dist:
         print(f"  Warning: Validation skipped for {context_msg}. Distribution dictionary is empty.", file=sys.stderr)
         return True # Technically not invalid, just empty

    total = sum(dist.values())
    if abs(total - 1.0) > 1e-4:
        print(f"  Warning: Validation failed for {context_msg}. Probabilities sum to {total:.5f}", file=sys.stderr)
        return False
    return True

# --- Main Generation Logic ---
def generate_json_cpts(source_cpts, parents_map, output_path, delimiter):
    """Converts the Python CPT dict to a JSON-compatible format and saves it."""
    cpts_for_json = {}
    validation_passed = True

    print("Processing CPTs for JSON export...")

    # Check if all nodes in PARENTS are defined in source_cpts
    missing_nodes = set(parents_map.keys()) - set(source_cpts.keys())
    if missing_nodes:
        print(f"Error: The following nodes defined in PARENTS are missing from CPTS_SOURCE: {missing_nodes}", file=sys.stderr)
        print("Please define these CPTs in the CPTS_SOURCE dictionary.", file=sys.stderr)
        validation_passed = False
        # Decide if you want to exit or continue with missing CPTs
        # sys.exit(1) # Option: Exit if critical CPTs are missing

    # Check for nodes in source_cpts not in PARENTS (potential typos)
    extra_nodes = set(source_cpts.keys()) - set(parents_map.keys())
    if extra_nodes:
        print(f"Warning: The following nodes are defined in CPTS_SOURCE but not in PARENTS: {extra_nodes}", file=sys.stderr)
        print("These nodes will be included in the JSON but might not be used by the BN.", file=sys.stderr)


    for node_name, cpt_data in source_cpts.items():
        if node_name not in parents_map:
             # This case handled by the extra_nodes check above, but we can add detail
             print(f"- Skipping node '{node_name}' (found in CPTS_SOURCE but not PARENTS)...")
             continue

        print(f"- Processing node: {node_name}")
        parent_nodes = parents_map.get(node_name, []) # Get parents from the canonical PARENTS definition

        if not parent_nodes:
            # --- Prior Node ---
            if validate_distribution(cpt_data, f"Prior '{node_name}'"):
                 cpts_for_json[node_name] = cpt_data
            else:
                 validation_passed = False
                 # Still add it to JSON even if invalid, maybe user wants to fix it there
                 cpts_for_json[node_name] = cpt_data
                 print(f"    -> Added prior '{node_name}' to JSON despite validation warning.")

        else:
            # --- Conditional Node ---
            formatted_conditional_cpt = {}
            valid_node = True
            if not isinstance(cpt_data, dict):
                print(f"  Error: Expected dict for conditional CPT of '{node_name}', got {type(cpt_data)}. Skipping node.", file=sys.stderr)
                valid_node = False
                validation_passed = False
                continue # Skip processing this malformed node CPT

            for parent_states_tuple, child_distribution in cpt_data.items():
                # Ensure the key is actually a tuple (as defined in the source)
                if not isinstance(parent_states_tuple, tuple):
                    print(f"  Error: Expected tuple key for conditional node '{node_name}', but got {type(parent_states_tuple)}: {parent_states_tuple}. Skipping entry.", file=sys.stderr)
                    valid_node = False
                    validation_passed = False
                    continue # Skip this entry

                # Check number of states in key matches number of parents
                if len(parent_states_tuple) != len(parent_nodes):
                     print(f"  Error: Key {parent_states_tuple} for node '{node_name}' has {len(parent_states_tuple)} states, but expected {len(parent_nodes)} parents ({parent_nodes}). Skipping entry.", file=sys.stderr)
                     valid_node = False
                     validation_passed = False
                     continue

                # Validate the child distribution
                context = f"CPT entry for '{node_name}' | {parent_nodes} = {parent_states_tuple}"
                if not validate_distribution(child_distribution, context):
                    # valid_node = False # Don't mark the whole node invalid, just this entry
                    validation_passed = False # Mark overall validation as failed
                    # Fall through to still add it below, with warning

                # Create the delimited string key for JSON
                # Ensure all elements in the tuple are strings before joining
                try:
                    str_parent_states = [str(s) for s in parent_states_tuple]
                    joined_key = delimiter.join(str_parent_states)
                except Exception as e:
                     print(f"  Error: Failed to create string key from tuple {parent_states_tuple} for node '{node_name}': {e}. Skipping entry.", file=sys.stderr)
                     valid_node = False
                     validation_passed = False
                     continue

                formatted_conditional_cpt[joined_key] = child_distribution

            if not valid_node:
                 print(f"    -> Node '{node_name}' has definition or key errors. Check source CPT definitions.")
                 # Still add whatever was processed, maybe partially correct but likely problematic
                 cpts_for_json[node_name] = formatted_conditional_cpt
                 print(f"    -> Added conditional '{node_name}' to JSON despite ERRORS.")
            else:
                cpts_for_json[node_name] = formatted_conditional_cpt
                if validation_passed: # Only print success if no validation issues within this node
                     print(f"    -> Added conditional '{node_name}' to JSON.")
                else: # Print success but note prior issues
                     print(f"    -> Added conditional '{node_name}' to JSON (but validation warnings occurred).")


    # --- Write to JSON file ---
    print(f"\nWriting CPT data to {output_path}...")
    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            # Use sort_keys=True for consistent output order, easier diffing
            json.dump(cpts_for_json, f, indent=4, ensure_ascii=False, sort_keys=True)
        print("Successfully wrote CPT data.")
    except IOError as e:
        print(f"Error writing file {output_path}: {e}", file=sys.stderr)
        sys.exit(1)
    except TypeError as e:
        print(f"Error serializing CPT data to JSON: {e}", file=sys.stderr)
        print("Check if all CPT values are JSON-serializable (numbers, strings, lists, dicts).", file=sys.stderr)
        sys.exit(1)

    if not validation_passed:
        print("\n*** CRITICAL WARNING: One or more validation checks or CPT definition checks failed. ***")
        print("   The generated JSON file may contain invalid probability distributions or incorrect structures.")
        print("   Please review the error messages above, the source CPT data, and the generated JSON file carefully.", file=sys.stderr)
    else:
        print("\nAll basic CPT definition and validation checks passed.")

# --- Run the generator ---
if __name__ == "__main__":
    generate_json_cpts(CPTS_SOURCE, PARENTS, OUTPUT_JSON_PATH, KEY_DELIMITER)