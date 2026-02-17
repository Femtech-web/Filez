import { gql } from "graphql-request";

export const GET_MY_FILES = gql`
  query GetMyFiles($owner: Bytes!, $first: Int!, $skip: Int!) {
    files(
      where: { owner: $owner, isDeleted: false }
      first: $first
      skip: $skip
      orderBy: createdAt
      orderDirection: desc
    ) {
      id
      cid
      metadataCid
      owner
      ownerKeyChunks
      createdAt
      isDeleted
      deletedAt
      activeShareCount
      totalShareCount
    }
  }
`;

export const GET_SHARED_WITH_ME = gql`
  query GetShared($recipient: Bytes!, $first: Int!, $skip: Int!) {
    shares(
      where: {
        recipient: $recipient
        isRevoked: false
        isExpired: false
      }
      first: $first
      skip: $skip
      orderBy: sharedAt
      orderDirection: desc
    ) {
      id
      owner
      recipient
      file {
        id
        cid
        metadataCid
        isDeleted
      }
      keyChunks
      sharedAt
      expiresAt
      isRevoked
      revokedAt
      isExpired
      accessCount
      lastAccessedAt
    }
  }
`;

export const GET_FILE = gql`
  query GetFile($id: ID!) {
    file(id: $id) {
      id
      cid
      metadataCid
      owner
      ownerKeyChunks
      createdAt
      isDeleted
      deletedAt
      activeShareCount
      totalShareCount
    }
  }
`;

export const GET_FILE_ACTIVITY = gql`
  query FileActivity($id: ID!) {
    file(id: $id) {
      id
      owner
      createdAt
      activeShareCount
      totalShareCount
    }
    shares(where: { file: $id }, orderBy: sharedAt, orderDirection: desc) {
      id
      owner
      recipient
      sharedAt
      expiresAt
      isRevoked
      revokedAt
      isExpired
    }
    accessEvents(where: { file: $id }, orderBy: timestamp, orderDirection: desc, first: 50) {
      id
      accessor
      isOwnerAccess
      timestamp
      transactionHash
      blockNumber
    }
    revocationEvents(where: { file: $id }, orderBy: timestamp, orderDirection: desc) {
      id
      owner
      recipient
      timestamp
      transactionHash
    }
  }
`;

export const GET_USER_ACTIVITY = gql`
  query UserActivity($userAddress: Bytes!, $first: Int!, $skip: Int!) {
    # Files registered by user
    files(
      where: { owner: $userAddress }
      first: $first
      skip: $skip
      orderBy: createdAt
      orderDirection: desc
    ) {
      id
      cid
      metadataCid
      owner
      createdAt
      isDeleted
      deletedAt
    }

    # Shares created by user (as owner)
    sharesAsOwner: shares(
      where: { owner: $userAddress }
      first: $first
      orderBy: sharedAt
      orderDirection: desc
    ) {
      id
      file { id cid metadataCid }
      owner
      recipient
      sharedAt
      expiresAt
      isRevoked
    }

    # Shares received by user (as recipient)
    sharesAsRecipient: shares(
      where: { recipient: $userAddress }
      first: $first
      orderBy: sharedAt
      orderDirection: desc
    ) {
      id
      file { id cid metadataCid }
      owner
      recipient
      sharedAt
      expiresAt
      isRevoked
    }

    # Access events where user is accessor
    accessEvents(
      where: { accessor: $userAddress }
      first: $first
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      file { id cid metadataCid }
      accessor
      isOwnerAccess
      timestamp
      transactionHash
    }

    # Revocations by user (as owner)
    revocationsAsOwner: revocationEvents(
      where: { owner: $userAddress }
      first: $first
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      file { id cid metadataCid }
      owner
      recipient
      timestamp
      transactionHash
    }

    # Revocations affecting user (as recipient)
    revocationsAsRecipient: revocationEvents(
      where: { recipient: $userAddress }
      first: $first
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      file { id cid metadataCid }
      owner
      recipient
      timestamp
      transactionHash
    }
  }
`;

export const GET_GLOBAL_STATS = gql`
  query GlobalStats {
    globalStats(id: "global") {
      totalFiles
      activeFiles
      totalShares
      activeShares
      totalRevocations
      totalUsers
      lastUpdatedAt
    }
  }
`;
