#!/bin/bash

# P(doom) Calculator Web App Deployment Script

# Exit on error
set -e

echo "P(doom) Calculator Web App Deployment"
echo "====================================="

# Setup Node.js environment
echo "Setting up Node.js environment..."
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
nvm use 18

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the application
echo "Building the application..."
npm run build

# Start the application
echo "Starting the P(doom) Calculator Web App..."
npm start

# Note: In a real production environment, you would likely use:
# - A process manager like PM2
# - A reverse proxy like Nginx
# - Possibly containerization with Docker
# - A CI/CD pipeline 