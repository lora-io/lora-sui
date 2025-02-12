# Lora Agent

An innovative modular AI agent platform on SUI that makes AI creation effortless.

With LORA, you can create and customize your own AI agent in minutes, easily configuring components
such as LLMs, knowledge bases, and tools.

## Features

### Knowledge Base

- Upload websites as agent knowledge base
- Utilizes RAG (Retrieval-Augmented Generation) technology for loading, chunking and retrieval
- Efficient document processing and information extraction

### Function Tools

- Developers can use or provide custom agent tools to access external data
- Built-in tools include:
  - Web search
  - SUI token search
  - Twitter Trending News
- Future community-driven agent tool hub

### 3rd-party Integrations

- Platform supports seamless integration with:
  - Telegram
  - Discord
  - Twitter
- Features:
  - Automated message replies
  - Proactive message sending

### Advanced Features

- Isolated sandbox environment for agent testing and preview
- Runtime logging terminal (WIP) for execution monitoring
- Complete API suite for developers
  - Query capabilities
  - Task execution
  - Integration endpoints

### Multi-agent Collaboration - WIP

- Communication protocol for multi-agent collaboration
- Enables multi-agent network creation
- Features:
  - Agent-to-agent communication
  - Collaborative task completion
  - Complex task decomposition and execution

## Structure

```
├── apps/
│   ├── api/        # Agent API
├── packages/
│   └── db/         # Prisma database package
├── pnpm-workspace.yaml
└── package.json
```

## Setup

### Install dependencies

```bash
pnpm install
```

### Start development servers

```bash
# API
cd apps/api
pnpm dev

# Web
cd apps/web
pnpm dev
```

## Scripts

- `pnpm dev` - Start development servers
- `pnpm build` - Build all packages
- `pnpm lint` - Lint all packages
- `pnpm test` - Run tests
