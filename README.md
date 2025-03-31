# P(doom) Calculator Web App

This is a web-based version of the P(doom) Calculator, an educational tool that helps users estimate their probability of AI doom and compare their views with AI experts.

## Overview

P(doom) represents the probability of an existential catastrophe from artificial intelligence within approximately 100 years. This app helps you:

- Calculate your own P(doom) through a series of questions about AI development timelines, safety research, governance, and risk scenarios
- Apply weighted factors and conditional logic to your answers for nuanced predictions
- View projections for multiple timeframes (2035, 2050, and 2100)
- Compare your results to prominent AI experts like Yudkowsky, Hinton, Altman, and others for each timeframe
- Visualize how your estimate compares across the expert spectrum with interactive charts
- Understand which factors contributed most to your estimate

## Features

- Interactive quiz with real-time P(doom) meter
- Detailed results breakdown showing contribution of each answer
- Multi-year projections (2035, 2050, 2100) with different visualization options
- Expert comparison for each timeframe with probability ranges
- Chart visualization comparing your estimate to experts
- Category analysis showing which risk areas concern you most
- Social sharing options to discuss your results with others

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
