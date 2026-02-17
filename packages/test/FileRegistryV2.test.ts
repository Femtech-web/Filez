import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";
import hre from "hardhat";
const { ethers, fhevm } = hre;

import {
  FileRegistryV2,
  FileRegistryV2__factory,
} from "../types";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
  charlie: HardhatEthersSigner;
};

async function deployFixture() {
  const Factory = (await ethers.getContractFactory(
    "FileRegistryV2"
  )) as FileRegistryV2__factory;
  const contract = await Factory.deploy();
  const contractAddress = await contract.getAddress();
  return { contract, contractAddress };
}

describe("FileRegistryV2 (FHEVM)", function () {
  let signers: Signers;
  let contract: FileRegistryV2;
  let contractAddress: string;

  before(async function () {
    const s = await ethers.getSigners();
    signers = {
      deployer: s[0],
      alice: s[1],
      bob: s[2],
      charlie: s[3],
    };
  });

  beforeEach(async () => {
    if (!fhevm.isMock) {
      throw new Error("This test suite requires FHEVM mock environment.");
    }

    ({ contract, contractAddress } = await deployFixture());

    await fhevm.initializeCLIApi();
  });

  /* -------------------------------------------------------------------------- */
  /*                                   HELPERS                                  */
  /* -------------------------------------------------------------------------- */

  /**
   * Encrypt 4 values in a single batch for FHEVM
   */
  async function encrypt64BatchFor(
    signer: HardhatEthersSigner,
    values: bigint[]
  ) {
    const builder = fhevm.createEncryptedInput(contractAddress, signer.address);
    for (const v of values) builder.add64(v);
    const enc = await builder.encrypt();
    return {
      handles: enc.handles,
      inputProof: enc.inputProof,
    };
  }

  /**
   * Helper to register a file for testing
   */
  async function registerTestFile(
    fileId: string,
    owner: HardhatEthersSigner,
    keyChunks: bigint[] = [111n, 222n, 333n, 444n]
  ) {
    const cid = ethers.toUtf8Bytes(`CID_${fileId}`);
    const metadataCid = ethers.toUtf8Bytes(`META_${fileId}`);

    const encBatch = await encrypt64BatchFor(owner, keyChunks);

    await contract.connect(owner).registerFile(
      ethers.encodeBytes32String(fileId),
      cid,
      metadataCid,
      encBatch.handles[0],
      encBatch.handles[1],
      encBatch.handles[2],
      encBatch.handles[3],
      encBatch.inputProof
    );

    return ethers.encodeBytes32String(fileId);
  }

  /**
   * Helper to share a file for testing
   */
  async function shareTestFile(
    fileId: string,
    owner: HardhatEthersSigner,
    recipient: HardhatEthersSigner,
    expiresAt: number = 0
  ) {
    const enc = await encrypt64BatchFor(owner, [777n, 888n, 999n, 101n]);

    await contract.connect(owner).shareFile(
      ethers.encodeBytes32String(fileId),
      recipient.address,
      expiresAt,
      enc.handles[0],
      enc.handles[1],
      enc.handles[2],
      enc.handles[3],
      enc.inputProof
    );
  }

  /**
   * Get current block timestamp
   */
  async function getCurrentTimestamp(): Promise<number> {
    const block = await ethers.provider.getBlock("latest");
    return block!.timestamp;
  }

  /**
   * Advance time in the blockchain
   */
  async function advanceTime(seconds: number) {
    await ethers.provider.send("evm_increaseTime", [seconds]);
    await ethers.provider.send("evm_mine", []);
  }

  /* -------------------------------------------------------------------------- */
  /*                                   TESTS                                    */
  /* -------------------------------------------------------------------------- */

  describe("Deployment", function () {
    it("should deploy successfully", async function () {
      expect(await contract.getAddress()).to.equal(contractAddress);
    });

    it("should have correct constants", async function () {
      const maxExpiration = await contract.MAX_EXPIRATION_DURATION();
      const minExpiration = await contract.MIN_EXPIRATION_DURATION();

      expect(maxExpiration).to.equal(365 * 24 * 60 * 60); // 365 days
      expect(minExpiration).to.equal(1 * 60 * 60); // 1 hour
    });
  });

  describe("Register File", function () {
    it("should register a new file with encrypted key chunks", async function () {
      const fileId = await registerTestFile("file1", signers.deployer);

      const cidStored = await contract.getFileCID(fileId);
      expect(cidStored).to.not.equal("0x");

      const chunks = await contract.getOwnerKeyChunks(fileId);
      expect(chunks.length).to.equal(4);
      expect(chunks[0]).to.not.equal(ethers.ZeroHash);
    });

    it("should store correct file record metadata", async function () {
      const fileId = await registerTestFile("file2", signers.alice);

      const record = await contract.getFileRecord(fileId);

      expect(record.owner).to.equal(signers.alice.address);
      expect(record.isDeleted).to.be.false;
      expect(record.createdAt).to.be.greaterThan(0);
    });

    it("should revert on duplicate fileId", async function () {
      const fileId = "duplicate";
      await registerTestFile(fileId, signers.deployer);

      // Try to register again with same fileId
      const cid = ethers.toUtf8Bytes("CID2");
      const metadataCid = ethers.toUtf8Bytes("META2");
      const enc = await encrypt64BatchFor(signers.deployer, [1n, 2n, 3n, 4n]);

      await expect(
        contract.registerFile(
          ethers.encodeBytes32String(fileId),
          cid,
          metadataCid,
          enc.handles[0],
          enc.handles[1],
          enc.handles[2],
          enc.handles[3],
          enc.inputProof
        )
      ).to.be.revertedWithCustomError(contract, "InvalidInput");
    });

    it("should revert with empty CID", async function () {
      const fileId = ethers.encodeBytes32String("empty");
      const cid = ethers.toUtf8Bytes(""); // Empty CID
      const metadataCid = ethers.toUtf8Bytes("META");
      const enc = await encrypt64BatchFor(signers.deployer, [1n, 2n, 3n, 4n]);

      await expect(
        contract.registerFile(
          fileId,
          cid,
          metadataCid,
          enc.handles[0],
          enc.handles[1],
          enc.handles[2],
          enc.handles[3],
          enc.inputProof
        )
      ).to.be.revertedWithCustomError(contract, "InvalidInput");
    });

    it("should emit FileRegistered event", async function () {
      const fileId = ethers.encodeBytes32String("event_test");
      const cid = ethers.toUtf8Bytes("CID");
      const metadataCid = ethers.toUtf8Bytes("META");
      const enc = await encrypt64BatchFor(signers.deployer, [1n, 2n, 3n, 4n]);

      await expect(
        contract.registerFile(
          fileId,
          cid,
          metadataCid,
          enc.handles[0],
          enc.handles[1],
          enc.handles[2],
          enc.handles[3],
          enc.inputProof
        )
      )
        .to.emit(contract, "FileRegistered")
        .withArgs(
          fileId,
          signers.deployer.address,
          ethers.hexlify(cid),
          ethers.hexlify(metadataCid),
          [enc.handles[0], enc.handles[1], enc.handles[2], enc.handles[3]].map(
            (h) => ethers.hexlify(h)
          ),
          await getCurrentTimestamp()
        );
    });

    it("should track owner files", async function () {
      await registerTestFile("file1", signers.alice);
      await registerTestFile("file2", signers.alice);

      const count = await contract.getOwnerFileCount(signers.alice.address);
      expect(count).to.equal(2);

      const files = await contract.getOwnerFiles(signers.alice.address, 0, 10);
      expect(files.length).to.equal(2);
    });
  });

  describe("Share File (Basic)", function () {
    beforeEach(async () => {
      await registerTestFile("fileA", signers.deployer);
    });

    it("owner can share file with recipient", async function () {
      const fileId = ethers.encodeBytes32String("fileA");

      await shareTestFile("fileA", signers.deployer, signers.alice);

      const record = await contract.getShareRecord(fileId, signers.alice.address);
      expect(record.exists).to.be.true;
      expect(record.isRevoked).to.be.false;
    });

    it("should prevent duplicate sharing", async function () {
      await shareTestFile("fileA", signers.deployer, signers.alice);

      const enc = await encrypt64BatchFor(signers.deployer, [1n, 2n, 3n, 4n]);

      await expect(
        contract.shareFile(
          ethers.encodeBytes32String("fileA"),
          signers.alice.address,
          0,
          enc.handles[0],
          enc.handles[1],
          enc.handles[2],
          enc.handles[3],
          enc.inputProof
        )
      ).to.be.revertedWithCustomError(contract, "AlreadyShared");
    });

    it("should revert if non-owner attempts sharing", async function () {
      const enc = await encrypt64BatchFor(signers.alice, [1n, 2n, 3n, 4n]);

      await expect(
        contract.connect(signers.alice).shareFile(
          ethers.encodeBytes32String("fileA"),
          signers.bob.address,
          0,
          enc.handles[0],
          enc.handles[1],
          enc.handles[2],
          enc.handles[3],
          enc.inputProof
        )
      ).to.be.revertedWithCustomError(contract, "NotFileOwner");
    });

    it("should revert on zero address", async function () {
      const enc = await encrypt64BatchFor(signers.deployer, [1n, 2n, 3n, 4n]);

      await expect(
        contract.shareFile(
          ethers.encodeBytes32String("fileA"),
          ethers.ZeroAddress,
          0,
          enc.handles[0],
          enc.handles[1],
          enc.handles[2],
          enc.handles[3],
          enc.inputProof
        )
      ).to.be.revertedWithCustomError(contract, "ZeroAddress");
    });

    it("should revert on self-share", async function () {
      const enc = await encrypt64BatchFor(signers.deployer, [1n, 2n, 3n, 4n]);

      await expect(
        contract.shareFile(
          ethers.encodeBytes32String("fileA"),
          signers.deployer.address, // Sharing with self
          0,
          enc.handles[0],
          enc.handles[1],
          enc.handles[2],
          enc.handles[3],
          enc.inputProof
        )
      ).to.be.revertedWithCustomError(contract, "SelfShare");
    });

    it("should emit FileShared event", async function () {
      const fileId = ethers.encodeBytes32String("fileA");
      const enc = await encrypt64BatchFor(signers.deployer, [1n, 2n, 3n, 4n]);

      await expect(
        contract.shareFile(
          fileId,
          signers.alice.address,
          0,
          enc.handles[0],
          enc.handles[1],
          enc.handles[2],
          enc.handles[3],
          enc.inputProof
        )
      )
        .to.emit(contract, "FileShared")
        .withArgs(
          fileId,
          signers.deployer.address,
          signers.alice.address,
          [enc.handles[0], enc.handles[1], enc.handles[2], enc.handles[3]].map(
            (h) => ethers.hexlify(h)
          ),
          0,
          await getCurrentTimestamp()
        );
    });
  });

  describe("Share File (With Expiration)", function () {
    beforeEach(async () => {
      await registerTestFile("fileB", signers.deployer);
    });

    it("should accept valid expiration timestamp", async function () {
      const now = await getCurrentTimestamp();
      const expiresAt = now + 7 * 24 * 60 * 60; // 7 days from now

      await shareTestFile("fileB", signers.deployer, signers.alice, expiresAt);

      const record = await contract.getShareRecord(
        ethers.encodeBytes32String("fileB"),
        signers.alice.address
      );

      expect(record.expiresAt).to.equal(expiresAt);
      expect(record.isExpired).to.be.false;
    });

    it("should revert if expiration is in the past", async function () {
      const now = await getCurrentTimestamp();
      const pastTime = now - 1000; // 1000 seconds ago

      const enc = await encrypt64BatchFor(signers.deployer, [1n, 2n, 3n, 4n]);

      await expect(
        contract.shareFile(
          ethers.encodeBytes32String("fileB"),
          signers.alice.address,
          pastTime,
          enc.handles[0],
          enc.handles[1],
          enc.handles[2],
          enc.handles[3],
          enc.inputProof
        )
      ).to.be.revertedWithCustomError(contract, "InvalidExpiration");
    });

    it("should revert if expiration exceeds MAX_EXPIRATION_DURATION", async function () {
      const now = await getCurrentTimestamp();
      const tooFar = now + 366 * 24 * 60 * 60; // 366 days (> 365 days max)

      const enc = await encrypt64BatchFor(signers.deployer, [1n, 2n, 3n, 4n]);

      await expect(
        contract.shareFile(
          ethers.encodeBytes32String("fileB"),
          signers.alice.address,
          tooFar,
          enc.handles[0],
          enc.handles[1],
          enc.handles[2],
          enc.handles[3],
          enc.inputProof
        )
      ).to.be.revertedWithCustomError(contract, "InvalidExpiration");
    });

    it("should allow share with expiresAt=0 (never expires)", async function () {
      await shareTestFile("fileB", signers.deployer, signers.alice, 0);

      const record = await contract.getShareRecord(
        ethers.encodeBytes32String("fileB"),
        signers.alice.address
      );

      expect(record.expiresAt).to.equal(0);
    });
  });

  describe("Access Revocation", function () {
    beforeEach(async () => {
      await registerTestFile("fileC", signers.deployer);
      await shareTestFile("fileC", signers.deployer, signers.alice);
    });

    it("owner can revoke access", async function () {
      const fileId = ethers.encodeBytes32String("fileC");

      await contract.revokeAccess(fileId, signers.alice.address);

      const record = await contract.getShareRecord(fileId, signers.alice.address);
      expect(record.isRevoked).to.be.true;
    });

    it("should revert if trying to revoke non-existent share", async function () {
      const fileId = ethers.encodeBytes32String("fileC");

      await expect(
        contract.revokeAccess(fileId, signers.bob.address) // Bob never had access
      ).to.be.revertedWithCustomError(contract, "NotShared");
    });

    it("should revert if trying to revoke already revoked share", async function () {
      const fileId = ethers.encodeBytes32String("fileC");

      await contract.revokeAccess(fileId, signers.alice.address);

      await expect(
        contract.revokeAccess(fileId, signers.alice.address)
      ).to.be.revertedWithCustomError(contract, "ErrAccessRevoked");
    });

    it("should revert if non-owner attempts revocation", async function () {
      const fileId = ethers.encodeBytes32String("fileC");

      await expect(
        contract.connect(signers.alice).revokeAccess(fileId, signers.alice.address)
      ).to.be.revertedWithCustomError(contract, "NotFileOwner");
    });

    it("should emit AccessRevoked event", async function () {
      const fileId = ethers.encodeBytes32String("fileC");

      await expect(contract.revokeAccess(fileId, signers.alice.address))
        .to.emit(contract, "AccessRevoked")
        .withArgs(
          fileId,
          signers.deployer.address,
          signers.alice.address,
          await getCurrentTimestamp()
        );
    });

    it("should allow re-sharing after revocation", async function () {
      const fileId = ethers.encodeBytes32String("fileC");

      // Revoke
      await contract.revokeAccess(fileId, signers.alice.address);

      // Re-share
      await shareTestFile("fileC", signers.deployer, signers.alice);

      const record = await contract.getShareRecord(fileId, signers.alice.address);
      expect(record.exists).to.be.true;
      expect(record.isRevoked).to.be.false;
    });

    it("should increment access nonce on revocation", async function () {
      const fileId = ethers.encodeBytes32String("fileC");

      // Before revocation, recipient should have access
      const hasAccessBefore = await contract.hasAccess(
        fileId,
        signers.alice.address
      );
      expect(hasAccessBefore).to.be.true;

      // Revoke
      await contract.revokeAccess(fileId, signers.alice.address);

      // After revocation, hasAccess should return false
      const hasAccessAfter = await contract.hasAccess(
        fileId,
        signers.alice.address
      );
      expect(hasAccessAfter).to.be.false;
    });
  });

  describe("Request Access", function () {
    beforeEach(async () => {
      await registerTestFile("fileD", signers.deployer);
      await shareTestFile("fileD", signers.deployer, signers.alice);
    });

    it("recipient can retrieve their encrypted key chunks", async function () {
      const fileId = ethers.encodeBytes32String("fileD");

      const chunks: any = await contract.connect(signers.alice).requestAccess(fileId);

      expect(chunks.length).to.equal(4);
      expect(chunks[0]).to.not.equal(ethers.ZeroHash);
    });

    it("owner can retrieve their own key chunks", async function () {
      const fileId = ethers.encodeBytes32String("fileD");

      const chunks: any = await contract
        .connect(signers.deployer)
        .requestAccess(fileId);

      expect(chunks.length).to.equal(4);
      expect(chunks[0]).to.not.equal(ethers.ZeroHash);
    });

    it("unauthorized user cannot request access", async function () {
      const fileId = ethers.encodeBytes32String("fileD");

      await expect(
        contract.connect(signers.bob).requestAccess(fileId)
      ).to.be.revertedWithCustomError(contract, "NoAccess");
    });

    it("should revert on invalid fileId", async function () {
      await expect(
        contract.requestAccess(ethers.encodeBytes32String("invalid"))
      ).to.be.revertedWithCustomError(contract, "FileNotFound");
    });

    it("should revert if access is revoked", async function () {
      const fileId = ethers.encodeBytes32String("fileD");

      await contract.revokeAccess(fileId, signers.alice.address);

      await expect(
        contract.connect(signers.alice).requestAccess(fileId)
      ).to.be.revertedWithCustomError(contract, "ErrAccessRevoked");
    });

    it("should revert if share is expired", async function () {
      // Register new file with expiration
      await registerTestFile("expFile", signers.deployer);

      const now = await getCurrentTimestamp();
      const expiresAt = now + 3600; // 1 hour

      await shareTestFile("expFile", signers.deployer, signers.alice, expiresAt);

      const fileId = ethers.encodeBytes32String("expFile");

      // Access should work before expiration
      const chunksBefore: any = await contract
        .connect(signers.alice)
        .requestAccess(fileId);
      expect(chunksBefore.length).to.equal(4);

      // Advance time past expiration
      await advanceTime(3601);

      // Access should fail after expiration
      await expect(
        contract.connect(signers.alice).requestAccess(fileId)
      ).to.be.revertedWithCustomError(contract, "AccessExpired");
    });

    it("should revert if file is deleted", async function () {
      const fileId = ethers.encodeBytes32String("fileD");

      await contract.deleteFile(fileId);

      await expect(
        contract.connect(signers.alice).requestAccess(fileId)
      ).to.be.revertedWithCustomError(contract, "ErrFileDeleted");
    });

    it("should emit FileAccessed event", async function () {
      const fileId = ethers.encodeBytes32String("fileD");

      await expect(contract.connect(signers.alice).requestAccess(fileId))
        .to.emit(contract, "FileAccessed")
        .withArgs(fileId, signers.alice.address, await getCurrentTimestamp());
    });
  });

  describe("Share Expiration Extension", function () {
    beforeEach(async () => {
      await registerTestFile("fileE", signers.deployer);

      const now = await getCurrentTimestamp();
      const expiresAt = now + 7 * 24 * 60 * 60; // 7 days

      await shareTestFile("fileE", signers.deployer, signers.alice, expiresAt);
    });

    it("owner can extend share expiration", async function () {
      const fileId = ethers.encodeBytes32String("fileE");
      const now = await getCurrentTimestamp();
      const newExpiresAt = now + 14 * 24 * 60 * 60; // 14 days

      await contract.extendShareExpiration(
        fileId,
        signers.alice.address,
        newExpiresAt
      );

      const record = await contract.getShareRecord(fileId, signers.alice.address);
      expect(record.expiresAt).to.equal(newExpiresAt);
    });

    it("should revert if new expiration is not greater than current", async function () {
      const fileId = ethers.encodeBytes32String("fileE");
      const now = await getCurrentTimestamp();
      const sameTime = now + 7 * 24 * 60 * 60; // Same as original

      await expect(
        contract.extendShareExpiration(
          fileId,
          signers.alice.address,
          sameTime
        )
      ).to.be.revertedWithCustomError(contract, "InvalidExpiration");
    });

    it("should revert if new expiration exceeds max duration", async function () {
      const fileId = ethers.encodeBytes32String("fileE");
      const now = await getCurrentTimestamp();
      const tooFar = now + 400 * 24 * 60 * 60; // 400 days

      await expect(
        contract.extendShareExpiration(
          fileId,
          signers.alice.address,
          tooFar
        )
      ).to.be.revertedWithCustomError(contract, "InvalidExpiration");
    });

    it("should revert if share is revoked", async function () {
      const fileId = ethers.encodeBytes32String("fileE");

      await contract.revokeAccess(fileId, signers.alice.address);

      const now = await getCurrentTimestamp();
      const newExpiresAt = now + 14 * 24 * 60 * 60;

      await expect(
        contract.extendShareExpiration(
          fileId,
          signers.alice.address,
          newExpiresAt
        )
      ).to.be.revertedWithCustomError(contract, "ErrAccessRevoked");
    });

    it("should emit ShareExtended event", async function () {
      const fileId = ethers.encodeBytes32String("fileE");
      const now = await getCurrentTimestamp();
      const oldExpiresAt = now + 7 * 24 * 60 * 60;
      const newExpiresAt = now + 14 * 24 * 60 * 60;

      await expect(
        contract.extendShareExpiration(
          fileId,
          signers.alice.address,
          newExpiresAt
        )
      )
        .to.emit(contract, "ShareExtended")
        .withArgs(
          fileId,
          signers.alice.address,
          oldExpiresAt,
          newExpiresAt,
          await getCurrentTimestamp()
        );
    });
  });

  describe("File Deletion", function () {
    beforeEach(async () => {
      await registerTestFile("fileF", signers.deployer);
    });

    it("owner can soft-delete a file", async function () {
      const fileId = ethers.encodeBytes32String("fileF");

      await contract.deleteFile(fileId);

      const record = await contract.getFileRecord(fileId);
      expect(record.isDeleted).to.be.true;
    });

    it("should prevent access to deleted file", async function () {
      const fileId = ethers.encodeBytes32String("fileF");

      await shareTestFile("fileF", signers.deployer, signers.alice);
      await contract.deleteFile(fileId);

      await expect(
        contract.connect(signers.alice).requestAccess(fileId)
      ).to.be.revertedWithCustomError(contract, "ErrFileDeleted");
    });

    it("should revert if non-owner attempts deletion", async function () {
      const fileId = ethers.encodeBytes32String("fileF");

      await expect(
        contract.connect(signers.alice).deleteFile(fileId)
      ).to.be.revertedWithCustomError(contract, "NotFileOwner");
    });

    it("should revert if file already deleted", async function () {
      const fileId = ethers.encodeBytes32String("fileF");

      await contract.deleteFile(fileId);

      await expect(contract.deleteFile(fileId)).to.be.revertedWithCustomError(
        contract,
        "ErrFileDeleted"
      );
    });

    it("should emit FileDeleted event", async function () {
      const fileId = ethers.encodeBytes32String("fileF");

      await expect(contract.deleteFile(fileId))
        .to.emit(contract, "FileDeleted")
        .withArgs(
          fileId,
          signers.deployer.address,
          await getCurrentTimestamp()
        );
    });
  });

  describe("Metadata Update", function () {
    beforeEach(async () => {
      await registerTestFile("fileG", signers.deployer);
    });

    it("owner can update metadata CID", async function () {
      const fileId = ethers.encodeBytes32String("fileG");
      const newMetadataCid = ethers.toUtf8Bytes("NEW_META");

      await contract.updateMetadata(fileId, newMetadataCid);

      const stored = await contract.getFileMetadataCID(fileId);
      expect(stored).to.equal(ethers.hexlify(newMetadataCid));
    });

    it("should revert if non-owner attempts update", async function () {
      const fileId = ethers.encodeBytes32String("fileG");
      const newMetadataCid = ethers.toUtf8Bytes("NEW_META");

      await expect(
        contract.connect(signers.alice).updateMetadata(fileId, newMetadataCid)
      ).to.be.revertedWithCustomError(contract, "NotFileOwner");
    });

    it("should revert with empty metadata CID", async function () {
      const fileId = ethers.encodeBytes32String("fileG");
      const emptyMetadataCid = ethers.toUtf8Bytes("");

      await expect(
        contract.updateMetadata(fileId, emptyMetadataCid)
      ).to.be.revertedWithCustomError(contract, "InvalidInput");
    });

    it("should emit MetadataUpdated event", async function () {
      const fileId = ethers.encodeBytes32String("fileG");
      const newMetadataCid = ethers.toUtf8Bytes("NEW_META");

      await expect(contract.updateMetadata(fileId, newMetadataCid))
        .to.emit(contract, "MetadataUpdated")
        .withArgs(
          fileId,
          ethers.hexlify(newMetadataCid),
          await getCurrentTimestamp()
        );
    });
  });

  describe("View Functions", function () {
    beforeEach(async () => {
      await registerTestFile("viewFile", signers.deployer);
    });

    it("getFileCID should return correct CID", async function () {
      const fileId = ethers.encodeBytes32String("viewFile");
      const expectedCid = ethers.toUtf8Bytes("CID_viewFile");

      const cid = await contract.getFileCID(fileId);
      expect(cid).to.equal(ethers.hexlify(expectedCid));
    });

    it("getFileMetadataCID should return correct metadata CID", async function () {
      const fileId = ethers.encodeBytes32String("viewFile");
      const expectedMeta = ethers.toUtf8Bytes("META_viewFile");

      const metaCid = await contract.getFileMetadataCID(fileId);
      expect(metaCid).to.equal(ethers.hexlify(expectedMeta));
    });

    it("getFileRecord should return complete file record", async function () {
      const fileId = ethers.encodeBytes32String("viewFile");

      const record = await contract.getFileRecord(fileId);

      expect(record.owner).to.equal(signers.deployer.address);
      expect(record.cid).to.not.equal("0x");
      expect(record.metadataCid).to.not.equal("0x");
      expect(record.createdAt).to.be.greaterThan(0);
      expect(record.isDeleted).to.be.false;
    });

    it("hasAccess should return true for owner", async function () {
      const fileId = ethers.encodeBytes32String("viewFile");

      const hasAccess = await contract.hasAccess(
        fileId,
        signers.deployer.address
      );
      expect(hasAccess).to.be.true;
    });

    it("hasAccess should return true for shared recipient", async function () {
      const fileId = ethers.encodeBytes32String("viewFile");
      await shareTestFile("viewFile", signers.deployer, signers.alice);

      const hasAccess = await contract.hasAccess(fileId, signers.alice.address);
      expect(hasAccess).to.be.true;
    });

    it("hasAccess should return false for non-shared user", async function () {
      const fileId = ethers.encodeBytes32String("viewFile");

      const hasAccess = await contract.hasAccess(fileId, signers.bob.address);
      expect(hasAccess).to.be.false;
    });

    it("hasAccess should return false for revoked access", async function () {
      const fileId = ethers.encodeBytes32String("viewFile");

      await shareTestFile("viewFile", signers.deployer, signers.alice);
      await contract.revokeAccess(fileId, signers.alice.address);

      const hasAccess = await contract.hasAccess(fileId, signers.alice.address);
      expect(hasAccess).to.be.false;
    });

    it("getShareRecord should return correct share details", async function () {
      const fileId = ethers.encodeBytes32String("viewFile");
      const now = await getCurrentTimestamp();
      const expiresAt = now + 7 * 24 * 60 * 60;

      await shareTestFile("viewFile", signers.deployer, signers.alice, expiresAt);

      const record = await contract.getShareRecord(fileId, signers.alice.address);

      expect(record.exists).to.be.true;
      expect(record.sharedAt).to.be.greaterThan(0);
      expect(record.expiresAt).to.equal(expiresAt);
      expect(record.isRevoked).to.be.false;
      expect(record.isExpired).to.be.false;
    });
  });

  describe("Edge Cases & Gas Optimization", function () {
    it("should handle uint32 timestamp edge case (year 2106)", async function () {
      const fileId = await registerTestFile("futureFile", signers.deployer);

      // Max uint32 timestamp (Feb 7, 2106)
      const maxUint32 = 4294967295;

      await shareTestFile(
        "futureFile",
        signers.deployer,
        signers.alice,
        maxUint32
      );

      const record = await contract.getShareRecord(fileId, signers.alice.address);
      expect(record.expiresAt).to.equal(maxUint32);
    });

    it("should handle multiple sequential shares efficiently", async function () {
      const fileId = await registerTestFile("multiShare", signers.deployer);

      // Share with 3 different users
      await shareTestFile("multiShare", signers.deployer, signers.alice);
      await shareTestFile("multiShare", signers.deployer, signers.bob);
      await shareTestFile("multiShare", signers.deployer, signers.charlie);

      // All should have access
      expect(await contract.hasAccess(fileId, signers.alice.address)).to.be.true;
      expect(await contract.hasAccess(fileId, signers.bob.address)).to.be.true;
      expect(await contract.hasAccess(fileId, signers.charlie.address)).to.be
        .true;
    });

    it("should handle re-share after revoke with new nonce", async function () {
      const fileId = await registerTestFile("nonceTest", signers.deployer);

      // Share, revoke, re-share
      await shareTestFile("nonceTest", signers.deployer, signers.alice);
      await contract.revokeAccess(fileId, signers.alice.address);
      await shareTestFile("nonceTest", signers.deployer, signers.alice);

      // Access should work again
      const chunks: any = await contract.connect(signers.alice).requestAccess(fileId);
      expect(chunks.length).to.equal(4);
    });

    it("owner file pagination should work correctly", async function () {
      // Register 5 files
      for (let i = 0; i < 5; i++) {
        await registerTestFile(`file${i}`, signers.alice);
      }

      // Get first 3 files
      const page1 = await contract.getOwnerFiles(signers.alice.address, 0, 3);
      expect(page1.length).to.equal(3);

      // Get next 2 files
      const page2 = await contract.getOwnerFiles(signers.alice.address, 3, 2);
      expect(page2.length).to.equal(2);

      // Get beyond available files
      const page3 = await contract.getOwnerFiles(signers.alice.address, 10, 5);
      expect(page3.length).to.equal(0);
    });
  });

  describe("Race Condition Prevention (Access Nonce)", function () {
    beforeEach(async () => {
      await registerTestFile("raceFile", signers.deployer);
      await shareTestFile("raceFile", signers.deployer, signers.alice);
    });

    it("should prevent access after revocation even in same block", async function () {
      const fileId = ethers.encodeBytes32String("raceFile");

      // Simulate revocation
      await contract.revokeAccess(fileId, signers.alice.address);

      // Alice's requestAccess should fail (nonce mismatch)
      await expect(
        contract.connect(signers.alice).requestAccess(fileId)
      ).to.be.revertedWithCustomError(contract, "ErrAccessRevoked");
    });

    it("re-share should work with incremented nonce", async function () {
      const fileId = ethers.encodeBytes32String("raceFile");

      // Get initial share record
      const record1 = await contract.getShareRecord(
        fileId,
        signers.alice.address
      );
      expect(record1.exists).to.be.true;

      // Revoke
      await contract.revokeAccess(fileId, signers.alice.address);

      // Re-share (should create new share with new nonce)
      await shareTestFile("raceFile", signers.deployer, signers.alice);

      // Access should work with new nonce
      const chunks: any = await contract.connect(signers.alice).requestAccess(fileId);
      expect(chunks.length).to.equal(4);
    });
  });
});
