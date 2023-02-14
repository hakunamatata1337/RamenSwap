import { ethers } from "hardhat";

export async function latestBlockTimestamp(): Promise<number> {
  const block = await ethers.provider.getBlock("latest");
  return ethers.BigNumber.from(block.timestamp).toNumber();
}
