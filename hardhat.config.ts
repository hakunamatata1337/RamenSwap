import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-abi-exporter";
import * as dotenv from "dotenv";

const fallbackKey =
  "0000000000000000000000000000000000000000000000000000000000000000";

dotenv.config();


const config: HardhatUserConfig = {
  solidity: "0.8.13",
  networks: {
    mumbai: {
      url: `https://rpc.ankr.com/polygon_mumbai`,
      accounts: [process.env.PRIVATE_KEY || fallbackKey],
    },
  },
  abiExporter: {
    clear: true,
    runOnCompile: true,
  },

};

export default config;
