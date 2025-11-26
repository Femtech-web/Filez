# filez-indexer

filez-indexer is a subgraph project designed to index file registry data from a blockchain and store metadata in IPFS. The project leverages The Graph protocol to create a scalable, queryable index of file events, enabling developers to retrieve file information efficiently through GraphQL queries.

The architecture is built around a set of TypeScript source files that define the subgraph mappings, along with a generated schema that maps blockchain events to entities. The subgraph is configured via a subgraph.yaml file, which specifies the data sources, handlers, and the Graph node to connect to. The project also includes a Docker Compose configuration for local deployment of a Graph node and IPFS gateway.

Beyond the core indexing logic, the repository contains a comprehensive data directory that mirrors an IPFS datastore structure, a PostgreSQL database snapshot, and ABI definitions for interacting with the FileRegistry smart contract. This setup allows for both on-chain and off-chain data to be queried in a unified manner, making file metadata readily available to front‑end applications or other services.

## Technologies

- JavaScript
- TypeScript
- The Graph
- PostgreSQL
- IPFS

## Features

### File Registry Indexing

Captures events emitted by the FileRegistry smart contract and stores them as entities in the subgraph. This allows users to query file ownership, metadata, and status via GraphQL.

**Relevant Files:**

- `src/file-registry.ts`
- `generated/FileRegistry/FileRegistry.ts`

### IPFS Data Handling

Integrates with an IPFS datastore to persist and retrieve file content hashes. The data directory contains a full IPFS node snapshot, enabling the subgraph to reference off‑chain data directly.

**Relevant Files:**

- `data/ipfs`

### Subgraph Schema Generation

Automated generation of TypeScript types and GraphQL schema from the subgraph.yaml configuration. The generated folder holds the compiled schema and entity definitions used by the Graph node.

**Relevant Files:**

- `generated/schema.ts`
- `generated/FileRegistry/FileRegistry.ts`

## Dependencies

- **@graphprotocol/graph-cli** — Command line interface for creating, building, and deploying subgraphs. _(Category: framework)_
- **@graphprotocol/graph-ts** — TypeScript library providing utilities for writing subgraph mappings. _(Category: framework)_
- **matchstick-as** — Testing framework for The Graph subgraphs, enabling unit tests written in AssemblyScript. _(Category: testing)_

## Project Structure

```text
├── abis
├── docker-compose.yml
├── generated
│   ├── FileRegistry
│   │   ├── FileRegistry.ts
│   ├── schema.ts
├── package.json
├── schema.graphql
├── src
│   ├── file-registry.ts
├── subgraph.yaml
├── tsconfig.json
```

## Core Folders

- **abis** — Contains ABI JSON files for smart contracts used by the subgraph.
- **data** — Holds a snapshot of an IPFS datastore and a PostgreSQL database used for off‑chain data persistence.
- **generated** — Auto‑generated TypeScript types and GraphQL schema derived from the subgraph configuration.
- **src** — Source code for subgraph mappings and utility functions.

## Installation

1. Clone the repository.
2. Run `npm install` to install dependencies.
3. Ensure Docker is running for the local Graph node and IPFS services.
4. Run `docker-compose up -d` to start the services.

## Development

- Generate TypeScript types: `graph codegen`.
- Build the subgraph: `graph build`.
- Deploy locally: `graph deploy --node http://localhost:8020 --ipfs http://localhost:5001 filez-indexer`.

## Testing

- Write tests in the `tests` directory using matchstick-as.
- Run tests with `npm test`.

## Deployment

- Authenticate with a Graph node endpoint.
- Deploy the subgraph using `graph deploy` with the appropriate network configuration.

## Smart Contracts

### `abis/FileRegistry.json`

ABI for the FileRegistry smart contract, used to decode blockchain events.

---
