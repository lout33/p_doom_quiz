

1.  **Estimates AI Risk (P(doom)):** The main goal is to estimate the probability of AI-related existential catastrophe ("P(doom)"), specifically focusing on the year **2035**.
2.  **Interactive Quiz:** It asks the user a series of questions about factors believed to influence AI risk (like development timelines, alignment difficulty, regulation, etc.).
3.  **Manual Bayesian Network:** It simulates the logic of a simplified Bayesian Network based on the user's answers without relying on specialized libraries like `pgmpy`.
4.  **External Configuration:** The network's internal probabilities (CPTs) are loaded from an external `bn_cpts.json` file, allowing easier modification without changing the script code.
5.  **Sensitivity Analysis (2035):** It calculates and displays the P(doom by 2035) not just as a single number, but as a *range* (Lower Bound, Central Estimate, Upper Bound) based on a simple sensitivity analysis.
6.  **Heuristic Future Estimates (2050 & 2100):** It provides *rough, rule-based estimates* for P(doom) by **2050** and **2100**, extrapolating from the 2035 result and the calculated AI development timeline.
7.  **Expert Data Comparison:** It loads P(doom) estimates from various experts stored in a CSV file (`experts_pdoom.csv`) and compares the user's calculated estimates (for 2035, and the heuristic 2050/2100 guesses) to the closest expert opinion for each timeframe.
8.  **Step-by-Step Feedback:** Shows how the P(doom by 2035) estimate changes after each question the user answers.
9. Visualize bar chart how your estimate compares across the expert spectrum


----

as a user i want to share my x risk prediction i mean my pdoom with other people online, so people get more engaged, this feature will be implementedi n the web version 



as a user i want to be more informed in ai x risk without needing to read or listen a lot, i mean in just a easy way... so a quiz would be nice

now tell me ideas in how to improve the quiz even more... to make it more engaging and viral

