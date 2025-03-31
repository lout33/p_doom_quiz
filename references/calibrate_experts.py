#!/usr/bin/env python3
"""
Enhanced Expert Calibration Tool for P(doom) Questions

This script helps calibrate the P(doom) questions by:
1. Loading expert P(doom) estimates from the enhanced experts_pdoom.csv
2. Loading the improved questions with conditional logic from reorganized_pdoom_questions.csv
3. Allowing the user to answer questions for each expert
4. Calculating the resulting P(doom) with weights and dependencies
5. Saving the calibration results to improved_expert_calibration.csv
"""

import csv
import os
import re
import json
from collections import defaultdict

def load_experts(file_path):
    """Load expert P(doom) estimates from CSV file."""
    experts = []
    
    with open(file_path, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = row['Name']
            estimate = row['P(doom) Estimate']
            reasoning = row['Reasoning']
            source = row['Source Link']
            
            # Get additional fields if they exist
            lower_bound = row.get('P(doom) Lower Bound', None)
            upper_bound = row.get('P(doom) Upper Bound', None)
            confidence = row.get('Confidence (Qualitative)', 'Medium')
            time_horizon = row.get('Time Horizon (Years)', '100')
            categories = row.get('Categories', '')
            date_estimate = row.get('Date of Estimate', '')
            
            # Convert percentage ranges to numeric values for comparison
            numeric_estimate = parse_pdoom_estimate(estimate)
            if numeric_estimate is not None:
                experts.append({
                    'name': name,
                    'original_estimate': estimate,
                    'numeric_estimate': numeric_estimate,
                    'lower_bound': float(lower_bound) if lower_bound else None,
                    'upper_bound': float(upper_bound) if upper_bound else None,
                    'confidence': confidence,
                    'time_horizon': time_horizon,
                    'categories': categories,
                    'reasoning': reasoning,
                    'source': source,
                    'date_estimate': date_estimate
                })
    
    return experts

def parse_pdoom_estimate(estimate):
    """Parse P(doom) estimate string into a numeric value."""
    if estimate.startswith('~'):
        # Handle approximate values like ~20%
        return float(estimate[1:].strip('%'))
    elif estimate.startswith('>'):
        # Handle values like >99%
        return float(estimate[1:].strip('%'))
    elif estimate.startswith('<'):
        # Handle values like <1%
        return float(estimate[1:].strip('%'))
    elif '-' in estimate:
        # Handle ranges like 10-20%
        low, high = estimate.strip('%').split('-')
        return (float(low) + float(high)) / 2
    elif estimate.isdigit() or (estimate.replace('.', '', 1).isdigit() and estimate.count('.') < 2):
        # Handle plain numeric values
        return float(estimate.strip('%'))
    else:
        # Handle qualitative estimates like "Significant"
        qualitative_map = {
            "Significant": 40,
            "High": 70,
            "Medium": 50,
            "Low": 20,
            "Very Low": 5,
            "Negligible": 1
        }
        for term, value in qualitative_map.items():
            if term.lower() in estimate.lower():
                return value
        return None

def load_questions(file_path):
    """Load questions and their possible answers from reorganized CSV file."""
    questions = []
    
    with open(file_path, 'r') as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader, 1):
            question_data = {
                'id': f"Q{i}",
                'question': row['Question'].strip('"'),
                'category': row['Category'],
                'reasoning': row['Reasoning'],
                'answers': [],
                'depends_on': row.get('Depends_On', '').split(',') if row.get('Depends_On', '') else [],
                'dependency_rule': row.get('Dependency_Rule', '')
            }
            
            # Remove empty dependencies
            question_data['depends_on'] = [d for d in question_data['depends_on'] if d]
            
            # Extract all answer-pdoom-weight pairs
            for i in range(1, 5):  # Assuming 4 answers per question
                answer_key = f'Answer{i}'
                pdoom_key = f'PDoom{i}'
                weight_key = f'Weight{i}'
                
                if answer_key in row and pdoom_key in row and row[answer_key]:
                    weight = float(row.get(weight_key, 1.0)) if row.get(weight_key, '') else 1.0
                    question_data['answers'].append({
                        'text': row[answer_key].strip('"'),
                        'pdoom_increase': float(row[pdoom_key]),
                        'weight': weight
                    })
            
            questions.append(question_data)
    
    return questions

def save_calibration(file_path, expert_name, calibration_data, calculated_pdoom, stated_pdoom):
    """Save calibration data to CSV file."""
    # Check if file exists and has header
    file_exists = os.path.isfile(file_path)
    
    with open(file_path, 'a', newline='') as f:
        fieldnames = ['Name', 'Category', 'Question', 'Answer', 'Base P(doom) Increase', 'Weight', 'Conditional Multiplier', 'Final P(doom) Increase', 'Calculated P(doom)', 'Stated P(doom)', 'Lower Bound', 'Upper Bound']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        
        if not file_exists:
            writer.writeheader()
        
        # Write each answer row
        for item in calibration_data:
            writer.writerow({
                'Name': expert_name,
                'Category': item['category'],
                'Question': item['question'],
                'Answer': item['answer'],
                'Base P(doom) Increase': item['base_increase'],
                'Weight': item['weight'],
                'Conditional Multiplier': item['conditional_multiplier'],
                'Final P(doom) Increase': item['final_increase'],
                'Calculated P(doom)': '',
                'Stated P(doom)': '',
                'Lower Bound': '',
                'Upper Bound': ''
            })
        
        # Write summary row
        writer.writerow({
            'Name': expert_name,
            'Category': '',
            'Question': '',
            'Answer': '',
            'Base P(doom) Increase': '',
            'Weight': '',
            'Conditional Multiplier': '',
            'Final P(doom) Increase': '',
            'Calculated P(doom)': calculated_pdoom,
            'Stated P(doom)': stated_pdoom,
            'Lower Bound': calibration_data[0]['lower_bound'] if calibration_data else '',
            'Upper Bound': calibration_data[0]['upper_bound'] if calibration_data else ''
        })

def suggest_answer_based_on_pdoom(question, expert_pdoom, expert_categories):
    """Suggest an answer to a question based on the expert's P(doom) estimate and categories of concern."""
    # Check if there are categories in the expert's reasoning that match question content
    expert_cat_list = [cat.strip() for cat in expert_categories.split(',')] if expert_categories else []
    
    # Adjust recommendation based on categories
    category_adjustment = 0
    
    # Check if expert is particularly concerned with alignment
    alignment_focused = any(term in cat.lower() for cat in expert_cat_list 
                          for term in ['alignment', 'control', 'safety'])
    
    # Check if expert is focused on technical limitations/skepticism
    technical_skeptic = any(term in cat.lower() for cat in expert_cat_list 
                          for term in ['technical limitation', 'skeptic'])
    
    # Check if expert is focused on governance
    governance_focused = any(term in cat.lower() for cat in expert_cat_list 
                           for term in ['governance', 'regulation', 'policy'])
    
    if alignment_focused and 'alignment' in question['category'].lower():
        # Alignment-focused experts are more pessimistic about alignment solutions
        category_adjustment += 10
    
    if technical_skeptic and 'technical' in question['category'].lower():
        # Technical skeptics are more optimistic about slow progress
        category_adjustment -= 20
    
    if governance_focused and 'governance' in question['category'].lower():
        # Governance-focused experts more optimistic about governance solutions
        category_adjustment -= 10
    
    # Adjust expert_pdoom for this specific question based on categories
    adjusted_pdoom = expert_pdoom + category_adjustment
    adjusted_pdoom = max(0, min(100, adjusted_pdoom))  # Clamp to 0-100
    
    # For timeline questions (When will X happen?)
    if question['question'].startswith("When will"):
        if adjusted_pdoom < 10:
            # Very low P(doom) experts likely believe capabilities are far away
            return "Never or >100 years"
        elif adjusted_pdoom < 20:
            return "After 2040"
        elif adjusted_pdoom < 50:
            return "2030-2040"
        else:
            # High P(doom) experts likely believe capabilities are coming soon
            return "Before 2030"
    
    # For likelihood questions (How likely is X?)
    elif question['question'].startswith("How likely"):
        if "alignment" in question['question'].lower():
            # For alignment solvability, inverse relationship with P(doom)
            if adjusted_pdoom > 70:
                return "Very unlikely (<20%)"
            elif adjusted_pdoom > 40:
                return "Somewhat unlikely (20-40%)"
            elif adjusted_pdoom > 20:
                return "Somewhat likely (40-80%)"
            else:
                return "Very likely (>80%)"
        else:
            # For other likelihood questions, direct relationship with P(doom)
            if adjusted_pdoom > 70:
                return "Very likely (>80%)"
            elif adjusted_pdoom > 40:
                return "Somewhat likely (40-80%)"
            elif adjusted_pdoom > 20:
                return "Somewhat unlikely (20-40%)"
            else:
                return "Very unlikely (<20%)"
    
    # For competition intensity
    elif "competitive race" in question['question'].lower():
        if adjusted_pdoom > 70:
            return "Extreme competition with few safety considerations"
        elif adjusted_pdoom > 40:
            return "Strong competition with some safety considerations"
        elif adjusted_pdoom > 20:
            return "Moderate competition with significant safety considerations"
        else:
            return "Collaborative development with strong safety focus"
    
    # For funding questions
    elif "funding" in question['question'].lower():
        if adjusted_pdoom > 70:
            return "Less than 5%"
        elif adjusted_pdoom > 40:
            return "5-15%"
        elif adjusted_pdoom > 20:
            return "15-30%"
        else:
            return "More than 30%"
    
    # Default to middle option
    return question['answers'][len(question['answers'])//2]['text']

def evaluate_dependency_rule(rule, answered_questions):
    """Evaluate a dependency rule based on previously answered questions."""
    if not rule:
        return 1.0  # No rule, no effect
    
    # Extract the question ID and expected answer
    condition_parts = rule.split('then')[0].strip()
    multiplier_part = rule.split('then')[1].strip()
    
    # Extract multiplier
    multiplier = float(multiplier_part.split('by')[1].strip())
    
    # Simple parser for conditions
    conditions = []
    if 'AND' in condition_parts:
        # Multiple conditions
        for part in condition_parts.split('AND'):
            part = part.strip()
            if 'this.' in part:
                # This is a self-reference, will be handled separately
                continue
            q_id = part.split('.')[0].strip()
            answer = part.split('=')[1].strip("'")
            conditions.append((q_id, answer))
    else:
        # Single condition
        if 'this.' not in condition_parts:
            q_id = condition_parts.split('.')[0].strip()
            answer = condition_parts.split('=')[1].strip("'")
            conditions.append((q_id, answer))
    
    # Check if all conditions are met
    all_conditions_met = True
    for q_id, expected_answer in conditions:
        if q_id not in answered_questions or answered_questions[q_id] != expected_answer:
            all_conditions_met = False
            break
    
    # Special case for 'this' reference - handled by the calling function
    
    return multiplier if all_conditions_met else 1.0

def calibrate_expert(expert, questions):
    """Calibrate questions for a specific expert."""
    print(f"\n{'='*80}")
    print(f"Calibrating for: {expert['name']} - Stated P(doom): {expert['original_estimate']}")
    print(f"Categories: {expert['categories']}")
    print(f"Reasoning: {expert['reasoning']}")
    print(f"Source: {expert['source']} (Date: {expert['date_estimate']})")
    print(f"{'='*80}")
    
    calibration_data = []
    raw_pdoom = 0
    final_pdoom = 0
    
    # Keep track of answered questions for dependency evaluation
    answered_questions = {}
    question_answers = {}  # Store full answer objects for later dependency calculation
    
    for question in questions:
        print(f"\nQuestion ID: {question['id']}")
        print(f"Question: {question['question']}")
        print(f"Category: {question['category']}")
        print(f"Reasoning: {question['reasoning']}")
        
        # Suggest an answer based on expert's P(doom)
        suggested_answer = suggest_answer_based_on_pdoom(question, expert['numeric_estimate'], expert.get('categories', ''))
        print(f"Suggested answer based on {expert['name']}'s P(doom) and categories: {suggested_answer}")
        
        # Display answer options
        for i, answer in enumerate(question['answers'], 1):
            print(f"  {i}. {answer['text']} (+{answer['pdoom_increase']}%, weight: {answer['weight']})")
        
        # Get user selection
        while True:
            try:
                choice = input("\nEnter your choice (number) or press Enter to use suggestion: ")
                if choice == "":
                    # Find the suggested answer in the list
                    selected_idx = next((i for i, a in enumerate(question['answers']) 
                                        if a['text'] == suggested_answer), 0)
                    break
                else:
                    choice = int(choice)
                    if 1 <= choice <= len(question['answers']):
                        selected_idx = choice - 1
                        break
                    else:
                        print(f"Please enter a number between 1 and {len(question['answers'])}.")
            except ValueError:
                print("Please enter a valid number or press Enter.")
        
        # Record answer 
        selected_answer = question['answers'][selected_idx]
        answered_questions[question['id']] = selected_answer['text']
        question_answers[question['id']] = selected_answer
        
        # Record answer but don't calculate PDoom yet (need to wait for dependencies)
        calibration_data.append({
            'category': question['category'],
            'question': question['question'],
            'question_id': question['id'],
            'answer': selected_answer['text'],
            'base_increase': selected_answer['pdoom_increase'],
            'weight': selected_answer['weight'],
            'depends_on': question['depends_on'],
            'dependency_rule': question['dependency_rule'],
            'conditional_multiplier': 1.0,  # Will be calculated later
            'final_increase': 0.0,  # Will be calculated later
            'lower_bound': expert.get('lower_bound', ''),
            'upper_bound': expert.get('upper_bound', '')
        })
        
        print(f"Selected: {selected_answer['text']} (Base: +{selected_answer['pdoom_increase']}%, Weight: {selected_answer['weight']}x)")
    
    # Calculate P(doom) with dependencies
    for item in calibration_data:
        # Base contribution is the PDoom value * weight
        weighted_pdoom = item['base_increase'] * item['weight']
        
        # Apply dependencies if any
        rule = item['dependency_rule']
        this_answer = item['answer']
        
        multiplier = 1.0
        if rule:
            # Check for standard dependencies
            multiplier = evaluate_dependency_rule(rule, answered_questions)
            
            # Check for self-reference in the rule
            if 'this.' in rule:
                # Extract the expected self-value
                self_part = rule.split('AND') if 'AND' in rule else [rule]
                for part in self_part:
                    if 'this.' in part:
                        part = part.strip()
                        expected_self_answer = part.split('=')[1].strip("'")
                        # If this answer matches expected, keep the multiplier, else reset to 1.0
                        if this_answer != expected_self_answer:
                            multiplier = 1.0
        
        item['conditional_multiplier'] = multiplier
        item['final_increase'] = weighted_pdoom * multiplier
        raw_pdoom += weighted_pdoom  # Track raw PDoom
        final_pdoom += weighted_pdoom * multiplier
    
    # Compare with expert's stated P(doom)
    print(f"\n{'='*80}")
    print(f"Calibration Results for {expert['name']}")
    print(f"{'='*80}")
    print(f"Raw Weighted P(doom) (no conditionals): {raw_pdoom:.2f}%")
    print(f"Final Calculated P(doom) (with conditionals): {final_pdoom:.2f}%")
    print(f"Stated P(doom): {expert['original_estimate']} (numeric: {expert['numeric_estimate']}%)")
    
    if expert['lower_bound'] and expert['upper_bound']:
        print(f"Stated Range: {expert['lower_bound']}% - {expert['upper_bound']}%")
        in_range = expert['lower_bound'] <= final_pdoom <= expert['upper_bound']
        print(f"Within stated range: {'YES' if in_range else 'NO'}")
    
    difference = abs(final_pdoom - expert['numeric_estimate'])
    print(f"Difference from midpoint: {difference:.2f}%")
    
    if difference <= 5:
        print("GOOD MATCH: Within 5% of stated estimate")
    elif difference <= 10:
        print("ACCEPTABLE MATCH: Within 10% of stated estimate")
    else:
        print("POOR MATCH: Consider adjusting answers to better align with expert's stated P(doom)")
    
    # Print details of conditional calculations
    print("\nDetailed P(doom) Calculation:")
    print(f"{'Question':<5} | {'Answer':<40} | {'Base':<5} | {'Weight':<6} | {'Cond Mult':<9} | {'Final':<6}")
    print(f"{'-'*5} | {'-'*40} | {'-'*5} | {'-'*6} | {'-'*9} | {'-'*6}")
    
    for item in calibration_data:
        q_id = item['question_id']
        answer = item['answer']
        base = item['base_increase']
        weight = item['weight']
        cond_mult = item['conditional_multiplier']
        final = item['final_increase']
        
        print(f"{q_id:<5} | {answer[:40]:<40} | {base:<5.1f} | {weight:<6.1f} | {cond_mult:<9.1f} | {final:<6.1f}")
    
    return calibration_data, final_pdoom

def main():
    """Main function to run the calibration process."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    experts = load_experts(os.path.join(script_dir, 'experts_pdoom.csv'))
    questions = load_questions(os.path.join(script_dir, 'reorganized_pdoom_questions.csv'))
    
    # Create or clear the calibration file
    calibration_file = os.path.join(script_dir, 'improved_expert_calibration.csv')
    with open(calibration_file, 'w', newline='') as f:
        fieldnames = ['Name', 'Category', 'Question', 'Answer', 'Base P(doom) Increase', 'Weight', 'Conditional Multiplier', 'Final P(doom) Increase', 'Calculated P(doom)', 'Stated P(doom)', 'Lower Bound', 'Upper Bound']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
    
    print("\nWelcome to the Enhanced Expert Calibration Tool for P(doom) Questions")
    print("This tool will help you calibrate the P(doom) questions for each expert.")
    print("You'll be asked to select answers for each question based on the expert's views.")
    print("The calculator now includes weights and conditional effects between questions.")
    
    # Sort experts by P(doom) for easier calibration
    experts.sort(key=lambda x: x['numeric_estimate'])
    
    # Display available experts
    print("\nAvailable Experts (sorted by P(doom)):")
    for i, expert in enumerate(experts, 1):
        print(f"{i}. {expert['name']} - P(doom): {expert['original_estimate']}")
    
    while True:
        try:
            choice = input("\nEnter expert number to calibrate (or 0 to exit): ")
            if choice == "0":
                break
            
            expert_idx = int(choice) - 1
            if 0 <= expert_idx < len(experts):
                expert = experts[expert_idx]
                calibration_data, calculated_pdoom = calibrate_expert(expert, questions)
                
                # Save calibration data
                save_calibration(
                    calibration_file, 
                    expert['name'], 
                    calibration_data, 
                    calculated_pdoom, 
                    expert['original_estimate']
                )
                
                print(f"\nCalibration for {expert['name']} saved to {calibration_file}")
            else:
                print(f"Please enter a number between 1 and {len(experts)}.")
        except ValueError:
            print("Please enter a valid number.")
    
    print("\nCalibration process completed. Thank you for using the Enhanced Expert Calibration Tool!")

if __name__ == "__main__":
    main()
