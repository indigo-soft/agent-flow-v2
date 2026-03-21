# System Events

**agent-flow-v2** uses BullMQ for asynchronous communication between agents.

## Event List

### `task-started`

- **Trigger**: When a task is moved to the "In Progress" state.
- **Payload**: `{ "taskId": "string", "branchName": "string" }`
- **Consumer**: `WorkflowAgent`
- **Action**: Creates a feature branch on GitHub.

### `review-requested`

- **Trigger**: When a developer (or agent) completes work on a task.
- **Payload**: `{ "taskId": "string", "pullRequestId": "number" }`
- **Consumer**: `CodeReviewAgent`
- **Action**: Performs AI-driven code review on the PR.

### `review-completed`

- **Trigger**: When the Code Review Agent finishes its analysis.
- **Payload**: `{ "taskId": "string", "status": "APPROVED | CHANGES_REQUESTED", "comments": [] }`
- **Consumer**: `WorkflowAgent`
- **Action**: Updates task status; triggers merge if approved.

### `task-completed`

- **Trigger**: When a PR is merged and the task is finalized.
- **Payload**: `{ "taskId": "string", "changes": "string" }`
- **Consumer**: `DocumentationAgent`
- **Action**: Updates project documentation.

## Queue Configuration

- **Redis**: Primary store for BullMQ.
- **Retries**: Default 3 attempts with exponential backoff.
