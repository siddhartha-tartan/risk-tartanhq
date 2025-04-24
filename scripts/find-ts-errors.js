#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Ensure scripts directory exists
const scriptsDir = path.join(__dirname);
if (!fs.existsSync(scriptsDir)) {
  fs.mkdirSync(scriptsDir, { recursive: true });
}

console.log('Checking for TypeScript errors in the codebase...');

try {
  // Run TypeScript compiler with --noEmit flag to check for errors without generating output files
  const output = execSync('npx tsc --noEmit', { encoding: 'utf8' });
  console.log('No TypeScript errors found!');
} catch (error) {
  console.error('TypeScript errors found:');
  console.error(error.stdout);
  
  // Extract error locations for easier reference
  const errorRegex = /^([^(]+)\((\d+),(\d+)\):/gm;
  const errors = [];
  let match;
  
  while ((match = errorRegex.exec(error.stdout)) !== null) {
    const [_, filePath, line, column] = match;
    errors.push({ filePath, line, column });
  }
  
  console.log('\nSummary of error locations:');
  errors.forEach(({ filePath, line, column }) => {
    console.log(`${filePath}:${line}:${column}`);
  });
  
  process.exit(1);
} 