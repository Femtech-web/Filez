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
  console.log("📦 Deploying FileRegistry...");

  const FileRegistry = await ethers.getContractFactory("FileRegistry", signer);

  const fileRegistry = await FileRegistry.deploy();
  await fileRegistry.waitForDeployment();

  const fileRegistryAddress = await fileRegistry.getAddress();

  console.log("✅ FileRegistry deployed at:", fileRegistryAddress);

  // -------------------------------------------------
  // Save deployment info
  // -------------------------------------------------
  const deployments = {
    network: hre.network.name,
    FileRegistry: fileRegistryAddress,
    deployer,
  };

  fs.writeFileSync(
    "file-registry-deployments.json",
    JSON.stringify(deployments, null, 2)
  );

  console.log("📄 Saved deployment → file-registry-deployments.json");
  console.log("🎉 Deployment complete!");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
