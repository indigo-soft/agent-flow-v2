#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const errors = [];

// Check src/ exists
if (!fs.existsSync(path.join(__dirname, '../src'))) {
    errors.push('❌ src/ directory not found');
}

// Check required top-level modules
const requiredModules = [
    'agents',
    'api',
    'dashboard',
    'core',
    'database',
    'queue',
    'integrations',
    'logger',
    'config',
    'shared',
];

requiredModules.forEach(module => {
    const modulePath = path.join(__dirname, '../src', module);
    if (!fs.existsSync(modulePath)) {
        errors.push(`⚠️  Warning: src/${module}/ not found (might not be created yet)`);
    }
});

// Check file naming conventions
function checkNaming(dir, level = 0) {
    if (level > 5) return; // Prevent infinite recursion

    const items = fs.readdirSync(dir);

    items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            // Directories should be kebab-case
            if (item !== item.toLowerCase() || item.includes('_')) {
                errors.push(`❌ Directory should be kebab-case: ${fullPath}`);
            }
            checkNaming(fullPath, level + 1);
        } else if (stat.isFile() && item.endsWith('.ts')) {
            // TypeScript files should be kebab-case (except React components)
            const isComponent = item.match(/^[A-Z]/);
            if (!isComponent && (item !== item.toLowerCase() || item.includes('_'))) {
                errors.push(`❌ File should be kebab-case: ${fullPath}`);
            }
        }
    });
}

try {
    checkNaming(path.join(__dirname, '../src'));
} catch (error) {
    // Ignore if src/ doesn't exist yet
}

if (errors.length > 0) {
    console.log('\n🔍 Structure Check Results:\n');
    errors.forEach(error => console.log(error));
    console.log('\nSee docs/adr/018-file-structure-flat-modular.md for guidelines\n');

    // Don't fail commit, just warn
    // process.exit(1);
} else {
    console.log('✅ File structure looks good!');
}
