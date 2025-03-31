#!/usr/bin/env python3

# --- Bayesian Network P(doom) Example - Approach 4 Refined ---
# Focuses BN on estimating P(doom) by 2035 based on relevant timing/risk factors.
# Uses heuristics to extrapolate estimates for 2050 and 2100.
# NOTE: CPTs and heuristics are ILLUSTRATIVE and NOT CALIBRATED.

import numpy as np
from pgmpy.models import BayesianNetwork
from pgmpy.factors.discrete import TabularCPD
from pgmpy.inference import VariableElimination
import pandas as pd
import sys

# --- 1. Define Simplified Expert Data ---
# Rough P(doom by 2100 = High or VeryHigh) % - Still used for final heuristic comparison
experts = [
    {'name': 'Dr. Pessimist', 'pdoom_high_vh_percent_2100': 90},
    {'name': 'Dr. Optimist',  'pdoom_high_vh_percent_2100': 10},
    {'name': 'Prof. Careful', 'pdoom_high_vh_percent_2100': 45},
]

# --- 2. Define the Bayesian Network Structure ---
# Focus on factors influencing near-term (2035) risk.
# **** CORRECTED STRUCTURE TO MATCH P_doom_2035 CPT ****
model = BayesianNetwork([
    # Core Timing Nodes & Influences
    ('AGI_Time', 'Alignment_Solved_Time'),
    ('AGI_Time', 'ControlLossRisk'),
    ('Coordination', 'Regulation_Effective_Time'),
    ('Interpretability', 'Alignment_Solved_Time'),
    ('Competition', 'Regulation_Effective_Time'),

    # Intermediate Factors & Influences
    ('Alignment_Solved_Time', 'DeceptionRisk'),
    ('DeceptionRisk', 'ControlLossRisk'),
    ('MisusePotential', 'ControlLossRisk'),

    # Final P_doom_2035 Node - Depends ONLY on AGI_Time & ControlLossRisk for this simplified CPT
    ('AGI_Time', 'P_doom_2035'),
    ('ControlLossRisk', 'P_doom_2035')

    # NOTE: Regulation, Misuse, Deception etc. now influence P_doom_2035 *indirectly*
    # via their effect on AGI_Time or ControlLossRisk.
])


# --- 3. Define States and Illustrative CPTs ---
STATE_TIME = ['Early', 'Mid', 'Late'] # Approx <2040, 2040-2060, >2060
STATE_TIME_NEVER = ['Early', 'Mid', 'Late', 'Never']
STATE_HML = ['High', 'Med', 'Low']
STATE_GMP = ['Good', 'Med', 'Poor']
STATE_DOOM = ['VeryHigh', 'High', 'Medium', 'Low'] # VH/H/M/L for P_doom

# --- Priors ---
cpd_agi_time = TabularCPD('AGI_Time', 3, [[0.3], [0.4], [0.3]], state_names={'AGI_Time': STATE_TIME})
cpd_coord = TabularCPD('Coordination', 3, [[0.2], [0.4], [0.4]], state_names={'Coordination': STATE_GMP})
cpd_interpret = TabularCPD('Interpretability', 3, [[0.2], [0.5], [0.3]], state_names={'Interpretability': STATE_GMP})
cpd_comp = TabularCPD('Competition', 3, [[0.6], [0.3], [0.1]], state_names={'Competition': STATE_HML})
cpd_misuse = TabularCPD('MisusePotential', 3, [[0.3], [0.4], [0.3]], state_names={'MisusePotential': STATE_HML})


# --- Conditionals ---
cpd_align_time = TabularCPD('Alignment_Solved_Time', 4,
                            [[0.4, 0.2, 0.1, 0.6, 0.4, 0.2, 0.7, 0.5, 0.3 ], [0.3, 0.3, 0.2, 0.2, 0.3, 0.3, 0.1, 0.2, 0.3 ],
                             [0.2, 0.3, 0.4, 0.1, 0.2, 0.3, 0.1, 0.2, 0.2 ], [0.1, 0.2, 0.3, 0.1, 0.1, 0.2, 0.1, 0.1, 0.2 ]],
                            evidence=['AGI_Time', 'Interpretability'], evidence_card=[3, 3],
                            state_names={'Alignment_Solved_Time': STATE_TIME_NEVER, 'AGI_Time': STATE_TIME, 'Interpretability': STATE_GMP})
cpd_align_time.normalize()

cpd_reg_time = TabularCPD('Regulation_Effective_Time', 4,
                          [[0.2, 0.4, 0.7, 0.1, 0.3, 0.5, 0.05, 0.1, 0.2 ], [0.3, 0.3, 0.2, 0.3, 0.4, 0.3, 0.15, 0.2, 0.3 ],
                           [0.3, 0.2, 0.1, 0.4, 0.2, 0.1, 0.40, 0.4, 0.3 ], [0.2, 0.1, 0.0, 0.2, 0.1, 0.1, 0.40, 0.3, 0.2 ]],
                          evidence=['Coordination', 'Competition'], evidence_card=[3, 3],
                          state_names={'Regulation_Effective_Time': STATE_TIME_NEVER, 'Coordination': STATE_GMP, 'Competition': STATE_HML})
cpd_reg_time.normalize()

cpd_decept = TabularCPD('DeceptionRisk', 3,
                        [[0.05, 0.2, 0.5, 0.8], [0.25, 0.4, 0.3, 0.15], [0.70, 0.4, 0.2, 0.05]],
                        evidence=['Alignment_Solved_Time'], evidence_card=[4],
                        state_names={'DeceptionRisk': STATE_HML, 'Alignment_Solved_Time': STATE_TIME_NEVER})

cpd_ctrl = TabularCPD('ControlLossRisk', 3,
                      [[0.8, 0.7, 0.6, 0.7, 0.6, 0.5, 0.6, 0.5, 0.4,
                        0.6, 0.5, 0.4, 0.5, 0.4, 0.3, 0.4, 0.3, 0.2,
                        0.4, 0.3, 0.2, 0.3, 0.2, 0.1, 0.2, 0.1, 0.05],
                       [0.15, 0.2, 0.25, 0.2, 0.25, 0.3, 0.25, 0.3, 0.35,
                        0.3, 0.35, 0.4, 0.35, 0.4, 0.45, 0.4, 0.45, 0.5,
                        0.4, 0.45, 0.5, 0.45, 0.5, 0.55, 0.5, 0.55, 0.6],
                       [0.05, 0.1, 0.15, 0.1, 0.15, 0.2, 0.15, 0.2, 0.25,
                        0.1, 0.15, 0.2, 0.15, 0.2, 0.25, 0.2, 0.25, 0.3,
                        0.2, 0.25, 0.3, 0.25, 0.3, 0.35, 0.3, 0.35, 0.35]],
                      evidence=['AGI_Time', 'DeceptionRisk', 'MisusePotential'],
                      evidence_card=[3, 3, 3],
                      state_names={'ControlLossRisk': STATE_HML, 'AGI_Time': STATE_TIME,
                                   'DeceptionRisk': STATE_HML, 'MisusePotential': STATE_HML})
cpd_ctrl.normalize()


# --- P(P_doom_2035 | AGI_Time, ControlLossRisk) --- VH/H/M/L
print("INFO: Defining CPT for P_doom_2035.")
cpd_p_doom_2035 = TabularCPD('P_doom_2035', 4, # VH, H, M, L
                             [[0.60, 0.30, 0.10, 0.20, 0.10, 0.02, 0.05, 0.01, 0.00], # P(Doom=VH | AGI, Ctrl) E,H;E,M;E,L; M,H;M,M;M,L; L,H;L,M;L,L
                              [0.30, 0.40, 0.30, 0.40, 0.30, 0.15, 0.20, 0.10, 0.05], # P(Doom=H  | ...)
                              [0.08, 0.20, 0.40, 0.30, 0.45, 0.43, 0.45, 0.39, 0.25], # P(Doom=M  | ...)
                              [0.02, 0.10, 0.20, 0.10, 0.15, 0.40, 0.30, 0.50, 0.70]],# P(Doom=L  | ...)
                             evidence=['AGI_Time', 'ControlLossRisk'],
                             evidence_card=[3, 3],
                             state_names={'P_doom_2035': STATE_DOOM,
                                          'AGI_Time': STATE_TIME,
                                          'ControlLossRisk': STATE_HML})
cpd_p_doom_2035.normalize()


# --- 4. Add CPTs to Model ---
all_cpds = [cpd_agi_time, cpd_coord, cpd_interpret, cpd_comp, cpd_misuse,
            cpd_align_time, cpd_reg_time, cpd_decept, cpd_ctrl, cpd_p_doom_2035]

defined_nodes_in_cpds = set()
for cpd in all_cpds:
    for var_name in cpd.variables:
        defined_nodes_in_cpds.add(var_name)
model_nodes = set(model.nodes())

if model_nodes != defined_nodes_in_cpds:
    print(f"Error: Mismatch between nodes in model structure and nodes used in CPDs.")
    print(f"  Nodes in model structure : {model_nodes}")
    print(f"  Nodes covered by CPDs    : {defined_nodes_in_cpds}")
    missing_cpd_or_usage = model_nodes - defined_nodes_in_cpds
    if missing_cpd_or_usage: print(f"  Nodes in model but not in CPDs: {missing_cpd_or_usage}")
    extra_in_cpds = defined_nodes_in_cpds - model_nodes
    if extra_in_cpds: print(f"  Nodes in CPDs but not in model: {extra_in_cpds}")
    sys.exit(1)
try:
    model.add_cpds(*all_cpds)
except Exception as e:
    print(f"Error adding CPDs: {e}")
    sys.exit(1)

# --- 5. Check Model ---
try:
    model.check_model()
    print("Bayesian Network Model is Valid.")
except Exception as e:
     print(f"Model check failed: {e}")
     sys.exit(1)

# --- 6. Inference Engine ---
try:
    infer = VariableElimination(model)
except Exception as e:
    print(f"Failed to initialize inference engine: {e}")
    sys.exit(1)

# --- 7. Define Questions and Mapping ---
questions_map = {
     'Q14': { # Maps to AGI_Time
        'level': 1, 'node': 'AGI_Time',
        'text': "Broadly, when do you expect AI systems to significantly surpass human cognitive abilities across most valuable tasks?",
        'options': {'1': ('Before 2040', 'Early'), '2': ('2040-2060', 'Mid'),
                    '3': ('After 2060 / Never', 'Late')}
    },
    'Q16': { # Maps to Coordination
        'level': 1, 'node': 'Coordination',
        'text': "How optimistic about humanity's general ability to cooperate effectively on AI safety?",
        'options': {'1': ('Optimistic', 'Good'), '2': ('Neutral / Mixed', 'Med'),
                    '3': ('Pessimistic', 'Poor')}
    },
     'Q4_AlignTime': { # Changed QID slightly, maps to Alignment_Solved_Time
        'level': 1, 'node': 'Alignment_Solved_Time',
        'text': "How likely are robust technical alignment solutions BEFORE transformative AI?",
        'options': {'1': ('Very likely (>70%)', 'Early'), '2': ('Likely (40-70%)', 'Mid'),
                    '3': ('Unlikely (10-40%)', 'Late'), '4': ('Very unlikely (<10%)', 'Never')}
    },
    'Q6': { # Maps to Interpretability
        'level': 2, 'node': 'Interpretability',
        'text': "When will major AI labs have robust, verifiable INTERPRETABILITY techniques?",
        'options': {'1': ('Before 2035', 'Good'), '2': ('2035-2050', 'Med'),
                    '3': ('After 2050 / Never', 'Poor')}
    },
     'Q2_Misuse': { # Maps to MisusePotential
        'level': 2, 'node': 'MisusePotential',
        'text': "How likely are novel, highly dangerous capabilities (e.g., autonomous bioweapons) developed by AI?",
        'options': {'1': ('Very Unlikely', 'Low'), '2': ('Possible', 'Med'),
                    '3': ('Likely', 'High'), '4': ('Almost Certain', 'High')}
    },
    'Q11': { # Maps to Competition
        'level': 3, 'node': 'Competition',
        'text': "How intense will the COMPETITIVE race for AI capabilities be?",
        'options': {'1': ('Extreme/High', 'High'), '2': ('Moderate', 'Med'),
                    '3': ('Low/Collaborative', 'Low')}
    },
    'Q8_RegTime': { # Changed QID slightly, maps to Regulation_Effective_Time
        'level': 3, 'node': 'Regulation_Effective_Time',
        'text': "How likely are binding global COMPUTE limits or similar effective regulations?",
        'options': {'1': ('Very likely (>70%)', 'Early'), '2': ('Likely (40-70%)', 'Mid'),
                    '3': ('Unlikely (10-40%)', 'Late'), '4': ('Very unlikely (<10%)', 'Never')}
    },
}
sorted_qids = sorted(questions_map.keys(), key=lambda q: (questions_map[q]['level'], q))

# --- 8. Run the Quiz & Inference ---
user_evidence = {}
current_level = 0
print("\n--- AI Risk Assessment (BN Focus on 2035) ---")

def get_prob(prob_dist, state_name, default=0.0):
    if prob_dist is None: return default
    var = prob_dist.variables[0]
    # Use state_names from the CPD associated with the variable for checking
    cpd = model.get_cpds(var)
    if cpd and hasattr(cpd, 'state_names') and var in cpd.state_names:
        valid_states = cpd.state_names[var]
        if state_name in valid_states:
             # Ensure the probability distribution object also uses the same state names
             if hasattr(prob_dist, 'state_names') and var in prob_dist.state_names and state_name in prob_dist.state_names[var]:
                  try:
                      # Create the state dictionary dynamically for get_value
                      state_dict = {var: state_name}
                      # Get index based on distribution's state order
                      state_index = prob_dist.state_names[var].index(state_name)
                      return prob_dist.values.flat[state_index] # Access flat array value
                  except Exception as e:
                      print(f"Warning: Error getting value for state '{state_name}' node '{var}': {e}")
                      return default
             else:
                  # This case might happen if inference returns states differently than CPD
                  print(f"Warning: State name mismatch between CPD and distribution for '{var}'.")
                  return default
    # print(f"Warning: State '{state_name}' not found for variable '{var}' in distribution states.")
    return default


# Initial state
initial_prob = None
try:
    initial_prob = infer.query(['P_doom_2035'], show_progress=False)
    print("\nInitial Estimated P(doom by 2035) Distribution:")
    print(initial_prob)
    p_high_vh = (get_prob(initial_prob,'High') + get_prob(initial_prob,'VeryHigh')) * 100
    print(f"Initial P(Doom by 2035 = High or VeryHigh): {p_high_vh:.1f}%")
except Exception as e:
    print(f"Error calculating initial state: {e}")

print("\nPlease answer the following questions:")
for qid in sorted_qids:
    q_data = questions_map[qid]

    if q_data['level'] > current_level:
        current_level = q_data['level']
        print(f"\n--- LEVEL {current_level} ---")

    print(f"\n{qid}: {q_data['text']}")
    display_options = {key: val[0] for key, val in q_data['options'].items()}
    for key, text in display_options.items():
        print(f"  {key}. {text}")

    while True:
        choice = input("Enter your choice (number): ")
        if choice in q_data['options']:
            chosen_text, chosen_state = q_data['options'][choice]
            node = q_data['node']
            target_cpd = model.get_cpds(node)
            if not target_cpd:
                print(f"!! Internal Error: No CPD found for node '{node}'. Skipping evidence.")
                break
            valid_states = target_cpd.state_names[node]
            if chosen_state not in valid_states:
                 print(f"!! Internal Error: State '{chosen_state}' mapped from answer '{chosen_text}' is not valid for node '{node}'. Valid states: {valid_states}. Skipping evidence.")
                 break

            user_evidence[node] = chosen_state
            print(f" -> Setting Evidence: {node} = {chosen_state}")

            try:
                updated_prob = infer.query(['P_doom_2035'], evidence=user_evidence, show_progress=False)
                print("\n   Updated P(doom by 2035) Distribution:")
                print(updated_prob)
                p_high_vh = (get_prob(updated_prob,'High') + get_prob(updated_prob,'VeryHigh')) * 100
                print(f"   Current P(Doom by 2035 = High or VeryHigh): {p_high_vh:.1f}%")
            except Exception as e:
                print(f"   Error during inference: {e}. Check CPTs/evidence.")
                print(f"   Current evidence: {user_evidence}")
            break
        else:
            print("Invalid choice, please try again.")


# --- 9. Final Results & Heuristic Timelines ---
print("\n" + "="*40)
print("--- FINAL RESULT ---")
print("="*40)
final_pdoom_2035_high_vh_percent = 0.0
prob_agi_time = None
prob_align_time = None

try:
    # Final P(doom) by 2035
    final_prob_doom_2035 = infer.query(['P_doom_2035'], evidence=user_evidence, show_progress=False)
    print("\nFinal P(doom by 2035) Distribution based on your answers:")
    print(final_prob_doom_2035)
    final_pdoom_2035_high_vh_percent = (get_prob(final_prob_doom_2035,'High') + get_prob(final_prob_doom_2035,'VeryHigh')) * 100
    print(f"\nYour Final Estimated P(Doom=High or VeryHigh by 2035): {final_pdoom_2035_high_vh_percent:.1f}%")

    # Query intermediate nodes needed for heuristics (Corrected query logic)
    evidence_no_agi = {k: v for k, v in user_evidence.items() if k != 'AGI_Time'}
    if 'AGI_Time' not in user_evidence: # Query if not evidence
         prob_agi_time = infer.query(['AGI_Time'], evidence=evidence_no_agi, show_progress=False)
    else: # If it was evidence, we know its state
         prob_agi_time = None # Indicate we don't need to query

    evidence_no_align = {k: v for k, v in user_evidence.items() if k != 'Alignment_Solved_Time'}
    if 'Alignment_Solved_Time' not in user_evidence:
         prob_align_time = infer.query(['Alignment_Solved_Time'], evidence=evidence_no_align, show_progress=False)
    else:
         prob_align_time = None

except Exception as e:
    print(f"\nError during final inference/querying: {e}")
    print(f"Final evidence provided: {user_evidence}")

# --- HEURISTIC Calculation for 2050 / 2100 ---
print("\n--- Heuristic Estimates for Later Timelines ---")

# Safely get probabilities or use evidence/priors
if 'AGI_Time' in user_evidence:
    p_agi_early = 1.0 if user_evidence['AGI_Time'] == 'Early' else 0.0
    p_agi_mid = 1.0 if user_evidence['AGI_Time'] == 'Mid' else 0.0
else:
    p_agi_early = get_prob(prob_agi_time, 'Early', default=cpd_agi_time.values[0])
    p_agi_mid = get_prob(prob_agi_time, 'Mid', default=cpd_agi_time.values[1])
p_agi_late = 1.0 - p_agi_early - p_agi_mid # Assume Late is the remainder, ensure >= 0
p_agi_late = max(0.0, p_agi_late)


if 'Alignment_Solved_Time' in user_evidence:
    p_align_never = 1.0 if user_evidence['Alignment_Solved_Time'] == 'Never' else 0.0
    p_align_late = 1.0 if user_evidence['Alignment_Solved_Time'] == 'Late' else 0.0
else:
     # Estimate prior marginal if needed (approximation)
    p_align_never = get_prob(prob_align_time, 'Never', default=0.15)
    p_align_late = get_prob(prob_align_time, 'Late', default=0.20)
p_align_never_late = p_align_late + p_align_never


# Heuristic: Extrapolate from 2035 based on mid/late timeline factors
# Weights are highly speculative!
mid_late_agi_factor = (p_agi_mid * 1.0) + (p_agi_late * 1.5)
solution_lag_factor = 1.0 + (p_align_never_late * 0.7)

additional_risk_2050 = np.clip(50 * mid_late_agi_factor * (solution_lag_factor / 1.2), 0, 50) # Limit added risk
heuristic_p_doom_2050 = final_pdoom_2035_high_vh_percent + additional_risk_2050

additional_risk_2100 = np.clip(30 * (p_agi_late * 1.5) * (solution_lag_factor / 1.1), 0, 40) # Limit added risk
heuristic_p_doom_2100 = heuristic_p_doom_2050 + additional_risk_2100


# Clamp results: 0 <= P35 <= P50 <= P100 <= 100
heuristic_p_doom_2035 = max(0.0, min(100.0, final_pdoom_2035_high_vh_percent))
heuristic_p_doom_2050 = max(heuristic_p_doom_2035, min(100.0, heuristic_p_doom_2050))
heuristic_p_doom_2100 = max(heuristic_p_doom_2050, min(100.0, heuristic_p_doom_2100))


print(f"BN Estimated P(Doom by 2035 = High or VH): {heuristic_p_doom_2035:.1f}%")
print(f"Heuristic P(Doom Approx by 2050): {heuristic_p_doom_2050:.1f}%")
print(f"Heuristic P(Doom Approx by 2100): {heuristic_p_doom_2100:.1f}%")
print("(2050/2100 estimates are rough heuristics based on BN 2035 result and timing factors)")


# --- Expert Comparison (Using heuristic 2100 value) ---
if experts and heuristic_p_doom_2100 >= 0:
    closest_expert = min(experts, key=lambda x: abs(x['pdoom_high_vh_percent_2100'] - heuristic_p_doom_2100))
    print(f"\nYour heuristic 2100 estimate is closest to {closest_expert['name']} (combined High/VH: {closest_expert['pdoom_high_vh_percent_2100']}%)")
elif not experts:
    print("\nExpert data not loaded, skipping comparison.")

print("\nNote: This is a conceptual model using illustrative probabilities.")