import { RamenSwapExchange, TestErc20 } from "../../typechain-types";
import { latestBlockTimestamp } from "./time";
import { BigNumber } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

export const addInitialLiquidity = async (
  token: TestErc20,
  RamenSwapExchange: RamenSwapExchange,
  liquidityProvider: SignerWithAddress,
  maxTokens: BigNumber,
  msgValue: BigNumber
) => {
  const currentTimestamp = await latestBlockTimestamp();
  const deadline = currentTimestamp + 100;
  const minLiquidity = BigNumber.from("0");

  await token
    .connect(liquidityProvider)
    .approve(RamenSwapExchange.address, maxTokens);

  await RamenSwapExchange.connect(liquidityProvider).addLiquidity(
    minLiquidity,
    maxTokens,
    deadline,
    {
      value: msgValue,
    }
  );
};
