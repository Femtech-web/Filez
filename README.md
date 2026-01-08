<div align="center">

# 🗄️ FILEZ

### **Private, Permissioned File Sharing — Enforced On-Chain With FHE**

_FileZ lets you store, share, and manage files privately using fully homomorphic encryption._
_Access rights are enforced on-chain using encrypted values, without revealing your file, metadata, or keys to anyone._

**Only the intended recipient can ever decrypt.**

**[🎥 Watch Full Demo Video](https://youtu.be/qcCBQ687Pk8)**

</div>

---

## 🌟 Overview

**FILEZ** is a **privacy-preserving file storage and sharing system** built on Zama’s **FHEVM**, where **file access permissions and encryption keys remain encrypted at all times** — even from the smart contract, node operator, or backend.

Traditional decentralized storage systems (IPFS, Filecoin, Arweave) allow public retrieval, but **access control always happens off-chain** and is often trust-based.

FILEZ fixes that.

### What FILEZ enables

- Upload a file (doc, audio, video etc) → client encrypts it → stores the encrypted file on IPFS.
- Only store:
  - encrypted file CID
  - encrypted metadata CID
  - encrypted per-user key shares  
    **on-chain.**
- All encryption key permissions remain protected using **FHE encrypted key chunks**.
- Smart contract enforces:
  - ownership
  - sharing rules
  - per-user access  
    — **without ever seeing the decrypted keys.**

This means:

> **Even the blockchain cannot see your keys, permissions, or relationships.**

---

### Why FileZ Matters

Every decentralized storage system today has a fatal flaw:

> **Files are encrypted, but permissions are not.**

Access control is always off-chain, meaning someone must trust:

- a backend
- a gateway
- a coordinator
- or ACL logic in plaintext

This breaks privacy.

**FileZ eliminates trust entirely.**

- Permissions are encrypted under FHE
- Smart contracts validate access without seeing the data
- Only the intended recipient can decrypt key material
- No server, indexer, or chain node can read anything

This is the **first true on-chain privacy-preserving file-sharing primitive**.

---

## 🧩 Core Components

### 1. Client (Next.js)

Handles all local cryptography:

- AES encrypt file
- Split + encrypt key into 4 × euint64
- Upload encrypted file + metadata to IPFS
- Call smart contract for registration / sharing

### 2. Smart Contract (FHEVM + Solidity)

Maintains encrypted permission state:

- Stores encrypted CIDs
- Stores per-user encrypted key chunks
- Enforces ownership & sharing rules
- Never touches plaintext

### 3. Storage Layer (IPFS)

- Stores encrypted files
- Stores encrypted metadata
- No visibility into content

### 4. Indexing Layer (Subgraph)

- Indexes FileRegistered & FileShared events
- Serves fast GraphQL queries for:
  - My Files
  - Shared With Me
  - Pagination
  - File metadata analytics

---

## 🛠️ Features

- ### **End-to-End Encrypted File Storage**

Client encrypts files, not the smart contract.

- ### **Encrypted Access Control**

AES key is split, encrypted as FHE `euint64` chunks, and stored on-chain.

- ### **Per-Recipient Encrypted Key Distribution**

Each user gets their own encrypted key chunks.

- ### **Encrypted Metadata**

Even metadata (name, size, type, etc) are encrypted before uploading.

- ### **Zero-Knowledge Access Verification**

Unauthorized users cannot retrieve key chunks.

---

## ⚙️ How it Works (High-Level Flow)

1️⃣ **User uploads file**  
→ Client encrypts file locally  
→ Generates AES key  
→ Splits AES key into 4 FHE-encrypted chunks

2️⃣ **Client uploads encrypted file + metadata**  
→ Stored on decentralized storage

3️⃣ **Client registers file on-chain**  
→ Sends encrypted CID  
→ Sends encrypted metadata CID  
→ Sends encrypted AES key chunks  
→ Smart contract stores them _without decrypting them_

4️⃣ **Owner shares file**  
→ Creates new encrypted key chunks for a recipient  
→ Smart contract stores per-recipient encrypted chunks

5️⃣ **Recipient requests access**  
→ Receives encrypted chunks  
→ Decrypts using their FHE permissions  
→ Reconstructs AES key  
→ Retrieves file from storage  
→ Decrypts locally

All without trust.

---

## 🧬 System Architecture

        ┌────────────────────────┐
        │      Client (Next.js)  │
        │ - AES encrypt file     │
        │ - Encrypt key chunks   │
        │ - Upload to IPFS       │
        │ - Call contract        │
        └──────────┬─────────────┘
                   │
                   ▼
       ┌─────────────────────────────┐
       │   FHEVM Smart Contract      │
       │ - Store encrypted CIDs      │
       │ - Store encrypted keychunks │
       │ - Handle sharing rules      │
       │ - Never sees data           │
       └───────────┬────────────────┘
                   │
                   ▼
     ┌───────────────────────────────┐
     │   Decentralized Storage       │
     │ - Encrypted files             │
     │ - Encrypted metadata          │
     └───────────────────────────────┘
                   ▲
                   │
             (reads when decrypting)
                   │
                   ▼
     ┌───────────────────────────────┐
     │      Subgraph / Indexer       │
     │ - Indexes FileRegistered,     │
     │   FileShared, MetadataUpdated │
     │ - Serves GraphQL queries for  │
     │   UI: MyFiles, SharedWithMe   │
     │ - Provides pagination, stats  │
     └───────────────────────────────┘

---

## 🧱 END TO END WORKFLOW

```mermaid
%%{init: {'theme':'dark', 'themeVariables': {
    'primaryColor':'#a855f7',
    'primaryTextColor':'#fff',
    'primaryBorderColor':'#9333ea',
    'lineColor':'#a855f7',
    'secondaryColor':'#3b82f6',
    'tertiaryColor':'#10b981',
    'background':'#111',
    'mainBkg':'#1b1b1b',
    'secondBkg':'#242424',
    'labelBackground':'#242424',
    'labelTextColor':'#fff',
    'actorBkg':'#2f2f2f',
    'actorBorder':'#a855f7',
    'actorTextColor':'#fff',
    'signalColor':'#a855f7',
    'signalTextColor':'#fff'
}}}%%
sequenceDiagram
    participant U as User (Owner)
    participant C as Client App
    participant S as Storage (IPFS)
    participant SC as FileRegistry (FHEVM)
    participant IDX as Indexer (Subgraph)
    participant R as Recipient

    rect rgb(30,50,90)
        Note over U,SC: STAGE 1 · Private File Upload
        U->>C: Upload file
        C->>C: Encrypt file (AES)
        C->>C: Split + Encrypt AES key → 4× euint64
        C->>S: Upload encrypted file + metadata
        S-->>C: Return CIDs

        C->>SC: registerFile(fileId, encrypted CIDs, encrypted keychunks)
        SC-->>C: File registered
        SC-->>IDX: Emit FileRegistered event
        IDX-->>C: UI fetches "My Files" via GraphQL
    end

    rect rgb(40,80,60)
        Note over U,IDX: STAGE 2 · Permissioned Sharing
        U->>C: Share file with Recipient
        C->>C: Encrypt new keychunks for R
        C->>SC: shareFileWith(fileId, R, encrypted keychunks)
        SC-->>C: Sharing OK
        SC-->>IDX: Emit FileShared event
        IDX-->>C: UI updates "Shared With Me" list
    end

    rect rgb(80,60,40)
        Note over R,S: STAGE 3 · Access & Decryption
        R->>SC: requestAccess(fileId)
        SC-->>R: Encrypted key chunks
        R->>C: Decrypt chunks → Rebuild AES key
        C->>S: Download encrypted file
        C->>R: Decrypt file locally
    end

```

---

## 📊 Deployed Contract

| Contract Name | Address                                    | Explorer Link                                                                                        |
| ------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| FileRegistry  | 0x414117f52c51849B174545839780B85E672A1cdE | [View on Etherscan](https://sepolia.etherscan.io/address/0x414117f52c51849B174545839780B85E672A1cdE) |

---

## 🚀 Getting Started

Follow these steps to run, test, and develop **FileZ** locally using **Next.js, Hardhat, FHEVM, and The Graph**.

---

### ✅ 1. Install Dependencies

```bash
cd packages
npm install
```

---

### ✅ 2. Configure Environment Variables

Create **`.env`** in the project root:

```
NEXT_PUBLIC_WEB3_STORAGE_KEY=your_key_here
NEXT_PUBLIC_WALLET_CONNECT_ID=your_walletconnect_project_id

# FHEVM expected variables
PRIVATE_KEY_KMS_SIGNER=
PRIVATE_KEY_COPROCESSOR_SIGNER=

# For local Hardhat chain RPC
LOCAL_RPC_URL=http://127.0.0.1:8545

# Optional: Subgraph endpoint
NEXT_PUBLIC_SUBGRAPH_URL=http://localhost:8000/subgraphs/name/filez
```

You must also configure:

#### **IPFS / Storage Layer (Storacha)**

---

### ✅ 3. Start Local FHEVM Dev Chain

This launches the Hardhat chain _with FHEVM mock enabled_:

```bash
npx hardhat node
```

---

### ✅ 4. Compile Contracts

```bash
cd packages
npx hardhat compile
```

If using TypeChain:

```bash
cd packages
npx hardhat typechain
```

---

### ✅ 5. Run Tests (FHEVM-Based)

```bash
cd packages
npx hardhat test
```

---

### ✅ 6. Start the Frontend (Next.js)

```bash
cd packages
npm run dev
```

### ✅ 7. Start the Indexer (Subgraph)

If using The Graph locally:

```bash
cd indexer
docker compose up --build
graph codegen
graph build
graph create filez
graph deploy filez
```

Or using Hosted Service:
Deploy via:

```bash
cd indexer
graph deploy --product hosted-service <subgraph-name>
```

---

## 🧰 Tech Stack

- **Frontend:** Next.js 14, Wagmi, RainbowKit, Framer Motion
- **Crypto:** AES-GCM (file encryption), FHEVM (key encryption)
- **Smart Contracts:** Solidity + Zama FHEVM
- **Storage:** IPFS (web3.storage / Storacha)
- **Indexing:** The Graph (Hosted Service)
- **Testing:** Hardhat, Chai, Matchstick

---

## 🧪 Test Coverage Summary

#### ✔ Encrypted File Registration

- Valid ciphertext accepted
- Invalid input proofs rejected
- Duplicate `fileId` prevented

#### ✔ Sharing Logic

- Owner-only sharing
- Duplicate share attempts blocked
- New encrypted key chunks allowed only per recipient

#### ✔ Access Management

- Recipient-only access
- Unauthorized access rejected
- Missing fileId rejected

#### ✔ Getters

- CID retrieval
- Owner keychunk retrieval
- Per-recipient keychunk retrieval

#### ✔ FHEVM Validation

- InputVerifier
- Proof verification
- Encrypted handles
- Proper FHE permissioning

---

## 🎯 Future Work

- **Encrypted search:** Query encrypted file metadata without revealing keywords
- **Group sharing:** Multi-user encrypted collaboration
- **Re-keying system:** Allow revocation + key rotation without re-upload
- **Encrypted thumbnails:** Share file previews securely
- **FHE-enabled analytics:** Usage analytics computed on ciphertext

---

## 📄 License

MIT License — see **LICENSE** file.

---

\*adding a small change\*\*
