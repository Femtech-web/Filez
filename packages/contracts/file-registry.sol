// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint64, externalEuint64 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

contract FileRegistry is ZamaEthereumConfig {

    /*==============================================================
                             STRUCT
    ==============================================================*/
    struct FileRecord {
      address owner;
      bytes cid;                    
      bytes32[4] ownerKeyChunks;   
      bytes metadataCid; 
    }

    /*==============================================================
                             STORAGE
    ==============================================================*/
    mapping(bytes32 => FileRecord) internal files;
    mapping(bytes32 => mapping(address => bytes32[4])) internal perRecipientKeyChunks;
    mapping(bytes32 => bool) internal exists;

    /*==============================================================
                             ERRORS
    ==============================================================*/
    error NotFileOwner();
    error FileNotFound();
    error AlreadyShared();
    error NoAccess();
    error InvalidInput();

    /*==============================================================
                             EVENTS 
    ==============================================================*/

    event FileRegistered(
      bytes32 indexed fileId,
      address indexed owner,
      bytes cid,
      bytes metadataCid,    
      bytes32[4] ownerKeyChunks,
      uint256 timestamp
    );

    event FileShared(
      bytes32 indexed fileId,
      address indexed owner,
      address indexed recipient,
      bytes32[4] keyChunksForRecipient,
      uint256 timestamp
    );

    event MetadataUpdated(
      bytes32 indexed fileId,
      bytes32 encryptedMetadata,
      uint256 timestamp
    );

    function registerFile(
      bytes32 fileId,
      bytes calldata cid,
      bytes calldata metadataCid, 
      externalEuint64 keyChunk0,
      externalEuint64 keyChunk1,
      externalEuint64 keyChunk2,
      externalEuint64 keyChunk3,
      bytes calldata inputProof
    ) external {
        if (exists[fileId]) revert InvalidInput();

        // Convert external -> encrypted
        euint64 k0 = FHE.fromExternal(keyChunk0, inputProof);
        euint64 k1 = FHE.fromExternal(keyChunk1, inputProof);
        euint64 k2 = FHE.fromExternal(keyChunk2, inputProof);
        euint64 k3 = FHE.fromExternal(keyChunk3, inputProof);

        // Make contract owner of these ciphertexts
        FHE.allowThis(k0);
        FHE.allowThis(k1);
        FHE.allowThis(k2);
        FHE.allowThis(k3);

        // Convert to bytes32 for storage
        bytes32 s0 = FHE.toBytes32(k0);
        bytes32 s1 = FHE.toBytes32(k1);
        bytes32 s2 = FHE.toBytes32(k2);
        bytes32 s3 = FHE.toBytes32(k3);

        files[fileId] = FileRecord({
            owner: msg.sender,
            cid: cid,
            ownerKeyChunks: [s0, s1, s2, s3],
            metadataCid: metadataCid
        });

        exists[fileId] = true;

        // Allow the owner to decrypt them
        FHE.allow(k0, msg.sender);
        FHE.allow(k1, msg.sender);
        FHE.allow(k2, msg.sender);
        FHE.allow(k3, msg.sender);

        emit FileRegistered(
          fileId,
          msg.sender,
          cid,
          metadataCid,
          [s0, s1, s2, s3],
          block.timestamp
        );
    }

    function shareFileWith(
      bytes32 fileId,
      address recipient,
      externalEuint64 keyChunk0,
      externalEuint64 keyChunk1,
      externalEuint64 keyChunk2,
      externalEuint64 keyChunk3,
      bytes calldata inputProof
    ) external {
      if (!exists[fileId]) revert FileNotFound();

      FileRecord storage fr = files[fileId];
      if (fr.owner != msg.sender) revert NotFileOwner();

      // prevent duplicate sharing
      if (perRecipientKeyChunks[fileId][recipient][0] != bytes32(0))
          revert AlreadyShared();

      // Convert to encrypted internal types
      euint64 k0 = FHE.fromExternal(keyChunk0, inputProof);
      euint64 k1 = FHE.fromExternal(keyChunk1, inputProof);
      euint64 k2 = FHE.fromExternal(keyChunk2, inputProof);
      euint64 k3 = FHE.fromExternal(keyChunk3, inputProof);

      // Allow contract and recipient
      FHE.allowThis(k0);
      FHE.allowThis(k1);
      FHE.allowThis(k2);
      FHE.allowThis(k3);

      FHE.allow(k0, recipient);
      FHE.allow(k1, recipient);
      FHE.allow(k2, recipient);
      FHE.allow(k3, recipient);

      // Store handles
      bytes32 s0 = FHE.toBytes32(k0);
      bytes32 s1 = FHE.toBytes32(k1);
      bytes32 s2 = FHE.toBytes32(k2);
      bytes32 s3 = FHE.toBytes32(k3);

      perRecipientKeyChunks[fileId][recipient] = [s0, s1, s2, s3];

      emit FileShared(
        fileId,
        msg.sender,
        recipient,
        [s0, s1, s2, s3],
        block.timestamp
      );
    }

    function requestAccess(bytes32 fileId)
      external
      view
      returns (bytes32[4] memory)
    {
      if (!exists[fileId]) revert FileNotFound();

      bytes32[4] memory chunks = perRecipientKeyChunks[fileId][msg.sender];
      if (chunks[0] == bytes32(0)) revert NoAccess();

      return chunks;
    }

    function getFileCID(bytes32 fileId) external view returns (bytes memory) {
      if (!exists[fileId]) revert FileNotFound();
      return files[fileId].cid;
    }

    function getOwnerEncryptedKeyChunks(bytes32 fileId)
      external
      view
      returns (bytes32[4] memory)
    {
      if (!exists[fileId]) revert FileNotFound();
      return files[fileId].ownerKeyChunks;
    }

    function getRecipientEncryptedKeyChunks(bytes32 fileId, address recipient)
      external
      view
      returns (bytes32[4] memory)
    {
      if (!exists[fileId]) revert FileNotFound();
      return perRecipientKeyChunks[fileId][recipient];
    }
}
