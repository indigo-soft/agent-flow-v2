# API Endpoints

## Conversations

### POST `/conversations/analyze`

Analyzes a raw conversation text and returns a plan draft.

- **Request Body**: `{ "text": "string" }`
- **Response**: `DraftPlanDto`

## Drafts

### GET `/drafts`

Returns all plan drafts.

### GET `/drafts/{id}`

Returns a specific plan draft.

### PUT `/drafts/{id}`

Updates a plan draft with feedback.

- **Request Body**: `{ "feedback": "string" }`
- **Response**: `DraftPlanDto`

### POST `/drafts/{id}/commit`

Converts a draft into actual tasks in the database.

- **Response**: `{ "success": true, "taskCount": number }`

## Tasks

### GET `/tasks`

Returns all tasks.

- **Query Params**: `status`, `agent`, `limit`, `offset`

### GET `/tasks/{id}`

Returns a specific task.

### PATCH `/tasks/{id}/status`

Updates task status.

- **Request Body**: `{ "status": "TaskStatus" }`
- **Response**: `TaskDto`
