# API Documentation

This directory contains the documentation for the **agent-flow-v2** API.

## Overview

The API Gateway acts as the central entry point for the Dashboard. It handles request validation, authentication, and
orchestrates calls between the various agents and the database.

## Documents

- [Endpoints](./endpoints.md): Detailed description of REST API endpoints.
- [Events](./events.md): Description of the event-driven system and BullMQ jobs.

## Tech Stack

- **Framework**: NestJS with Fastify adapter.
- **Validation**: `class-validator` and DTOs.
- **Communication**: REST for Frontend-to-Backend, BullMQ for internal events.
