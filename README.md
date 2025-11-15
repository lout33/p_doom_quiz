# P(doom) Calculator

An interactive web application that estimates the probability of AI-related existential catastrophe ("P(doom)") based on your beliefs about AI development, safety, and governance.

## What is P(doom)?

P(doom) represents the estimated probability of an AI-related existential catastrophe. This tool helps you explore different scenarios and see how your estimates compare to expert opinions.

## Features

- **Interactive Quiz** - Answer questions about AI development timelines, alignment difficulty, regulation, and more
- **Real-time Calculations** - See your P(doom) estimate update live as you answer questions
- **Expert Comparisons** - Compare your estimates with predictions from AI researchers and industry experts
- **Multiple Timeframes** - Get estimates for 2035, 2040, 2050, 2060, and 2100
- **Visual Effects** - Dynamic doom-themed interface with flame effects and ember particles
- **Expert Insights** - Click on any expert to learn about their background and reasoning
- **Bayesian Network** - Uses a simplified Bayesian Network to calculate probabilities based on your answers
- **Embeddable Widget** - Share the calculator on your website with a simple iframe snippet

## Recent Updates

### Latest Changes (Last 4 Commits)

**Enhanced Epistemic Uncertainty**
- Added epistemic uncertainty tracking for more nuanced probability estimates
- Improved Bayesian network calculations with uncertainty propagation
- Enhanced results display with confidence intervals

**Doom Theme & Visual Effects**
- Added `FlameEffect` and `EmberParticles` components for atmospheric visuals
- Implemented `LiveDoomMeter` that updates in real-time during the quiz
- Enhanced quiz and results pages with animations and transitions
- Improved visual representation of probability ranges

**Expert Modal & Extended Timeframes**
- Added `ExpertModal` component to show expert backgrounds and sources
- Extended estimates to include 2040 and 2060 predictions
- Enhanced sharing functionality with user nicknames
- Added new AI risk questions to the quiz

**UI Improvements**
- Updated layout with metadata and favicon
- Enhanced dark mode styling
- Improved responsive design

## Getting Started

### Prerequisites

```bash
# Use Node.js 18
nvm use 18
```

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
```

## Technology Stack

- **Next.js 15** - React framework for production
- **TypeScript** - Type-safe JavaScript
- **TailwindCSS** - Utility-first CSS framework
- **Chart.js** - Interactive data visualization
- **Custom Bayesian Network** - Manual probability calculations without external ML libraries

## How It Works

1. **Answer Questions** - Complete a quiz about various AI risk factors
2. **Bayesian Calculation** - Your answers feed into a Bayesian Network that calculates P(doom)
3. **View Results** - See your estimates across multiple timeframes (2035-2100)
4. **Compare with Experts** - See where you stand relative to AI researchers and industry experts
5. **Explore Insights** - Click on experts to learn about their reasoning and sources

## Embed on Your Website

You can embed the P(doom) calculator on your own website, blog, or documentation. After completing the quiz, click the **"Embed Widget"** button on the results page to access the embed code and preview.

### Quick Embed

Add this snippet to your HTML where you want the calculator to appear:

```html
<div style="max-width:960px;margin:0 auto;">
  <iframe
    src="https://p-doom-quiz.vercel.app"
    title="P(doom) Calculator"
    loading="lazy"
    referrerpolicy="strict-origin-when-cross-origin"
    allowtransparency="true"
    style="width:100%;min-height:760px;border:1px solid rgba(120,186,255,0.35);background:#0b1120;"
  ></iframe>
</div>
```

### Embedding Tips

- **Height**: The calculator requires approximately 740-760px of vertical space at desktop widths
- **Styling**: The widget uses a dark theme, so it works best on dark backgrounds
- **Responsive**: The iframe is fully responsive and adapts to different screen sizes
- **CSP**: If you use Content Security Policy, add `https://p-doom-quiz.vercel.app` to the `frame-src` directive
- **Customization**: You can adjust the `min-height` and border styles to match your site's design

## Educational Purpose

This tool is designed for educational purposes to help people think critically about AI risk in a structured way. The P(doom) estimates are subjective models based on simplified assumptions and should not be taken as scientific predictions.

## Credits

Based on P(doom) survey data from AI researchers and industry experts. Built with Next.js and inspired by various AI safety frameworks.

## License

Educational and research purposes.
