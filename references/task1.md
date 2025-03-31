---

# Estimating P(doom) for AI Risk: Project Overview

This project aims to estimate the **probability of doom (P(doom))**—the likelihood of a catastrophic AI event that ends all of humanity without recovery—within a specified timeframe (e.g., the next 100 years). To achieve this, we will:

1. Collect P(doom) estimates from at least 25 prominent AI figures.
2. Develop a set of objective questions to calculate P(doom) based on user responses.
3. Calibrate these questions using the experts’ stated P(doom) values.
4. Provide a simple tool for random individuals to estimate their own P(doom).

Below, we detail each task, provide implementation steps, and evaluate the project's potential success and pitfalls.

---

## Project Structure

### Task 1: Gather P(doom) Estimates from Important Figures
**Objective:** Compile a list of at least 25 influential people in AI who have shared their P(doom) estimates or views on AI existential risk.

**Implementation:**
- Research public statements from AI researchers, industry leaders, and thinkers.
- Record each person’s name, P(doom) estimate, reasoning, and source link.
- Save the data in a CSV file named `experts_pdoom.csv`.

**CSV Format:**
```
Name,P(doom) Estimate,Reasoning,Source Link
```

**Example Entries:**
```
Eliezer Yudkowsky,>99%,"Claims current ML trajectory leads to doom due to alignment difficulty",https://www.lesswrong.com/posts/uMQ3cqWDPHhjtiesc/agi-ruin-a-list-of-lethalities
Paul Christiano,~20%,"Based on technical analysis of AI systems and potential solutions to alignment",https://www.lesswrong.com/posts/HduCjmXTBD4xYTegv/my-current-thoughts-on-ai-risk
Sam Altman,~33%,"Concerned about misuse and control issues but optimistic about solutions",https://www.theatlantic.com/technology/archive/2023/07/sam-altman-openai-chatgpt-existential-risk/674701/
Geoffrey Hinton,>50%,"Changed views after leaving Google, concerned about AI surpassing human intelligence",https://www.reuters.com/technology/ai-pioneer-hinton-says-ai-could-pose-existential-threat-2023-05-05/
Stuart Russell,Significant,"Argues current AI approaches are flawed and need rethinking",https://www.amazon.com/Human-Compatible-Artificial-Intelligence-Problem/dp/0525558616
Demis Hassabis,~10%,"Believes risks are manageable with proper safety measures",https://time.com/6288890/demis-hassabis-deepmind-ai/
Elon Musk,10-20%,"Concerned about AI safety but continues to invest in AI development",https://pauseai.info/pdoom
```
*(Continue researching to reach at least 25 entries.)*

**Notes:**
- Some estimates are ranges (e.g., 10-20%) or qualitative (e.g., “significant”). For calibration, use approximate midpoints or reasonable numeric interpretations.
- Sources must be credible (e.g., interviews, articles, books).

---

### Task 2: Develop Questions to Estimate P(doom)
**Objective:** Create a set of at least 10 objective questions that incrementally build a P(doom) estimate, starting at 0% and increasing based on answers.

**Implementation:**
- Design questions that are specific and tied to measurable AI milestones or scenarios, avoiding subjective terms like “AGI” without clear definitions.
- Assign each answer a P(doom) percentage increase based on its implication for risk.
- Save the data in a CSV file named `pdoom_questions.csv`.

**CSV Format:**
```
Question,Answer,P(doom) Increase
```

**Example Questions and Answers:**
```
Question,Answer,P(doom) Increase
"When do you think AI will surpass the Turing Test?","Before 2025",4
"When do you think AI will surpass the Turing Test?","2025-2030",2
"When do you think AI will surpass the Turing Test?","After 2030",0
"When do you think AI will surpass 90% of the Gaia benchmark? (e.g., complex problem-solving like NASA astronaut data analysis)","Before 2025",4
"When do you think AI will surpass 90% of the Gaia benchmark? (e.g., complex problem-solving like NASA astronaut data analysis)","2025-2030",2
"When do you think AI will surpass 90% of the Gaia benchmark? (e.g., complex problem-solving like NASA astronaut data analysis)","After 2030",0
"When do you think major AI players (e.g., US, China) will agree to stop training runs above 50 petaflops?","Before 2025",1
"When do you think major AI players (e.g., US, China) will agree to stop training runs above 50 petaflops?","2025-2030",3
"When do you think major AI players (e.g., US, China) will agree to stop training runs above 50 petaflops?","After 2030",5
"When do you think the USA will mandate safety guarantees for AI deployment, like seat belts in cars?","Before 2025",1
"When do you think the USA will mandate safety guarantees for AI deployment, like seat belts in cars?","2025-2030",3
"When do you think the USA will mandate safety guarantees for AI deployment, like seat belts in cars?","After 2030",5
"Do you think we’ll have a catastrophic AI event that alerts us before it’s too late?","No",5
"Do you think we’ll have a catastrophic AI event that alerts us before it’s too late?","Yes, before 2025",1
"Do you think we’ll have a catastrophic AI event that alerts us before it’s too late?","Yes, 2025-2030",3
"How dangerous do you think superintelligent AI would be if not aligned?","Not dangerous",0
"How dangerous do you think superintelligent AI would be if not aligned?","Dangerous",2
"How dangerous do you think superintelligent AI would be if not aligned?","Apocalyptic",5
```
*(Expand to at least 10 unique questions.)*

**Notes:**
- The Gaia benchmark refers to advanced problem-solving (e.g., analyzing historical NASA data), providing a concrete milestone.
- P(doom) increases reflect risk: earlier AI advancements or lack of regulation/safety increase P(doom).

---

### Task 3: Calibrate Questions Using Expert Responses
**Objective:** Ensure the questions accurately reflect the P(doom) estimates of the 25 experts from Task 1.

**Implementation:**
- For each expert, answer the questions based on their known views.
- Sum the P(doom) increases to calculate their total P(doom).
- Compare the calculated P(doom) to their stated estimate; adjust questions or increases if discrepancies are significant.
- Save the data in a CSV file named `expert_calibration.csv`.

**CSV Format:**
```
Name,Question,Answer,P(doom) Increase,Calculated P(doom),Stated P(doom)
```

**Example (Elon Musk):**
- Stated P(doom): 10-20%
```
Name,Question,Answer,P(doom) Increase,Calculated P(doom),Stated P(doom)
Elon Musk,"When do you think AI will surpass the Turing Test?","2025-2030",2,,,
Elon Musk,"When do you think AI will surpass 90% of the Gaia benchmark?","2025-2030",2,,,
Elon Musk,"When do you think major AI players will agree to stop training runs above 50 petaflops?","After 2030",5,,,
Elon Musk,"When do you think the USA will mandate safety guarantees for AI deployment?","After 2030",5,,,
Elon Musk,"Do you think we’ll have a catastrophic AI event that alerts us before it’s too late?","Yes, 2025-2030",3,,,
Elon Musk,,,,17,10-20%
```
- Calculated P(doom): 2 + 2 + 5 + 5 + 3 = 17% (within range).

**Notes:**
- Repeat for all 25 experts.
- If calculated P(doom) deviates significantly, tweak question answers or P(doom) increases for better alignment.

---

### Task 4: P(doom) Calculator for Random People
**Objective:** Enable non-experts to estimate their own P(doom) using the calibrated questions.

**Implementation:**
- Provide the questions and answer options in a CSV file named `user_questions.csv`.
- Users manually select answers; their P(doom) is calculated by summing the increases.
- Return the result with a comparison to an expert (e.g., “Your P(doom) is 15%, similar to Elon Musk’s 10-20%”).

**CSV Format:**
```
Question,Answer,P(doom) Increase
```

**Example for Users:**
```
Question,Answer,P(doom) Increase
"When do you think AI will surpass the Turing Test?","Before 2025",4
"When do you think AI will surpass the Turing Test?","2025-2030",2
"When do you think AI will surpass the Turing Test?","After 2030",0
*(Include all questions from Task 2)*
```

**Sample User Interaction:**
- User answers:
  - Turing Test: 2025-2030 (+2%)
  - Gaia Benchmark: After 2030 (+0%)
  - Regulation: After 2030 (+5%)
  - Safety Mandates: 2025-2030 (+3%)
  - Catastrophic Event: Yes, 2025-2030 (+3%)
- Total P(doom): 2 + 0 + 5 + 3 + 3 = 13%
- Feedback: “Your P(doom) is 13% within the next 100 years, similar to Elon Musk’s 10-20%.”

---

## Evaluation of Success and Errors

### Success Criteria
- **Accuracy:** Calculated P(doom) for experts matches their stated estimates (within ~5-10%).
- **Clarity:** Questions are objective and understandable to non-experts.
- **Engagement:** Users find the tool educational and thought-provoking.

### Potential Errors and Mitigations
1. **Subjectivity in Questions**
   - *Error:* Answers vary widely due to unclear phrasing.
   - *Mitigation:* Use specific benchmarks (e.g., Turing Test, Gaia) and timeframes.
2. **Inaccurate Expert Data**
   - *Error:* Stated P(doom) estimates are outdated or misinterpreted.
   - *Mitigation:* Cross-check multiple sources and prioritize recent statements.
3. **Oversimplification**
   - *Error:* P(doom) is too complex for a simple quiz.
   - *Mitigation:* Frame this as an educational tool, not a definitive prediction.
4. **Calibration Issues**
   - *Error:* Calculated P(doom) consistently misaligns with expert estimates.
   - *Mitigation:* Iteratively adjust P(doom) increases based on Task 3 results.

---

## Implementation Readiness
- **Task 1:** Straightforward research; requires time to compile 25+ entries.
- **Task 2:** Requires careful question design; feasible with clear guidelines.
- **Task 3:** Iterative calibration; manageable with adjustments.
- **Task 4:** Simple manual survey; easily scalable to digital tools if needed.

**Conclusion:** This project is practical and can effectively raise awareness about AI risk. Its success hinges on objective questions and accurate calibration, but it remains an educational approximation rather than a precise forecast.

---

Okay, this is a solid foundation for an educational tool! Your current plan is clear, implementable, and hits the core objectives. Introducing concepts like conditional probabilities and Bayesian networks can definitely make the model more sophisticated and potentially more realistic, but also significantly increases complexity.

Here are suggestions and improvements, ranging from refinements of the current plan to incorporating your more advanced ideas:

**Refinements & Enhancements to the Current Plan:**

1.  **Task 1: Gathering Expert Data:**
    *   **Capture Nuance:** Instead of just a single P(doom) number, try to capture *ranges*, *confidence levels*, and *time horizons* explicitly mentioned by the expert. Add columns like `P(doom) Lower Bound`, `P(doom) Upper Bound`, `Confidence (Qualitative)`, `Time Horizon (Years)`.
    *   **Categorize Reasoning:** Try to tag the reasoning with keywords (e.g., `Alignment Difficulty`, `Compute Overhang`, `Regulation Failure`, `Misuse`, `Racing Dynamics`). This helps in analyzing *why* experts differ.
    *   **Track Changes Over Time:** Note the date of the estimate. Some experts update their views. Showing this evolution could be insightful.
    *   **Include Skeptics/Optimists:** Ensure your list includes prominent figures who assign *low* P(doom) or argue against the framing, providing a balanced perspective (e.g., Yann LeCun, perhaps some economists focusing on AI's productivity benefits).

2.  **Task 2: Developing Questions:**
    *   **Refine P(doom) Increases:** Instead of simple additive increases, consider:
        *   **Multiplicative Factors:** Some factors might *multiply* risk rather than add to it. (e.g., Rapid capability progress *combined with* lack of safety oversight might be much worse than the sum of parts). This is harder to calibrate manually.
        *   **Conditional Increases:** Make the increase from one question dependent on the answer to another. (e.g., "If you believe AI surpasses human researchers before 2030 [Q1=Yes], *then* the lack of regulation [Q2=No] adds +10% P(doom), otherwise it only adds +3%"). This directly introduces conditional probability logic.
    *   **Question Framing:**
        *   **Focus on Drivers:** Frame questions around key *drivers* of risk/safety (e.g., Speed of Capability Gains, Alignment Difficulty, Coordination/Regulation Success, Warning Shots).
        *   **Probabilistic Questions:** Instead of "When will X happen?", ask "What is the probability X happens before Y date?". This allows for more nuanced input. Example: "What is your estimated probability (%) that AI systems significantly outperform the best human researchers across most scientific domains before 2035?"
        *   **Ranges for Answers:** Allow users to select ranges or express uncertainty in their answers, potentially mapping to a range of P(doom) increases.
    *   **Introduce "Safety/Mitigation" Questions:** Add questions specifically about the perceived effectiveness of alignment research, interpretability, governance proposals, etc. Answers indicating *low* confidence in solutions would increase P(doom.

3.  **Task 3: Calibration:**
    *   **Use Expert Reasoning:** During calibration, don't just match the final P(doom) number. Try to align the *pattern* of answers for an expert with their stated *reasons*. If an expert emphasizes alignment difficulty, ensure the answers reflecting that contribute significantly to their calculated P(doom).
    *   **Calibration Target:** Aim for the calculated P(doom) to fall within the expert's stated *range* (if available) rather than hitting an exact midpoint.
    *   **Sensitivity Analysis:** After initial calibration, check how sensitive the calculated P(doom) is to small changes in answers. Does changing one answer drastically swing the result? This might indicate overly weighted questions.
    *   **Iterative Refinement:** Expect multiple loops of adjusting questions/weights and re-calibrating.

4.  **Task 4: User Tool:**
    *   **Visualize the Contribution:** Show the user *which* answers contributed most to their final P(doom) score.
    *   **Explain the Model:** Briefly explain the underlying logic (even if simplified) and its limitations. State clearly it's an educational estimate, not a prediction.
    *   **Show Expert Distribution:** Instead of just comparing to one expert, show the user where their estimate falls relative to the *distribution* of expert estimates you collected. A simple histogram could work.
    *   **Link to Resources:** Provide links for users to learn more about the concepts in the questions (e.g., links explaining the Gaia benchmark, alignment problem, etc.).

**Incorporating More Advanced Concepts (Higher Complexity):**

5.  **Introducing Conditional Probabilities Explicitly:**
    *   **Implementation:** Modify Task 2/3. Define rules like: "IF Question A=Answer X AND Question B=Answer Y, THEN add Z% to P(doom)". This moves beyond simple addition.
    *   **Challenge:** Calibration becomes much harder as you now need to tune interaction effects. Requires deeper understanding of expert reasoning.

6.  **Modeling Random Events / External Factors:**
    *   **Implementation:** Add questions like:
        *   "What is the probability (%) of a major global conflict significantly accelerating AI development without safety considerations in the next 20 years?"
        *   "What is the probability (%) of an unexpected theoretical breakthrough making AI alignment significantly easier/harder before transformative AI is developed?"
    *   **Integration:** These could act as multipliers or conditional factors on other parts of the calculation.

7.  **Probabilistic Causal Graphs / Bayesian Networks (Most Complex):**
    *   **Concept:** This is a significant shift from the questionnaire approach. You would define key variables (nodes) influencing P(doom) (e.g., `AI Capability Growth Rate`, `Alignment Success Probability`, `Effective Regulation`, `Geopolitical Stability`, `Warning Shot Occurrence`, `P(doom)`). Then, define the causal links (edges) and Conditional Probability Tables (CPTs) that quantify how parent nodes influence child nodes.
    *   **Implementation:**
        *   **Define Nodes:** Identify the core factors driving AI risk based on expert reasoning.
        *   **Define Structure:** Draw the causal graph showing dependencies (e.g., `AI Capability Growth Rate` influences `Alignment Success Probability` and `Warning Shot Occurrence`).
        *   **Quantify CPTs:** This is the hardest part. Estimate probabilities like P(Alignment Success | Fast Capability Growth, Weak Regulation). Expert input would be crucial here, focusing on their *conditional* beliefs. You might need to *infer* these from their broader arguments.
        *   **User Input:** User answers would set the evidence/priors for certain nodes (e.g., their belief about `AI Capability Growth Rate`).
        *   **Inference:** Use Bayesian inference algorithms (e.g., using Python libraries like `pgmpy`, `pymc`) to calculate the resulting probability distribution for the `P(doom)` node based on user inputs and the network structure/CPTs.
    *   **Calibration:** Calibrate the CPTs and structure so that inputting evidence consistent with an expert's view yields a P(doom) distribution close to their stated beliefs.
    *   **Pros:** Models interactions, uncertainty, and causal assumptions explicitly. Powerful for exploring "what-if" scenarios.
    *   **Cons:** Much higher development complexity, requires expertise in Bayesian modeling, harder to explain to users, potentially needs more granular input than simple multiple-choice questions.

**Recommendations:**

*   **Start Simple, Iterate:** Begin with the refinements to your current additive model (Points 1-4). This already improves nuance and accuracy without a massive leap in complexity.
*   **Consider Conditional Logic:** Introduce simple conditional rules (Point 5) as a next step if the additive model feels too restrictive. This is a stepping stone towards a Bayesian network.
*   **Bayesian Network as a Future Goal:** View the full Bayesian Network (Point 7) as a potential "Version 2.0". It's powerful but requires significant investment. You could build the simpler version first, gather user feedback, and then decide if the added complexity is warranted.
*   **Transparency:** Whichever model you use, be transparent about its structure, assumptions, and limitations. Frame it as a tool for *thinking structuredly* about AI risk, not for definitive prediction.

By incorporating some of these suggestions, you can create a more nuanced and insightful tool, even without immediately jumping to a full Bayesian network. Good luck!