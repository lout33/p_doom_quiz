## Features

1.  **Estimates AI Risk (P(doom)):** The main goal is to estimate the probability of AI-related existential catastrophe ("P(doom)"), specifically focusing on the year **2035**.
2.  **Interactive Quiz:** It asks the user a series of questions about factors believed to influence AI risk (like development timelines, alignment difficulty, regulation, etc.).
3.  **Manual Bayesian Network:** It simulates the logic of a simplified Bayesian Network based on the user's answers without relying on specialized libraries like `pgmpy`.
4.  **External Configuration:** The network's internal probabilities (CPTs) are loaded from an external `bn_cpts.json` file, allowing easier modification without changing the script code.
5.  **Sensitivity Analysis (2035):** It calculates and displays the P(doom by 2035) not just as a single number, but as a *range* (Lower Bound, Central Estimate, Upper Bound) based on a simple sensitivity analysis.
6.  **Heuristic Future Estimates (2050 & 2100):** It provides *rough, rule-based estimates* for P(doom) by **2050** and **2100**, extrapolating from the 2035 result and the calculated AI development timeline.
7.  **Expert Data Comparison:** It loads P(doom) estimates from various experts stored in a CSV file (`experts_pdoom.csv`) and compares the user's calculated estimates (for 2035, and the heuristic 2050/2100 guesses) to the closest expert opinion for each timeframe.
8.  **Step-by-Step Feedback:** Shows how the P(doom by 2035) estimate changes after each question the user answers.
9. **Visual Comparison:** Visualize your estimate compared to experts across the spectrum with an interactive bar chart.
10. **Dark Mode Interface:** Features a sleek dark mode interface by default, providing a modern look that's easier on the eyes and fits the serious subject matter.

## UI Improvement Plan

### Goals
- Create a more engaging, visually appealing interface
- Improve user experience through better feedback and interactions
- Enhance data visualization for clearer understanding of results
- Make the app feel more modern and professional

### Planned Improvements
1. **Design System Enhancements**
   - Implement a cohesive color scheme reflecting futuristic/tech themes
   - Add subtle animations and transitions for a more polished feel
   - Improve typography with better hierarchy and readability

2. **Quiz Experience**
   - Add animated progress indicators
   - Create visual feedback for answer selection
   - Implement a more interactive question card design
   - Add visualization of how each answer affects the probability calculation

3. **Results Page Overhaul**
   - Create a more dynamic and visually engaging results dashboard
   - Implement animated charts that show comparison to expert opinions
   - Add explanatory tooltips and contextual information
   - Create shareable result cards for social media

4. **General UI Components**
   - Design custom buttons with hover/active states
   - Create consistent card components with subtle shadows
   - Implement responsive layouts for all device sizes
   - Add loading states and transitions between pages

5. **Home Page Improvements**
   - Create an engaging hero section explaining the tool's purpose
   - Add animated elements to draw attention to call-to-action
   - Include preview of the quiz experience

### Implementation Status

✅ **Completed UI Improvements**
- Enhanced ProgressBar with animations, improved visuals, and step indicators
- Redesigned QuestionCard with interactive selection states and visual feedback
- Upgraded ResultsChart with animated bars, better legend, and color-coding
- Improved Quiz page with smoother transitions between questions and better result visualization
- Redesigned Results page with animated sections, better data visualizations, and improved layout
- Added color-coded probability indicators throughout the app
- Implemented consistent shadows, borders, and visual hierarchy
- Added animations and transitions for a more engaging experience
- Implemented a dark mode interface as the default theme to provide a modern, sleek appearance

## Changelog

### v1.2.0 (Dark Mode)
- Implemented dark mode as the default UI theme
- Updated all components and pages with dark color scheme
- Adjusted color contrasts for better readability in dark mode
- Modified visualization elements with dark-appropriate colors
- Enhanced visual hierarchy with appropriate dark mode shadows and borders

### v1.1.0 (UI Enhancement)
- Completely redesigned the user interface for a more engaging experience
- Added animations and transitions throughout the application
- Improved the quiz experience with interactive question cards
- Enhanced result visualizations with color-coding and better data display
- Implemented responsive design improvements for all device sizes
- Added visual progress indicators and better feedback during the quiz
- Updated the results page with animated sections and better expert comparisons

### v1.0.0 (Initial Release)
- Implemented main landing page
- Created interactive quiz component with progress tracking
- Built Bayesian network implementation for probability estimation
- Added results page with comparison to expert estimates
- Implemented visualization of results with interactive year selection
- Added expert data comparison via bar chart

### v0.1.0 (Alpha)
- Initial conversion from Python implementation to Next.js
- Basic quiz functionality
- Simple probability calculation

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
