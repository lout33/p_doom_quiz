#!/usr/bin/env python3
"""
Enhanced P(doom) Calculator with Time Horizons

Calculates P(doom) estimates for cumulative time horizons (By 2035, By 2050, By 2100)
based on answers to calibrated questions, incorporating conditional dependencies.
Loads detailed expert data for comparison.
"""

import csv
import os
import sys
import json
import matplotlib.pyplot as plt
from collections import defaultdict
import re # For parsing dependency rules

# --- Configuration ---
QUESTIONS_CSV = 'pdoom_questions.csv'
EXPERTS_CSV = 'experts_pdoom.csv'
OUTPUT_PLOT_FILENAME = 'pdoom_comparison.png'

# --- Helper Functions ---

def safe_float(value, default=0.0):
    """Safely convert a value to float, returning default if conversion fails or value is empty."""
    if value is None or value == '':
        return default
    try:
        return float(value)
    except (ValueError, TypeError):
        return default

# --- Data Loading ---

def load_questions(file_path):
    """Load questions from the CSV with time horizon increments."""
    questions = []
    if not os.path.exists(file_path):
        print(f"Error: Questions file not found at {file_path}", file=sys.stderr)
        sys.exit(1)

    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            qid = row.get('QID', '').strip()
            if not qid: continue # Skip rows without QID

            question_data = {
                'qid': qid,
                'text': row.get('Question_Text', '').strip('"'),
                'category': row.get('Category', 'General'),
                'reasoning': row.get('Reasoning_Short', ''),
                'answers': [],
                'depends_on_qids': [q.strip() for q in row.get('Depends_On_QIDs', '').split(',') if q.strip()],
                'dependency_rule_desc': row.get('Dependency_Rule_Desc', '')
            }

            # Extract answers and their P(doom) increments for each period
            for i in range(1, 5): # Assuming up to 4 answers
                ans_text_key = f'Answer{i}_Text'
                p_incr_2035_key = f'Answer{i}_P_Incr_2035'
                p_incr_2050_key = f'Answer{i}_P_Incr_2050'
                p_incr_2100_key = f'Answer{i}_P_Incr_2100'

                if row.get(ans_text_key):
                    question_data['answers'].append({
                        'index': i - 1, # 0-based index
                        'text': row[ans_text_key].strip('"'),
                        'p_incr_2035': safe_float(row.get(p_incr_2035_key)),
                        'p_incr_2050': safe_float(row.get(p_incr_2050_key)),
                        'p_incr_2100': safe_float(row.get(p_incr_2100_key)),
                    })

            if question_data['answers']: # Only add if valid answers found
                questions.append(question_data)
            else:
                 print(f"Warning: No valid answers found for QID {qid}. Skipping.", file=sys.stderr)


    if not questions:
        print(f"Error: No questions loaded from {file_path}. Check file format.", file=sys.stderr)
        sys.exit(1)
    return questions

def load_experts(file_path):
    """Load detailed expert P(doom) estimates including time horizons."""
    experts = []
    if not os.path.exists(file_path):
        print(f"Error: Experts file not found at {file_path}", file=sys.stderr)
        return experts # Return empty list, maybe allow calculation without comparison

    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                experts.append({
                    'id': row.get('Expert_ID'),
                    'name': row.get('Name'),
                    'estimate_qualitative': row.get('P_Doom_Estimate_Qualitative'),
                    'lower_bound': safe_float(row.get('P_Doom_Lower_Bound_Percent'), None),
                    'upper_bound': safe_float(row.get('P_Doom_Upper_Bound_Percent'), None),
                    'confidence': row.get('Estimate_Confidence_Qualitative'),
                    'horizon_raw': row.get('Stated_Time_Horizon_Raw'),
                    'horizon_year': safe_float(row.get('Primary_Estimate_Horizon_Year'), None),
                    'pdoom_2035': safe_float(row.get('P_Doom_Estimate_By_2035_Percent'), None),
                    'pdoom_2050': safe_float(row.get('P_Doom_Estimate_By_2050_Percent'), None),
                    'pdoom_2100': safe_float(row.get('P_Doom_Estimate_By_2100_Percent'), None), # Use this as primary comparison
                    'reasoning_categories': row.get('Reasoning_Categories'),
                    'reasoning_summary': row.get('Reasoning_Summary'),
                    'source_url': row.get('Source_URL'),
                    'estimate_date': row.get('Estimate_Date'),
                    'interpretation_notes': row.get('Interpretation_Notes')
                })
            except Exception as e:
                 print(f"Warning: Error processing expert row for {row.get('Name', 'Unknown')}: {e}. Skipping.", file=sys.stderr)

    # Filter out experts without a primary numeric estimate for comparison (using 2100)
    experts_filtered = [e for e in experts if e['pdoom_2100'] is not None]
    if len(experts) != len(experts_filtered):
         print(f"Warning: Filtered out {len(experts) - len(experts_filtered)} experts lacking a numeric P(doom) by 2100 estimate.", file=sys.stderr)

    return experts_filtered

# --- Dependency Evaluation ---

def parse_dependency_rule(rule_desc, current_qid, current_answer_index, answered_indices):
    """
    Parses the dependency rule description and evaluates it.
    Returns a multiplier (float).
    Format Examples:
        "If Q1=A1, multiply this question's impact by 1.5"
        "If Q4=A4 AND Q6=A4, multiply this question's impact by 1.7"
        "If Q1=A1 AND this=A3 or A4, multiply this question's impact by 1.7"
        "If Q8=A4, multiply this question's impact by 0.8"
    """
    if not rule_desc or "multiply" not in rule_desc:
        return 1.0

    try:
        # Extract multiplier
        multiplier_match = re.search(r'multiply.*by\s*([0-9.]+)', rule_desc, re.IGNORECASE)
        if not multiplier_match: return 1.0
        multiplier = float(multiplier_match.group(1))

        # Extract condition part
        condition_part = rule_desc.split("multiply")[0].replace("If", "").strip()
        if not condition_part: return 1.0 # Should not happen if multiplier found

        # Split conditions by AND
        conditions_met = True
        individual_conditions = re.split(r'\s+AND\s+', condition_part, flags=re.IGNORECASE)

        for condition in individual_conditions:
            condition = condition.strip()
            # Handle 'this' condition
            if condition.lower().startswith("this="):
                target_indices_str = condition.split("=")[1].strip() # e.g., "A3" or "A3 or A4"
                target_indices = []
                for part in re.split(r'\s+or\s+', target_indices_str, flags=re.IGNORECASE):
                    index_match = re.match(r'A(\d+)', part.strip(), re.IGNORECASE)
                    if index_match:
                        target_indices.append(int(index_match.group(1)) - 1) # Convert A1->0, A2->1 etc.

                if not target_indices or current_answer_index not in target_indices:
                    conditions_met = False
                    break # This condition failed

            # Handle regular QID conditions
            else:
                match = re.match(r'(Q\d+)=(A\d+)', condition.strip(), re.IGNORECASE)
                if not match:
                    # Maybe a simple condition like Q1=A1? Check again
                    match = re.match(r'(Q\d+)\s*=\s*(A\d+)', condition.strip(), re.IGNORECASE)
                    if not match:
                        print(f"Warning: Could not parse condition '{condition}' in rule '{rule_desc}'", file=sys.stderr)
                        conditions_met = False # Treat unparseable as unmet
                        break

                dep_qid = match.group(1).upper()
                target_ans_index = int(match.group(2)[1:]) - 1 # A1 -> 0

                if dep_qid not in answered_indices or answered_indices[dep_qid] != target_ans_index:
                    conditions_met = False
                    break # This condition failed

        return multiplier if conditions_met else 1.0

    except Exception as e:
        print(f"Warning: Error evaluating dependency rule '{rule_desc}': {e}", file=sys.stderr)
        return 1.0 # Default to no effect on error

# --- Calculation Core ---

def calculate_pdoom(questions, experts):
    """Guides user through questions and calculates P(doom) timelines."""
    print("\n" + "=" * 80)
    print("P(DOOM) CALCULATOR WITH TIME HORIZONS".center(80))
    print("=" * 80)
    print("Estimate your probability of AI-induced existential catastrophe.")
    print("P(doom) = Likelihood of permanent human extinction from AI.")
    print("Calculations are based on your answers and pre-calibrated increments.")
    print("Timeline estimates are CUMULATIVE (e.g., By 2050 includes risk by 2035).")
    print("=" * 80)

    # Store answers and calculated increments
    # Format: { qid: {'question_data': {...}, 'chosen_answer_index': index, 'final_incr_2035': val, ...} }
    calculation_details = {}
    answered_indices = {} # For dependency checking: {qid: answer_index}

    # --- Phase 1: Gather Answers ---
    questions_by_category = defaultdict(list)
    for q in questions:
        questions_by_category[q['category']].append(q)

    for category, category_questions in questions_by_category.items():
        print(f"\n--- CATEGORY: {category} ---")
        for q_data in category_questions:
            qid = q_data['qid']
            print(f"\n{qid}: {q_data['text']}")
            if q_data['reasoning']: print(f"   Context: {q_data['reasoning']}")

            for i, ans in enumerate(q_data['answers']):
                # Show base increments for context (optional)
                # print(f"  {i+1}. {ans['text']} (+{ans['p_incr_2035']:.1f}/+{ans['p_incr_2050']:.1f}/+{ans['p_incr_2100']:.1f}%)")
                print(f"  {i+1}. {ans['text']}") # Cleaner display

            while True:
                try:
                    choice = int(input("   Enter your choice (number): "))
                    if 1 <= choice <= len(q_data['answers']):
                        chosen_answer_index = choice - 1
                        answered_indices[qid] = chosen_answer_index
                        calculation_details[qid] = {
                            'question_data': q_data,
                            'chosen_answer_index': chosen_answer_index,
                        }
                        break
                    else:
                        print(f"   Please enter a number between 1 and {len(q_data['answers'])}.")
                except ValueError:
                    print("   Please enter a valid number.")

    # --- Phase 2: Calculate Final Increments with Dependencies ---
    base_total_2035, base_total_2050, base_total_2100 = 0.0, 0.0, 0.0

    for qid, details in calculation_details.items():
        q_data = details['question_data']
        chosen_answer_index = details['chosen_answer_index']
        chosen_answer = q_data['answers'][chosen_answer_index]

        # Get base increments for the chosen answer
        base_incr_2035 = chosen_answer['p_incr_2035']
        base_incr_2050 = chosen_answer['p_incr_2050']
        base_incr_2100 = chosen_answer['p_incr_2100']

        base_total_2035 += base_incr_2035
        base_total_2050 += base_incr_2050
        base_total_2100 += base_incr_2100

        # Evaluate dependencies
        multiplier = parse_dependency_rule(
            q_data['dependency_rule_desc'],
            qid,
            chosen_answer_index,
            answered_indices
        )

        # Calculate final increments for this answer
        details['final_incr_2035'] = base_incr_2035 * multiplier
        details['final_incr_2050'] = base_incr_2050 * multiplier
        details['final_incr_2100'] = base_incr_2100 * multiplier
        details['multiplier'] = multiplier


    # --- Phase 3: Calculate Cumulative P(doom) ---
    final_p_doom_2035 = sum(d['final_incr_2035'] for d in calculation_details.values())
    final_p_doom_2050 = final_p_doom_2035 + sum(d['final_incr_2050'] for d in calculation_details.values())
    final_p_doom_2100 = final_p_doom_2050 + sum(d['final_incr_2100'] for d in calculation_details.values())

    # Clamp results between 0 and 100
    final_p_doom_2035 = max(0.0, min(100.0, final_p_doom_2035))
    final_p_doom_2050 = max(0.0, min(100.0, final_p_doom_2050))
    final_p_doom_2100 = max(0.0, min(100.0, final_p_doom_2100))

    # --- Phase 4: Display Results ---
    print("\n" + "=" * 80)
    print("YOUR P(DOOM) RESULTS".center(80))
    print("=" * 80)
    print(f"Your Estimated Cumulative P(doom):")
    print(f"  - By 2035: {final_p_doom_2035:.1f}%")
    print(f"  - By 2050: {final_p_doom_2050:.1f}%")
    print(f"  - By 2100: {final_p_doom_2100:.1f}%")

    # Compare with Experts (using the 2100 estimate)
    if experts:
        similar_experts = find_similar_experts(final_p_doom_2100, experts)
        if similar_experts:
            print("\nYour P(doom) by 2100 is similar to:")
            for expert in similar_experts[:3]: # Show top 3
                name = expert['name']
                est_2100 = expert['pdoom_2100']
                qual_est = expert['estimate_qualitative']
                cats = expert['reasoning_categories']
                print(f"- {name}: ~{est_2100:.1f}% by 2100 (Estimate: {qual_est})")
                if cats: print(f"    Reasoning Categories: {cats}")
        else:
            print("\nYour P(doom) by 2100 estimate doesn't closely match our listed experts.")

        # Plotting
        plot_expert_comparison(final_p_doom_2100, experts)
    else:
        print("\nExpert data not loaded. Skipping comparison.")


    # Detailed Breakdown
    print("\n" + "=" * 80)
    print("DETAILED CALCULATION BREAKDOWN (Contribution to P(doom) by 2100)".center(80))
    print("=" * 80)
    # Calculate total final contribution per question for sorting
    for qid in calculation_details:
         details = calculation_details[qid]
         details['total_final_contribution'] = details['final_incr_2035'] + details['final_incr_2050'] + details['final_incr_2100']

    sorted_details = sorted(calculation_details.items(), key=lambda item: item[1]['total_final_contribution'], reverse=True)

    print(f"{'QID':<5} | {'Category':<15} | {'Answer':<35} | {'Mult':<4} | {'Contr. 2035':<11} | {'Contr. 2050':<11} | {'Contr. 2100':<11}")
    print(f"{'-'*5} | {'-'*15} | {'-'*35} | {'-'*4} | {'-'*11} | {'-'*11} | {'-'*11}")

    category_totals_2100 = defaultdict(float)

    for qid, details in sorted_details:
        q_data = details['question_data']
        chosen_answer = q_data['answers'][details['chosen_answer_index']]
        category = q_data['category'][:15]
        ans_text = chosen_answer['text'][:35]
        mult = details['multiplier']
        c2035 = details['final_incr_2035']
        c2050 = details['final_incr_2050'] # Marginal contribution in this period
        c2100 = details['final_incr_2100'] # Marginal contribution in this period

        category_totals_2100[q_data['category']] += details['total_final_contribution']

        print(f"{qid:<5} | {category:<15} | {ans_text:<35} | {mult:<4.1f} | {c2035:<11.1f} | {c2050:<11.1f} | {c2100:<11.1f}")

    # Category Summary (based on total contribution by 2100)
    print("\nCONTRIBUTION BY CATEGORY (towards P(doom) by 2100):".center(80))
    total_final_2100 = final_p_doom_2100 # Use the clamped value? Or sum of contributions? Let's use sum for percentage calc consistency
    sum_contributions = sum(d['total_final_contribution'] for d in calculation_details.values())

    sorted_category_totals = sorted(category_totals_2100.items(), key=lambda item: item[1], reverse=True)
    for category, total_contribution in sorted_category_totals:
        percentage = (total_contribution / sum_contributions) * 100 if sum_contributions > 0 else 0
        print(f"- {category}: {total_contribution:.1f} percentage points ({percentage:.1f}%)")


    print("\n" + "=" * 80)
    print("Thank you for using the P(doom) Calculator!".center(80))
    print("Remember: This is a simplified model for reflection, not a prediction.")
    print("=" * 80)


# --- Comparison & Visualization ---

def find_similar_experts(user_pdoom, experts, tolerance=10):
    """Find experts with similar P(doom) by 2100 estimates."""
    similar = []
    for expert in experts:
        if expert['pdoom_2100'] is not None:
            if abs(expert['pdoom_2100'] - user_pdoom) <= tolerance:
                similar.append(expert)
    similar.sort(key=lambda x: abs(x['pdoom_2100'] - user_pdoom))
    return similar

def plot_expert_comparison(user_pdoom_2100, experts):
    """Generate and display a histogram comparing user's P(doom) by 2100 to experts."""
    if not experts: return

    try:
        # Prepare data - ensure experts have the estimate
        names = [e['name'] for e in experts if e['pdoom_2100'] is not None]
        values = [e['pdoom_2100'] for e in experts if e['pdoom_2100'] is not None]

        if not names:
            print("Warning: No expert data available for plotting.", file=sys.stderr)
            return

        # Add user's estimate
        names.append("YOUR ESTIMATE")
        values.append(user_pdoom_2100)

        # Sort by value for better visualization
        sorted_indices = sorted(range(len(values)), key=lambda k: values[k])
        names = [names[i] for i in sorted_indices]
        values = [values[i] for i in sorted_indices]

        # Create plot
        plt.figure(figsize=(max(12, len(names)*0.5), 8)) # Dynamic width
        colors = ['red' if name == "YOUR ESTIMATE" else 'cornflowerblue' for name in names]
        bars = plt.bar(names, values, color=colors)

        plt.xticks(rotation=90)
        plt.subplots_adjust(bottom=0.35) # Adjust bottom margin
        plt.ylabel('P(doom) Estimate by 2100 (%)')
        plt.title('Your P(doom) by 2100 Estimate Compared to Experts')
        plt.grid(axis='y', linestyle='--', alpha=0.6)
        plt.ylim(0, 105) # Set y-axis limit

        # Add value labels on bars
        for bar in bars:
            yval = bar.get_height()
            plt.text(bar.get_x() + bar.get_width()/2.0, yval + 1, f'{yval:.1f}', va='bottom', ha='center', fontsize=8)


        # Highlight user bar
        user_index = names.index("YOUR ESTIMATE")
        bars[user_index].set_edgecolor('black')
        bars[user_index].set_linewidth(1.5)

        plt.tight_layout() # Adjust layout
        plt.savefig(OUTPUT_PLOT_FILENAME)
        print(f"\nChart comparing P(doom) by 2100 saved as '{OUTPUT_PLOT_FILENAME}'")

    except ImportError:
        print("\nWarning: Matplotlib not installed. Cannot generate visualization.", file=sys.stderr)
        print("Install using: pip install matplotlib", file=sys.stderr)
    except Exception as e:
        print(f"\nWarning: Could not generate visualization: {e}", file=sys.stderr)

# --- Main Execution ---

if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    questions_file = os.path.join(script_dir, QUESTIONS_CSV)
    experts_file = os.path.join(script_dir, EXPERTS_CSV)

    questions = load_questions(questions_file)
    experts = load_experts(experts_file)

    calculate_pdoom(questions, experts)