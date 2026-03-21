// noinspection JSUnusedLocalSymbols

module.exports = {
    extends: ['@commitlint/config-conventional'],
    rules: {
        // Scope is REQUIRED
      'scope-empty': [2, 'never'], // ERROR if the scope is missing
        'scope-case': [2, 'always', 'kebab-case'], // scope must be kebab-case

        // Type validation
        'type-enum': [
            2,
            'always',
            [
                'feat',     // New feature
                'fix',      // Bug fix
                'docs',     // Documentation only
                'style',    // Formatting, missing semi colons, etc
                'refactor', // Code change that neither fixes a bug nor adds a feature
                'perf',     // Performance improvement
                'test',     // Adding tests
                'chore',    // Maintenance
                'ci',       // CI/CD changes
                'build',    // Build system changes
              'revert',   // Revert a previous commit
            ],
        ],

        // Subject validation
        'subject-case': [1, 'always', 'lower-case'], // lowercase
        'subject-empty': [2, 'never'], // Subject is required
        'subject-full-stop': [2, 'never', '.'], // No period at the end
        'subject-max-length': [2, 'always', 72], // Max 72 characters

        // Body validation
        'body-leading-blank': [1, 'always'], // Blank line before body
        'body-max-line-length': [2, 'always', 100], // Max 100 characters per line

        // Footer validation
        'footer-leading-blank': [1, 'always'], // Blank line before footer

        // Branch naming validation (custom rule)
        'branch-name-format': [2, 'always'],
    },
    plugins: [
        {
            rules: {
                'branch-name-format': (parsed, when = 'always', value = {}) => {
                  // Get the current branch name
                    const {execSync} = require('child_process');
                    let branchName;

                    try {
                        branchName = execSync('git symbolic-ref --short HEAD', {
                            encoding: 'utf8',
                        }).trim();
                    } catch (error) {
                        // If not in a git repository or detached HEAD
                        return [true];
                    }

                  // Allow the main branch
                    if (branchName === 'main' || branchName === 'master') {
                        return [true];
                    }

                    // Branch naming pattern: <type>/<issue-number>-<short-description>
                    // - Type: feature, fix, docs, refactor, test, chore, perf
                    // - Issue number: minimum 4 digits (0001-9999+)
                    // - Description: kebab-case
                    const branchPattern = /^(feature|fix|docs|refactor|test|chore|perf)\/[0-9]{4,}-[a-z0-9-]+$/;

                    const isValid = branchPattern.test(branchName);

                    if (!isValid) {
                        return [
                            false,
                            `❌ Invalid branch name: "${branchName}"
                            
Expected format: <type>/<issue-number>-<short-description>

Rules:
  • Type: feature, fix, docs, refactor, test, chore, perf
  • Issue number: REQUIRED, minimum 4 digits (e.g., 0001, 0042, 1234)
  • Description: kebab-case (lowercase, words separated by hyphens)

✅ Valid examples:
  • feature/0001-architect-agent
  • fix/0042-database-connection
  • docs/0099-api-documentation
  • feature/1234-workflow-integration

❌ Invalid examples:
  • feature/my-feature (missing issue number)
  • feature/1-bug-fix (issue number < 4 digits)
  • feature/123-new-feature (issue number < 4 digits)

⚠️  If you don't have an issue yet, create one first!
See: docs/guides/git-workflow.md for more details`,
                        ];
                    }

                    return [true];
                },
            },
        },
    ],
};
