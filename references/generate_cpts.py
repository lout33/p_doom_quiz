#!/usr/bin/env python3

import json
import os
import sys

# --- Configuration ---
OUTPUT_JSON_PATH = 'bn_cpts.json'
KEY_DELIMITER = '|' # Delimiter for joining parent states in JSON keys

# --- Network Structure (Needed to identify priors vs conditionals) ---
# Copy this from your main script
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
# Copy this from your main script
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


# --- SOURCE CPT Data (Copy EXACTLY from your main script) ---
# IMPORTANT: Make sure this is the *exact* data structure you want to export.
# Any errors here will be propagated to the JSON.
CPTS_SOURCE = {}

# Priors
CPTS_SOURCE['Timeline'] = {'Early': 0.3, 'Mid': 0.4, 'Late': 0.3}
CPTS_SOURCE['Coordination'] = {'Good': 0.2, 'Med': 0.4, 'Poor': 0.4}
CPTS_SOURCE['Interpretability'] = {'Good': 0.2, 'Med': 0.5, 'Poor': 0.3}
CPTS_SOURCE['MisusePotential'] = {'Low': 0.3, 'Med': 0.4, 'High': 0.3}

# Conditionals
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
CPTS_SOURCE['P_doom_2035'] = {
    ('Easy', 'High', 'Low'): {'Low': 0.70, 'Medium': 0.20, 'High': 0.07, 'VeryHigh': 0.03}, ('Easy', 'High', 'Med'): {'Low': 0.60, 'Medium': 0.25, 'High': 0.10, 'VeryHigh': 0.05}, ('Easy', 'High', 'High'): {'Low': 0.40, 'Medium': 0.30, 'High': 0.20, 'VeryHigh': 0.10},
    ('Easy', 'Med', 'Low'): {'Low': 0.50, 'Medium': 0.30, 'High': 0.15, 'VeryHigh': 0.05}, ('Easy', 'Med', 'Med'): {'Low': 0.40, 'Medium': 0.35, 'High': 0.18, 'VeryHigh': 0.07}, ('Easy', 'Med', 'High'): {'Low': 0.25, 'Medium': 0.35, 'High': 0.25, 'VeryHigh': 0.15},
    ('Easy', 'Low', 'Low'): {'Low': 0.30, 'Medium': 0.40, 'High': 0.20, 'VeryHigh': 0.10}, ('Easy', 'Low', 'Med'): {'Low': 0.20, 'Medium': 0.40, 'High': 0.25, 'VeryHigh': 0.15}, ('Easy', 'Low', 'High'): {'Low': 0.10, 'Medium': 0.30, 'High': 0.35, 'VeryHigh': 0.25},
    ('Med', 'High', 'Low'): {'Low': 0.30, 'Medium': 0.40, 'High': 0.20, 'VeryHigh': 0.10}, ('Med', 'High', 'Med'): {'Low': 0.20, 'Medium': 0.40, 'High': 0.25, 'VeryHigh': 0.15}, ('Med', 'High', 'High'): {'Low': 0.10, 'Medium': 0.30, 'High': 0.35, 'VeryHigh': 0.25},
    ('Med', 'Med', 'Low'): {'Low': 0.20, 'Medium': 0.35, 'High': 0.30, 'VeryHigh': 0.15}, ('Med', 'Med', 'Med'): {'Low': 0.10, 'Medium': 0.35, 'High': 0.35, 'VeryHigh': 0.20}, ('Med', 'Med', 'High'): {'Low': 0.05, 'Medium': 0.25, 'High': 0.40, 'VeryHigh': 0.30},
    ('Med', 'Low', 'Low'): {'Low': 0.10, 'Medium': 0.30, 'High': 0.35, 'VeryHigh': 0.25}, ('Med', 'Low', 'Med'): {'Low': 0.05, 'Medium': 0.25, 'High': 0.40, 'VeryHigh': 0.30}, ('Med', 'Low', 'High'): {'Low': 0.02, 'Medium': 0.18, 'High': 0.45, 'VeryHigh': 0.35},
    ('Hard', 'High', 'Low'): {'Low': 0.10, 'Medium': 0.20, 'High': 0.40, 'VeryHigh': 0.30}, ('Hard', 'High', 'Med'): {'Low': 0.05, 'Medium': 0.15, 'High': 0.45, 'VeryHigh': 0.35}, ('Hard', 'High', 'High'): {'Low': 0.02, 'Medium': 0.10, 'High': 0.48, 'VeryHigh': 0.40},
    ('Hard', 'Med', 'Low'): {'Low': 0.05, 'Medium': 0.15, 'High': 0.45, 'VeryHigh': 0.35}, ('Hard', 'Med', 'Med'): {'Low': 0.03, 'Medium': 0.12, 'High': 0.50, 'VeryHigh': 0.35}, ('Hard', 'Med', 'High'): {'Low': 0.01, 'Medium': 0.09, 'High': 0.50, 'VeryHigh': 0.40},
    ('Hard', 'Low', 'Low'): {'Low': 0.02, 'Medium': 0.10, 'High': 0.53, 'VeryHigh': 0.35}, ('Hard', 'Low', 'Med'): {'Low': 0.01, 'Medium': 0.07, 'High': 0.52, 'VeryHigh': 0.40}, ('Hard', 'Low', 'High'): {'Low': 0.00, 'Medium': 0.05, 'High': 0.50, 'VeryHigh': 0.45},
}
# --- End of SOURCE CPT Data ---


# --- Helper Function for Validation ---
def validate_distribution(dist, context_msg):
    """Checks if probabilities sum close to 1.0."""
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

    for node_name, cpt_data in source_cpts.items():
        print(f"- Processing node: {node_name}")
        parent_nodes = parents_map.get(node_name, [])

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
            for parent_states_tuple, child_distribution in cpt_data.items():
                # Ensure the key is actually a tuple (as defined in the source)
                if not isinstance(parent_states_tuple, tuple):
                    print(f"  Error: Expected tuple key for conditional node '{node_name}', but got {type(parent_states_tuple)}: {parent_states_tuple}", file=sys.stderr)
                    valid_node = False
                    validation_passed = False
                    continue # Skip this entry

                # Validate the child distribution
                context = f"CPT entry for '{node_name}' | {parent_nodes} = {parent_states_tuple}"
                if not validate_distribution(child_distribution, context):
                    valid_node = False
                    validation_passed = False
                    # Fall through to still add it below, with warning

                # Create the delimited string key for JSON
                # Ensure all elements in the tuple are strings before joining
                str_parent_states = [str(s) for s in parent_states_tuple]
                joined_key = delimiter.join(str_parent_states)

                formatted_conditional_cpt[joined_key] = child_distribution

            if not valid_node:
                 print(f"    -> Node '{node_name}' has validation errors. Check source CPT definitions.")
                 # Still add whatever was processed, maybe partially correct
                 cpts_for_json[node_name] = formatted_conditional_cpt
                 print(f"    -> Added conditional '{node_name}' to JSON despite validation warnings/errors.")
            else:
                cpts_for_json[node_name] = formatted_conditional_cpt
                print(f"    -> Added conditional '{node_name}' to JSON.")


    # --- Write to JSON file ---
    print(f"\nWriting CPT data to {output_path}...")
    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(cpts_for_json, f, indent=4, ensure_ascii=False)
        print("Successfully wrote CPT data.")
    except IOError as e:
        print(f"Error writing file {output_path}: {e}", file=sys.stderr)
        sys.exit(1)
    except TypeError as e:
        print(f"Error serializing CPT data to JSON: {e}", file=sys.stderr)
        print("Check if all CPT values are JSON-serializable (numbers, strings, lists, dicts).", file=sys.stderr)
        sys.exit(1)

    if not validation_passed:
        print("\nWarning: One or more validation checks failed. Please review the source CPT data and the generated JSON file.", file=sys.stderr)
    else:
        print("\nBasic validation checks passed.")

# --- Run the generator ---
if __name__ == "__main__":
    generate_json_cpts(CPTS_SOURCE, PARENTS, OUTPUT_JSON_PATH, KEY_DELIMITER)