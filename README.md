## Features



1.  **Estimates AI Risk (P(doom)):** The main goal is to estimate the probability of AI-related existential catastrophe ("P(doom)"), specifically focusing on the year **2035**.
2.  **Interactive Quiz:** It asks the user a series of questions about factors believed to influence AI risk (like development timelines, alignment difficulty, regulation, etc.).
3.  **Manual Bayesian Network:** It simulates the logic of a simplified Bayesian Network based on the user's answers without relying on specialized libraries like `pgmpy`.
4.  **External Configuration:** The network's internal probabilities (CPTs) are loaded from an external `bn_cpts.json` file, allowing easier modification without changing the script code.
5.  **Sensitivity Analysis (2035):** It calculates and displays the P(doom by 2035) not just as a single number, but as a *range* (Lower Bound, Central Estimate, Upper Bound) based on a simple sensitivity analysis.
6.  **Heuristic Future Estimates (2050 & 2100):** It provides *rough, rule-based estimates* for P(doom) by **2050** and **2100**, extrapolating from the 2035 result and the calculated AI development timeline.
7.  **Expert Data Comparison:** It loads P(doom) estimates from various experts stored in a CSV file (`experts_pdoom.csv`) and compares the user's calculated estimates (for 2035, and the heuristic 2050/2100 guesses) to the closest expert opinion for each timeframe.
8.  **Step-by-Step Feedback:** Shows how the P(doom by 2035) estimate changes after each question the user answers.
9. Visualize bar chart how your estimate compares across the expert spectrum



## Getting Started

First, install the dependencies:

```bash
# Use Node.js 18
nvm use 18

# Install dependencies
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to explore the app.

## Building for Production

```bash
npm run build
```

## Technology

This project uses:

- Next.js 15 - React framework
- TypeScript - Type-safe JavaScript
- TailwindCSS - Utility-first CSS
- Chart.js - Data visualization
- CSV data processed into a TypeScript API

## Educational Purpose

This tool is designed for educational purposes to help people think about AI risk in a structured way. The P(doom) estimates are subjective and should not be taken as scientific predictions.

## Credits

Based on the P(doom) Calculator Python implementation and survey data from AI researchers and industry experts.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
