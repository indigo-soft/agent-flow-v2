#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const errors = [];

// Check src/ exists
if (!fs.existsSync(path.join(__dirname, '../src'))) {
    errors.push('❌ src/ directory not found');
}

// Check top-level architecture dirs (ADR-024: Flat Modular Architecture with Shared Layer)
const requiredTopLevel = ['modules', 'components'];
requiredTopLevel.forEach(dir => {
    const dirPath = path.join(__dirname, '../src', dir);
    if (!fs.existsSync(dirPath)) {
        errors.push(`⚠️  Warning: src/${dir}/ not found (required by ADR-024)`);
    }
});

// Check domain modules
const requiredModules = [
    'architect-agent',
    'workflow-agent',
    'code-review-agent',
    'documentation-agent',
];
requiredModules.forEach(mod => {
    const modPath = path.join(__dirname, '../src/modules', mod);
    if (!fs.existsSync(modPath)) {
        errors.push(`⚠️  Warning: src/modules/${mod}/ not found (might not be created yet)`);
    }
});

// Check shared components
const requiredComponents = [
    'api',
    'database',
    'queue',
    'logger',
    'config',
    'ai-provider',
    'github',
    'dashboard',
];
requiredComponents.forEach(comp => {
    const compPath = path.join(__dirname, '../src/components', comp);
    if (!fs.existsSync(compPath)) {
        errors.push(`⚠️  Warning: src/components/${comp}/ not found (might not be created yet)`);
    }
});

// Warn about leftover legacy directories (pre-ADR-024 structure)
const legacyDirs = ['agents', 'api', 'dashboard', 'core', 'database', 'queue', 'integrations', 'logger', 'config', 'shared'];
legacyDirs.forEach(dir => {
    const dirPath = path.join(__dirname, '../src', dir);
    if (fs.existsSync(dirPath)) {
        errors.push(`⚠️  Legacy directory found: src/${dir}/ — migrate to src/modules/ or src/components/ (see ADR-024)`);
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
} catch {
    // Ignore if src/ doesn't exist yet
}

if (errors.length > 0) {
    console.log('\n🔍 Structure Check Results:\n');
    errors.forEach(error => console.log(error));
    console.log('\nSee docs/adr/024-flat-modular-architecture-with-shared-layer.md for guidelines\n');

    // Don't fail commit, just warn
    // process.exit(1);
} else {
    console.log('✅ File structure looks good!');
}
