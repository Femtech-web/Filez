import { gql } from "graphql-request";

export const GET_MY_FILES = gql`
  query GetMyFiles($owner: Bytes!, $first: Int!, $skip: Int!) {
    files(
      where: { owner: $owner }
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
    }
  }
`;

export const GET_SHARED_WITH_ME = gql`
  query GetShared($recipient: Bytes!, $first: Int!, $skip: Int!) {
    shares(
      where: { recipient: $recipient }
      first: $first
      skip: $skip
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      owner
      recipient
      file { id }
      keyChunks
      timestamp
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
    }
  }
`;

export const GET_FILE_ACTIVITY = gql`
  query FileActivity($id: ID!) {
    file(id: $id) {
      id
      owner
      createdAt
    }
    shares(where: { file: $id }, orderBy: timestamp, orderDirection: desc) {
      owner
      recipient
      timestamp
    }
  }
`;
