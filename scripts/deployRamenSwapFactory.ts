import { ethers } from "hardhat";
import { RamenSwapFactory } from "../typechain-types";

async function main() {
  const ramenSwapFactory = await ethers.getContractFactory("RamenSwapFactory");
   const RamenSwapFactory = await ramenSwapFactory.deploy();

  await RamenSwapFactory.deployed();

  console.log(`RamenSwapFactory deployed to ${RamenSwapFactory.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
