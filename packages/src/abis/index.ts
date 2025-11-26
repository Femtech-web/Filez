import FileRegistryABI from "./contractAbis/FileRegistry.json";
import deploymentJson from "../../file-registry-deployments.json";

export const ABIS = {
  FileRegistry: FileRegistryABI.abi,
};

export const contractAddresses = {
  FileRegistry: deploymentJson.FileRegistry,
}