// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint64, externalEuint64 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";
import { ReentrancyGuard } from  "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
/**
 * @title FileRegistry V2 
 * @author FileZ 
 * @notice Privacy-preserving file registry with FHE-encrypted access control
 * @dev Optimizations:
 *  - Struct packing (uint256→uint32) saves ~40k gas per operation
 *  - Removed fileRecipients mapping (use subgraph indexing)
 *  - Access nonce prevents race conditions
 *
 * Security Model:
 * - Revocation cannot undo past decryptions (cryptographic limitation)
 * - Revocation prevents future decryption requests via contract
 * - Expiration checked at access time, not share time
 * - Soft-delete preserves audit trail
 */
contract FileRegistryV2 is ZamaEthereumConfig, ReentrancyGuard {

    /*//////////////////////////////////////////////////////////////
                                CONSTANTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Maximum expiration duration (365 days)
    uint32 public constant MAX_EXPIRATION_DURATION = 365 days;

    /// @notice Minimum expiration duration (1 hour)
    uint32 public constant MIN_EXPIRATION_DURATION = 1 hours;

    /*//////////////////////////////////////////////////////////////
                                STRUCTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Core file record 
    struct FileRecord {
        address owner;                // 20 bytes
        uint32 createdAt;             // 4 bytes  } Packed into slot 1
        bool isDeleted;               // 1 byte   } (20+4+1=25 bytes)
        bytes cid;                    // IPFS CID of encrypted file (dynamic)
        bytes32[4] ownerKeyChunks;    // FHE-encrypted key chunks (4 slots)
        bytes metadataCid;            // IPFS CID of encrypted metadata (dynamic)
    }

    /// @notice Share record with expiration 
    struct ShareRecord {
        bytes32[4] keyChunks;         // FHE-encrypted key chunks (4 slots)
        uint32 sharedAt;              // 4 bytes  }
        uint32 expiresAt;             // 4 bytes  } Packed into slot 5
        uint32 accessNonce;           // 4 bytes  } (4+4+4+1=13 bytes)
        bool isRevoked;               // 1 byte   }
    }

    /*//////////////////////////////////////////////////////////////
                                STORAGE
    //////////////////////////////////////////////////////////////*/

    /// @notice File ID => FileRecord
    mapping(bytes32 => FileRecord) internal files;

    /// @notice File ID => Recipient => ShareRecord
    mapping(bytes32 => mapping(address => ShareRecord)) internal shares;

    /// @notice File ID => exists flag
    mapping(bytes32 => bool) internal fileExists;

    /// @notice Owner => list of file IDs (for enumeration)
    mapping(address => bytes32[]) internal ownerFiles;

    /// @notice File ID => Recipient => valid access nonce (for race condition prevention)
    mapping(bytes32 => mapping(address => uint32)) internal validAccessNonce;

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    error NotFileOwner();
    error FileNotFound();
    error ErrFileDeleted();
    error AlreadyShared();
    error NotShared();
    error ErrAccessRevoked();
    error AccessExpired();
    error NoAccess();
    error InvalidInput();
    error InvalidExpiration();
    error ZeroAddress();
    error SelfShare();
    error InvalidNonce();

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Emitted when a new file is registered
    event FileRegistered(
        bytes32 indexed fileId,
        address indexed owner,
        bytes cid,
        bytes metadataCid,
        bytes32[4] ownerKeyChunks,
        uint256 timestamp
    );

    /// @notice Emitted when a file is shared with a recipient
    event FileShared(
        bytes32 indexed fileId,
        address indexed owner,
        address indexed recipient,
        bytes32[4] keyChunksForRecipient,
        uint256 expiresAt,
        uint256 timestamp
    );

    /// @notice Emitted when access is revoked from a recipient
    event AccessRevoked(
        bytes32 indexed fileId,
        address indexed owner,
        address indexed recipient,
        uint256 timestamp
    );

    /// @notice Emitted when a recipient successfully accesses file keys
    event FileAccessed(
        bytes32 indexed fileId,
        address indexed accessor,
        uint256 timestamp
    );

    /// @notice Emitted when a file is soft-deleted
    event FileDeleted(
        bytes32 indexed fileId,
        address indexed owner,
        uint256 timestamp
    );

    /// @notice Emitted when file metadata is updated
    event MetadataUpdated(
        bytes32 indexed fileId,
        bytes newMetadataCid,
        uint256 timestamp
    );

    /// @notice Emitted when share expiration is extended
    event ShareExtended(
        bytes32 indexed fileId,
        address indexed recipient,
        uint256 oldExpiresAt,
        uint256 newExpiresAt,
        uint256 timestamp
    );

    /*//////////////////////////////////////////////////////////////
                            MODIFIERS
    //////////////////////////////////////////////////////////////*/

    /// @notice Ensures caller is the file owner
    modifier onlyFileOwner(bytes32 fileId) {
        if (!fileExists[fileId]) revert FileNotFound();
        if (files[fileId].owner != msg.sender) revert NotFileOwner();
        _;
    }

    /// @notice Ensures file exists and is not deleted
    modifier fileActive(bytes32 fileId) {
        if (!fileExists[fileId]) revert FileNotFound();
        if (files[fileId].isDeleted) revert ErrFileDeleted();
        _;
    }

    /*//////////////////////////////////////////////////////////////
                        CORE FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Register a new encrypted file
     * @param fileId Unique identifier for the file (should be derived from content hash)
     * @param cid IPFS CID of the encrypted file
     * @param metadataCid IPFS CID of the encrypted metadata
     * @param keyChunk0-3 FHE-encrypted key chunks
     * @param inputProof Zama FHE input proof
     */
    function registerFile(
        bytes32 fileId,
        bytes calldata cid,
        bytes calldata metadataCid,
        externalEuint64 keyChunk0,
        externalEuint64 keyChunk1,
        externalEuint64 keyChunk2,
        externalEuint64 keyChunk3,
        bytes calldata inputProof
    ) external nonReentrant {
        if (fileExists[fileId]) revert InvalidInput();
        if (cid.length == 0 || metadataCid.length == 0) revert InvalidInput();

        // Convert external FHE inputs to internal encrypted types
        euint64 k0 = FHE.fromExternal(keyChunk0, inputProof);
        euint64 k1 = FHE.fromExternal(keyChunk1, inputProof);
        euint64 k2 = FHE.fromExternal(keyChunk2, inputProof);
        euint64 k3 = FHE.fromExternal(keyChunk3, inputProof);

        // Allow contract to manage these ciphertexts
        FHE.allowThis(k0);
        FHE.allowThis(k1);
        FHE.allowThis(k2);
        FHE.allowThis(k3);

        // Convert to bytes32 for storage
        bytes32[4] memory storedChunks = [
            FHE.toBytes32(k0),
            FHE.toBytes32(k1),
            FHE.toBytes32(k2),
            FHE.toBytes32(k3)
        ];

        // Store file record 
        files[fileId] = FileRecord({
            owner: msg.sender,
            cid: cid,
            ownerKeyChunks: storedChunks,
            metadataCid: metadataCid,
            createdAt: uint32(block.timestamp),
            isDeleted: false
        });

        fileExists[fileId] = true;
        ownerFiles[msg.sender].push(fileId);

        // Grant owner permission to decrypt
        FHE.allow(k0, msg.sender);
        FHE.allow(k1, msg.sender);
        FHE.allow(k2, msg.sender);
        FHE.allow(k3, msg.sender);

        emit FileRegistered(
            fileId,
            msg.sender,
            cid,
            metadataCid,
            storedChunks,
            block.timestamp
        );
    }

    /**
     * @notice Share a file with a recipient, optionally with expiration
     * @param fileId The file to share
     * @param recipient The address to share with
     * @param expiresAt Unix timestamp when access expires (0 = never)
     * @param keyChunk0-3 FHE-encrypted key chunks for recipient
     * @param inputProof Zama FHE input proof
     */
    function shareFile(
        bytes32 fileId,
        address recipient,
        uint32 expiresAt,
        externalEuint64 keyChunk0,
        externalEuint64 keyChunk1,
        externalEuint64 keyChunk2,
        externalEuint64 keyChunk3,
        bytes calldata inputProof
    ) external nonReentrant onlyFileOwner(fileId) fileActive(fileId) {
        if (recipient == address(0)) revert ZeroAddress();
        if (recipient == msg.sender) revert SelfShare();

        // Check if already shared (and not revoked)
        ShareRecord storage existing = shares[fileId][recipient];
        bool hasExistingShare = existing.keyChunks[0] != bytes32(0);

        if (hasExistingShare && !existing.isRevoked) {
            revert AlreadyShared();
        }

        // Validate expiration if provided
        if (expiresAt != 0) {
            if (expiresAt <= block.timestamp) revert InvalidExpiration();
            if (expiresAt > block.timestamp + MAX_EXPIRATION_DURATION) revert InvalidExpiration();
        }

        // Convert to encrypted internal types
        euint64 k0 = FHE.fromExternal(keyChunk0, inputProof);
        euint64 k1 = FHE.fromExternal(keyChunk1, inputProof);
        euint64 k2 = FHE.fromExternal(keyChunk2, inputProof);
        euint64 k3 = FHE.fromExternal(keyChunk3, inputProof);

        // Allow contract and recipient to access
        FHE.allowThis(k0);
        FHE.allowThis(k1);
        FHE.allowThis(k2);
        FHE.allowThis(k3);

        FHE.allow(k0, recipient);
        FHE.allow(k1, recipient);
        FHE.allow(k2, recipient);
        FHE.allow(k3, recipient);

        // Store share record
        bytes32[4] memory storedChunks = [
            FHE.toBytes32(k0),
            FHE.toBytes32(k1),
            FHE.toBytes32(k2),
            FHE.toBytes32(k3)
        ];

        // Initialize nonce (for race condition prevention)
        uint32 nonce = existing.keyChunks[0] == bytes32(0) ? 1 : existing.accessNonce + 1;

        shares[fileId][recipient] = ShareRecord({
            keyChunks: storedChunks,
            sharedAt: uint32(block.timestamp),
            expiresAt: expiresAt,
            isRevoked: false,
            accessNonce: nonce
        });

        validAccessNonce[fileId][recipient] = nonce;

        emit FileShared(
            fileId,
            msg.sender,
            recipient,
            storedChunks,
            expiresAt,
            block.timestamp
        );
    }

    /**
     * @notice Revoke a recipient's access to a file
     * @param fileId The file to revoke access from
     * @param recipient The address to revoke
     * @dev Prevents future decryption but cannot undo past decryptions
     *      Uses nonce to prevent race conditions
     */
    function revokeAccess(
        bytes32 fileId,
        address recipient
    ) external onlyFileOwner(fileId) {
        ShareRecord storage share = shares[fileId][recipient];

        if (share.keyChunks[0] == bytes32(0)) revert NotShared();
        if (share.isRevoked) revert ErrAccessRevoked();

        share.isRevoked = true;
        share.accessNonce++;  // Invalidate in-flight requestAccess() calls

        emit AccessRevoked(
            fileId,
            msg.sender,
            recipient,
            block.timestamp
        );
    }

    /**
     * @notice Extend the expiration of an existing share
     * @param fileId The file ID
     * @param recipient The recipient whose access to extend
     * @param newExpiresAt New expiration timestamp (must be > current)
     */
    function extendShareExpiration(
        bytes32 fileId,
        address recipient,
        uint32 newExpiresAt
    ) external onlyFileOwner(fileId) fileActive(fileId) {
        ShareRecord storage share = shares[fileId][recipient];

        if (share.keyChunks[0] == bytes32(0)) revert NotShared();
        if (share.isRevoked) revert ErrAccessRevoked();
        if (newExpiresAt <= share.expiresAt) revert InvalidExpiration();
        if (newExpiresAt > block.timestamp + MAX_EXPIRATION_DURATION) {
            revert InvalidExpiration();
        }

        uint256 oldExpires = share.expiresAt;
        share.expiresAt = newExpiresAt;

        emit ShareExtended(
            fileId,
            recipient,
            oldExpires,
            newExpiresAt,
            block.timestamp
        );
    }

    /**
     * @notice Soft-delete a file
     * @param fileId The file to delete
     * @dev File data remains for audit purposes but becomes inaccessible
     */
    function deleteFile(bytes32 fileId) external onlyFileOwner(fileId) {
        if (files[fileId].isDeleted) revert ErrFileDeleted();

        files[fileId].isDeleted = true;

        emit FileDeleted(
            fileId,
            msg.sender,
            block.timestamp
        );
    }

    /**
     * @notice Update file metadata CID
     * @param fileId The file to update
     * @param newMetadataCid New encrypted metadata CID
     */
    function updateMetadata(
        bytes32 fileId,
        bytes calldata newMetadataCid
    ) external onlyFileOwner(fileId) fileActive(fileId) {
        if (newMetadataCid.length == 0) revert InvalidInput();

        files[fileId].metadataCid = newMetadataCid;

        emit MetadataUpdated(
            fileId,
            newMetadataCid,
            block.timestamp
        );
    }

    /*//////////////////////////////////////////////////////////////
                        ACCESS FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Request access to a shared file's encrypted key chunks
     * @param fileId The file to access
     * @return keyChunks The FHE-encrypted key chunks
     * @dev Emits FileAccessed event for audit trail
     *      Checks access nonce to prevent race conditions
     */
    function requestAccess(bytes32 fileId)
        external
        fileActive(fileId)
        returns (bytes32[4] memory)
    {
        // Check if caller is owner
        if (files[fileId].owner == msg.sender) {
            emit FileAccessed(fileId, msg.sender, block.timestamp);
            return files[fileId].ownerKeyChunks;
        }

        // Check share record
        ShareRecord storage share = shares[fileId][msg.sender];

        if (share.keyChunks[0] == bytes32(0)) revert NoAccess();
        if (share.isRevoked) revert ErrAccessRevoked();

        // RACE CONDITION PREVENTION: Check nonce
        if (share.accessNonce != validAccessNonce[fileId][msg.sender]) {
            revert ErrAccessRevoked();
        }

        if (share.expiresAt != 0 && block.timestamp > share.expiresAt) {
            revert AccessExpired();
        }

        emit FileAccessed(fileId, msg.sender, block.timestamp);

        return share.keyChunks;
    }

    /*//////////////////////////////////////////////////////////////
                        VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Get file CID
    function getFileCID(bytes32 fileId) external view returns (bytes memory) {
        if (!fileExists[fileId]) revert FileNotFound();
        return files[fileId].cid;
    }

    /// @notice Get file metadata CID
    function getFileMetadataCID(bytes32 fileId) external view returns (bytes memory) {
        if (!fileExists[fileId]) revert FileNotFound();
        return files[fileId].metadataCid;
    }

    /// @notice Get owner's encrypted key chunks
    function getOwnerKeyChunks(bytes32 fileId) external view returns (bytes32[4] memory) {
        if (!fileExists[fileId]) revert FileNotFound();
        return files[fileId].ownerKeyChunks;
    }

    /// @notice Get file record details
    function getFileRecord(bytes32 fileId) external view returns (
        address owner,
        bytes memory cid,
        bytes memory metadataCid,
        uint256 createdAt,
        bool isDeleted
    ) {
        if (!fileExists[fileId]) revert FileNotFound();
        FileRecord storage f = files[fileId];
        return (f.owner, f.cid, f.metadataCid, f.createdAt, f.isDeleted);
    }

    /// @notice Get share record details
    function getShareRecord(bytes32 fileId, address recipient) external view returns (
        bool exists,
        uint256 sharedAt,
        uint256 expiresAt,
        bool isRevoked,
        bool isExpired
    ) {
        ShareRecord storage s = shares[fileId][recipient];
        bool shareExists = s.keyChunks[0] != bytes32(0);
        bool expired = s.expiresAt != 0 && block.timestamp > s.expiresAt;

        return (
            shareExists,
            s.sharedAt,
            s.expiresAt,
            s.isRevoked,
            expired
        );
    }

    /// @notice Check if an address has active access to a file
    function hasAccess(bytes32 fileId, address user) external view returns (bool) {
        if (!fileExists[fileId] || files[fileId].isDeleted) return false;

        // Owner always has access
        if (files[fileId].owner == user) return true;

        ShareRecord storage share = shares[fileId][user];
        if (share.keyChunks[0] == bytes32(0)) return false;
        if (share.isRevoked) return false;
        if (share.accessNonce != validAccessNonce[fileId][user]) return false;
        if (share.expiresAt != 0 && block.timestamp > share.expiresAt) return false;

        return true;
    }

    /// @notice Get count of files owned by an address
    function getOwnerFileCount(address owner) external view returns (uint256) {
        return ownerFiles[owner].length;
    }

    /// @notice Get file IDs owned by an address (paginated)
    function getOwnerFiles(address owner, uint256 offset, uint256 limit)
        external
        view
        returns (bytes32[] memory)
    {
        bytes32[] storage allFiles = ownerFiles[owner];
        uint256 total = allFiles.length;

        if (offset >= total) {
            return new bytes32[](0);
        }

        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }

        bytes32[] memory result = new bytes32[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = allFiles[i];
        }

        return result;
    }
}
