import { ethers } from "hardhat";
import { TestErc20 } from "../typechain-types";

async function main() {
  const testERC20Factory = await ethers.getContractFactory("TestErc20");
  const TestERC20 = await testERC20Factory.deploy();

  await TestERC20.deployed();

  console.log(`TestERC20 deployed to ${TestERC20.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
