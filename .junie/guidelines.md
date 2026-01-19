### Project Guidelines

This document provides essential information for developers working on the **agent-flow-v2** project.

#### 1. Build/Configuration Instructions

The project is a Node.js-based system consisting of multiple modules (Dashboard, API Gateway, Database Service, etc.).

- **Tech Stack**: Node.js (ES Modules).
- **Prerequisites**: Node.js (LTS recommended).
- **Setup**:
    1. Clone the repository.
    2. Run `npm install` (once dependencies are added to `package.json`).
- **Architecture**: Refer to `docs/ARCHITECTURE.md` for a detailed breakdown of modules and their responsibilities.

#### 2. Testing Information

The project uses the native Node.js test runner (`node:test`).

- **Running Tests**:
    - Run a specific test file: `node path/to/test.js`
    - Run all tests (conventionally): `node --test` (searches for `*.test.js`, `test.js`, etc.)
- **Adding New Tests**:
    - Use `node:test` for defining tests and `node:assert` for assertions.
    - Follow the naming convention `*.test.js` or place tests in a `test/` directory.

**Simple Test Example:**

```javascript
import assert from 'node:assert';
import test from 'node:test';

test('example functionality', (t) => {
    const result = 1 + 1;
    assert.strictEqual(result, 2);
});
```

To run this example, save it as `example.test.js` and execute `node example.test.js`.

#### 3. Additional Development Information

- **Code Style**:
    - Use ES Modules (`import`/`export`).
    - Follow existing patterns in `docs/ARCHITECTURE.md` when implementing new modules.
    - Maintain clear separation of concerns as defined in the system modules.
- **Workflow**:
    - Feature development should follow the flow: Create branch -> Implement -> PR -> Review -> Merge.
    - Branches should be named according to the task (e.g., `feat/api-gateway-auth`).
- **Documentation**:
    - Keep `docs/ARCHITECTURE.md` up to date with any architectural changes.
    - Document new modules and their interfaces.
