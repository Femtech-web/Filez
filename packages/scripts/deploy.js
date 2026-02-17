import hre from "hardhat";
import fs from "fs";

const { ethers } = hre;

async function main() {
  console.log("🚀 Starting FileRegistry deployment...");

  const [signer] = await ethers.getSigners();
  const deployer = await signer.getAddress();

  console.log("👤 Deployer:", deployer);
  console.log("🌐 Network:", hre.network.name);

  // -------------------------------------------------
  // Deploy FileRegistry
  // -------------------------------------------------
  // console.log("📦 Deploying FileRegistry...");

  // const FileRegistry = await ethers.getContractFactory("FileRegistry", signer);

  // const fileRegistry = await FileRegistry.deploy();
  // await fileRegistry.waitForDeployment();

  // const fileRegistryAddress = await fileRegistry.getAddress();

  // console.log("✅ FileRegistry deployed at:", fileRegistryAddress);

  // -------------------------------------------------
  // Deploy FileRegistry V2
  // -------------------------------------------------
  console.log("📦 Deploying FileRegistryV2...");

  const FileRegistryV2 = await ethers.getContractFactory(
    "FileRegistryV2",
    signer
  );

  const fileRegistryV2 = await FileRegistryV2.deploy();
  await fileRegistryV2.waitForDeployment();

  const fileRegistryV2Address = await fileRegistryV2.getAddress();

  console.log("✅ FileRegistryV2 deployed at:", fileRegistryV2Address);

  // -------------------------------------------------
  // Save deployment info
  // -------------------------------------------------
  const deployments = {
    network: hre.network.name,
    FileRegistry: fileRegistryV2Address,
    deployer,
  };

  fs.writeFileSync(
    "file-registry-V2-deployments.json",
    JSON.stringify(deployments, null, 2)
  );

  console.log("📄 Saved deployment → file-registry-V2-deployments.json");
  console.log("🎉 Deployment complete!");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
