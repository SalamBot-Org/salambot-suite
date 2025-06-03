#!/usr/bin/env node

/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires */

/**
 * Terraform Validation Script
 *
 * This script validates Terraform files for basic syntax errors
 * without requiring Terraform to be installed.
 */

const fs = require('fs');
const path = require('path');

// Basic HCL syntax validation patterns
const validationRules = [
  {
    name: 'Balanced braces',
    test: (content) => {
      const openBraces = (content.match(/{/g) || []).length;
      const closeBraces = (content.match(/}/g) || []).length;
      return openBraces === closeBraces;
    },
    error: 'Unbalanced braces detected',
  },
  {
    name: 'Balanced brackets',
    test: (content) => {
      const openBrackets = (content.match(/\[/g) || []).length;
      const closeBrackets = (content.match(/\]/g) || []).length;
      return openBrackets === closeBrackets;
    },
    error: 'Unbalanced brackets detected',
  },
  {
    name: 'Balanced parentheses',
    test: (content) => {
      const openParens = (content.match(/\(/g) || []).length;
      const closeParens = (content.match(/\)/g) || []).length;
      return openParens === closeParens;
    },
    error: 'Unbalanced parentheses detected',
  },
  {
    name: 'No trailing commas in objects',
    test: (content) => {
      // Remove comments and strings first
      const cleaned = content
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove /* */ comments
        .replace(/\/\/.*$/gm, '') // Remove // comments
        .replace(/"[^"]*"/g, '""'); // Remove string contents

      return !cleaned.match(/,\s*}/g);
    },
    error: 'Trailing comma before closing brace detected',
  },
];

function validateTerraformFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const errors = [];

  for (const rule of validationRules) {
    if (!rule.test(content)) {
      errors.push(`${rule.error} in ${filePath}`);
    }
  }

  return errors;
}

function findTerraformFiles(dir) {
  const files = [];

  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.startsWith('.')) {
        traverse(fullPath);
      } else if (stat.isFile() && item.endsWith('.tf')) {
        files.push(fullPath);
      }
    }
  }

  traverse(dir);
  return files;
}

function main() {
  const terraformDir =
    process.argv[2] || path.join(__dirname, '..', 'infra', 'terraform');

  if (!fs.existsSync(terraformDir)) {
    console.error(`❌ Terraform directory not found: ${terraformDir}`);
    process.exit(1);
  }

  console.log(`🔍 Validating Terraform files in: ${terraformDir}`);

  const terraformFiles = findTerraformFiles(terraformDir);

  if (terraformFiles.length === 0) {
    console.log('⚠️  No Terraform files found');
    return;
  }

  console.log(`📁 Found ${terraformFiles.length} Terraform files`);

  let totalErrors = 0;

  for (const file of terraformFiles) {
    const relativePath = path.relative(terraformDir, file);
    console.log(`\n📄 Validating: ${relativePath}`);

    try {
      const errors = validateTerraformFile(file);

      if (errors.length === 0) {
        console.log('  ✅ Valid');
      } else {
        console.log('  ❌ Errors found:');
        errors.forEach((error) => console.log(`    - ${error}`));
        totalErrors += errors.length;
      }
    } catch (error) {
      console.log(`  ❌ Failed to read file: ${error.message}`);
      totalErrors++;
    }
  }

  console.log(`\n📊 Validation Summary:`);
  console.log(`  Files checked: ${terraformFiles.length}`);
  console.log(`  Total errors: ${totalErrors}`);

  if (totalErrors === 0) {
    console.log('\n🎉 All Terraform files passed validation!');
    process.exit(0);
  } else {
    console.log('\n💥 Validation failed with errors');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  validateTerraformFile,
  findTerraformFiles,
};
