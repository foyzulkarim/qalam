# Qalam Documentation

Technical documentation for the Qalam project.

## Core Documentation

| Document | Description |
|----------|-------------|
| [Architecture](./architecture.md) | Technical overview, data flow, project structure |
| [Setup Guide](./setup.md) | Development and deployment instructions |
| [Local Development](./LOCAL_DEVELOPMENT.md) | Step-by-step local setup guide |
| [LLM Integration](./llm-integration.md) | How verse analysis is generated + runtime evaluation |
| [Learning Philosophy](./learning-philosophy.md) | Pedagogical approach and design principles |

## Analysis Generation

Technical reference for the LLM analysis generation system:

| Document | Description |
|----------|-------------|
| [Analysis Prompts](./analysis-prompt.md) | Overview of the two-phase prompt strategy |
| [Base Prompt](./analysis-prompt-base.md) | Phase 1: Verse info and word list |
| [Word Prompt](./analysis-prompt-word.md) | Phase 2: Detailed word analysis |
| [Schema](./analysis-schema.json) | JSON schema for analysis output |

## Quick Links

- **Worker API**: See [worker/README.md](../worker/README.md)
- **Main README**: See [README.md](../README.md)
