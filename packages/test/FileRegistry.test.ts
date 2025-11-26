import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";
import hre from "hardhat";
const { ethers, fhevm } = hre;


import {
  FileRegistry,
  FileRegistry__factory,
} from "../types";

type Signers = {
  deployer: HardhatEthersSigner;
  acc1: HardhatEthersSigner;
  acc2: HardhatEthersSigner;
};

async function deployFixture() {
  const Factory = (await ethers.getContractFactory("FileRegistry")) as FileRegistry__factory;
  const contract = await Factory.deploy();
  const contractAddress = await contract.getAddress();
  return { contract, contractAddress };
}

describe("FileRegistry (FHEVM)", function () {
  let signers: Signers;
  let contract: FileRegistry;
  let contractAddress: string;

  before(async function () {
    const s = await ethers.getSigners();
    signers = {
      deployer: s[0],
      acc1: s[1],
      acc2: s[2],
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

  /* -------------------------------------------------------------------------- */
  /*                                   TESTS                                    */
  /* -------------------------------------------------------------------------- */

  describe("Deployment", function () {
    it("should deploy successfully", async function () {
      expect(await contract.getAddress()).to.equal(contractAddress);
    });
  });

  describe("Register File", function () {
    it("should register a new file with encrypted key chunks", async function () {
      const fileId = ethers.encodeBytes32String("file123");
      const cid = ethers.toUtf8Bytes("CID_TEST_123");
      const metadataCid = ethers.toUtf8Bytes("META_TEST_999");

      // encrypt 4 values in a single batch so we get one proof that covers all handles
      const encBatch = await encrypt64BatchFor(signers.deployer, [
        111n, 222n, 333n, 444n,
      ]);

      await contract.connect(signers.deployer).registerFile(
        fileId,
        cid,
        metadataCid,
        encBatch.handles[0],
        encBatch.handles[1],
        encBatch.handles[2],
        encBatch.handles[3],
        encBatch.inputProof
      );

      const cidStored = await contract.getFileCID(fileId);
      expect(cidStored).to.equal(ethers.hexlify(cid));

      const chunks = await contract.getOwnerEncryptedKeyChunks(fileId);
      expect(chunks.length).to.equal(4);
      expect(chunks[0]).to.not.equal(ethers.ZeroHash);
    });

    it("should revert on duplicate fileId", async () => {
      const fileId = ethers.encodeBytes32String("duplicate");
      const cid = ethers.toUtf8Bytes("CID");
      const metadataCid = ethers.toUtf8Bytes("META");

      // create a batch where all 4 values are the same (valid single proof)
      const enc = await encrypt64BatchFor(signers.deployer, [
        999n, 999n, 999n, 999n,
      ]);

      await contract.registerFile(
        fileId,
        cid,
        metadataCid,
        enc.handles[0],
        enc.handles[1],
        enc.handles[2],
        enc.handles[3],
        enc.inputProof
      );

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
  });

  describe("Sharing", function () {
    beforeEach(async () => {
      const fileId = ethers.encodeBytes32String("fileA");
      const cid = ethers.toUtf8Bytes("CID_X");
      const metadataCid = ethers.toUtf8Bytes("META_X");

      // register with a 4-value batch
      const encReg = await encrypt64BatchFor(signers.deployer, [
        55n, 55n, 55n, 55n,
      ]);

      await contract.registerFile(
        fileId,
        cid,
        metadataCid,
        encReg.handles[0],
        encReg.handles[1],
        encReg.handles[2],
        encReg.handles[3],
        encReg.inputProof
      );
    });

    it("owner can share file with recipient", async function () {
      const fileId = ethers.encodeBytes32String("fileA");

      // create a batch for the recipient (single proof)
      const enc = await encrypt64BatchFor(signers.deployer, [
        777n, 777n, 777n, 777n,
      ]);

      await contract.shareFileWith(
        fileId,
        signers.acc1.address,
        enc.handles[0],
        enc.handles[1],
        enc.handles[2],
        enc.handles[3],
        enc.inputProof
      );

      const chunks = await contract.getRecipientEncryptedKeyChunks(
        fileId,
        signers.acc1.address
      );

      expect(chunks[0]).to.not.equal(ethers.ZeroHash);
    });

    it("should prevent duplicate sharing", async function () {
      const fileId = ethers.encodeBytes32String("fileA");

      const enc = await encrypt64BatchFor(signers.deployer, [
        777n, 777n, 777n, 777n,
      ]);

      await contract.shareFileWith(
        fileId,
        signers.acc1.address,
        enc.handles[0],
        enc.handles[1],
        enc.handles[2],
        enc.handles[3],
        enc.inputProof
      );

      await expect(
        contract.shareFileWith(
          fileId,
          signers.acc1.address,
          enc.handles[0],
          enc.handles[1],
          enc.handles[2],
          enc.handles[3],
          enc.inputProof
        )
      ).to.be.revertedWithCustomError(contract, "AlreadyShared");
    });

    it("should revert if non-owner attempts sharing", async function () {
      const fileId = ethers.encodeBytes32String("fileA");

      // encrypt batch using acc1 (non-owner)
      const enc = await encrypt64BatchFor(signers.acc1, [1n, 1n, 1n, 1n]);

      await expect(
        contract.connect(signers.acc1).shareFileWith(
          fileId,
          signers.acc2.address,
          enc.handles[0],
          enc.handles[1],
          enc.handles[2],
          enc.handles[3],
          enc.inputProof
        )
      ).to.be.revertedWithCustomError(contract, "NotFileOwner");
    });
  });

  describe("Access Requests", function () {
    const fileId = ethers.encodeBytes32String("AAA");

    beforeEach(async () => {
      const cid = ethers.toUtf8Bytes("C1");
      const metadataCid = ethers.toUtf8Bytes("M1");

      // register with batch
      const enc = await encrypt64BatchFor(signers.deployer, [12n, 12n, 12n, 12n]);

      await contract.registerFile(
        fileId,
        cid,
        metadataCid,
        enc.handles[0],
        enc.handles[1],
        enc.handles[2],
        enc.handles[3],
        enc.inputProof
      );

      // share with batch
      const encShare = await encrypt64BatchFor(signers.deployer, [
        99n, 99n, 99n, 99n,
      ]);

      await contract.shareFileWith(
        fileId,
        signers.acc1.address,
        encShare.handles[0],
        encShare.handles[1],
        encShare.handles[2],
        encShare.handles[3],
        encShare.inputProof
      );
    });

    it("recipient can retrieve their encrypted key chunks", async () => {
      const chunks = await contract.connect(signers.acc1).requestAccess(fileId);
      expect(chunks[0]).to.not.equal(ethers.ZeroHash);
    });

    it("unauthorized user cannot request access", async () => {
      await expect(
        contract.connect(signers.acc2).requestAccess(fileId)
      ).to.be.revertedWithCustomError(contract, "NoAccess");
    });

    it("invalid fileId should revert", async () => {
      await expect(
        contract.requestAccess(ethers.encodeBytes32String("invalid"))
      ).to.be.revertedWithCustomError(contract, "FileNotFound");
    });
  });

  describe("Getters", function () {
    it("should return stored CIDs", async () => {
      const id = ethers.encodeBytes32String("IDTest");
      const cid = ethers.toUtf8Bytes("CID_777");
      const metadataCid = ethers.toUtf8Bytes("META_777");

      const enc = await encrypt64BatchFor(signers.deployer, [1n, 1n, 1n, 1n]);

      await contract.registerFile(
        id,
        cid,
        metadataCid,
        enc.handles[0],
        enc.handles[1],
        enc.handles[2],
        enc.handles[3],
        enc.inputProof
      );

      // Compare hex string from contract with hexlify(cid)
      expect(await contract.getFileCID(id)).to.equal(ethers.hexlify(cid));
      const chunks = await contract.getOwnerEncryptedKeyChunks(id);
      expect(chunks.length).to.equal(4);
    });
  });
});

