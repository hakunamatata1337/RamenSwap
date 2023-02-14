import { expect } from "chai";
import { ethers } from "hardhat";
import { ERC20, RamenSwapFactory, TestErc20 } from "../typechain-types";

//@TODO Run tests on fork
describe("RamenSwapFactory", () => {
  let RamenSwapFactory: RamenSwapFactory;
  let token: TestErc20;

  beforeEach(async () => {
    const ERC20Factory = await ethers.getContractFactory("TestErc20");
    token = await ERC20Factory.deploy();
    await token.deployed();

    const ramenSwapFactory = await ethers.getContractFactory(
      "RamenSwapFactory"
    );
    RamenSwapFactory = await ramenSwapFactory.deploy();

    RamenSwapFactory.deployed();
  });
  describe("deployExchange", () => {
    it("Should not deploy exchange if provided address is address zero", async () => {
      const deployExchangeTx = RamenSwapFactory.deployExchange(
        ethers.constants.AddressZero
      );
      await expect(deployExchangeTx).to.be.revertedWith(
        "token cannot be address zero"
      );
    });
    it("Should deploy exchange", async () => {
      await RamenSwapFactory.deployExchange(token.address);
      const exchangeAddress = await RamenSwapFactory.getExchange(token.address);
      const tokenAddress = await RamenSwapFactory.getToken(exchangeAddress);
      expect(exchangeAddress).to.not.be.eql(ethers.constants.AddressZero);
      expect(tokenAddress).to.be.eql(token.address);
    });
  });
});
