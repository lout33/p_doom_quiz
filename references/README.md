# Enhanced P(doom) Calculator for AI Risk

This project provides tools to estimate the probability of doom (P(doom)) from artificial intelligence - defined as the likelihood of a catastrophic AI event that ends all of humanity without recovery within the next 100 years.

## Features

- **Expert Database**: Collection of P(doom) estimates from 25+ AI experts with detailed metadata
- **Enhanced Question System**: Sophisticated questions with weights and conditional logic
- **Interactive Calculator**: Calculate your own P(doom) with visualization and expert comparison
- **Calibration Tool**: Advanced tool for calibrating questions against expert estimates
- **Web Application**: Modern Next.js web interface for a user-friendly experience

## System Requirements

- Python 3.6+ (for Python implementation)
- matplotlib (for visualization in Python implementation)
- Node.js 18+ (for web application)

## Installation

1. Clone this repository
2. For Python implementation:
   ```
   pip install matplotlib
   ```
3. For web application:
   ```
   cd web_nextjs
   npm install
   ```

## Files in this Project

### Python Implementation
- `experts_pdoom.csv` - Database of expert P(doom) estimates with detailed metadata
- `reorganized_pdoom_questions.csv` - Enhanced questions with weights and dependencies
- `improved_pdoom_calculator.py` - Interactive calculator for users to estimate their P(doom)
- `calibrate_experts.py` - Tool for calibrating questions against expert estimates
- `improved_expert_calibration.csv` - Results of calibration process

### Web Application
- `web_nextjs/` - Next.js web application implementing the calculator with a modern UI
- `web_nextjs/src/app/api/questions.ts` - TypeScript implementation of the P(doom) calculation logic
- `web_nextjs/src/app/quiz/` - Interactive quiz component
- `web_nextjs/src/app/results/` - Results page with visualizations and expert comparisons

## How to Use

### Python Calculator

Run the interactive calculator:

```
python improved_pdoom_calculator.py
```

Answer the series of questions to get your personalized P(doom) estimate.

### Web Application

For a more user-friendly experience with visualizations:

```
cd web_nextjs
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Calibrate Questions

For researchers wanting to adjust the questions or weights:

```
python calibrate_experts.py
```

## Methodology

Our enhanced P(doom) calculator uses a sophisticated methodology:

1. **Weights**: Each answer has a weight multiplier to reflect its relative importance
2. **Conditional Logic**: Answers to certain questions can amplify or dampen the effect of other answers
3. **Expert Calibration**: Questions are calibrated to match stated expert P(doom) estimates
4. **Categorization**: Questions are organized into meaningful categories (Technical Milestones, Safety & Alignment, etc.)

## Enhancements from Earlier Version

This version includes significant improvements:
- Added detailed expert metadata (confidence levels, bounds, categories of concern)
- Implemented conditional probability logic between questions
- Added weighted factors for different answers
- Enhanced visualization and comparison with experts
- Improved calibration system with detailed calculation breakdown
- Created a modern web application for better user experience

## Contributing

Contributions are welcome! Areas for improvement:
- Adding more experts to the database
- Refining question weights and dependencies
- Improving visualization options
- Adding Bayesian network capabilities for even more sophisticated modeling

## License

MIT License 


```mermaid
graph TD
    A[Capability Speed (Fast/Med/Slow)] --> C{Alignment Difficulty (Hard/Med/Easy)};
    B[Coordination Level (Good/Med/Poor)] --> C;
    B --> D{Regulation Effectiveness (High/Med/Low)};
    C --> E{P(doom) (High/Med/Low)};
    D --> E;
    A --> E; 

```
