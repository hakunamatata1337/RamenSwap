import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "ethers";
import {
  RamenSwapExchange,
  RamenSwapFactory,
  TestErc20,
} from "../typechain-types";
import { latestBlockTimestamp } from "./utils/time";
import { addInitialLiquidity } from "./utils/addLiquidity";

describe("RamenSwapExchange", async () => {
  let userA: SignerWithAddress;
  let userB: SignerWithAddress;
  let token: TestErc20;
  let RamenSwapFactory: RamenSwapFactory;
  let RamenSwapExchange: RamenSwapExchange;

  beforeEach(async () => {
    [userA, userB] = await ethers.getSigners();
    const ERC20Factory = await ethers.getContractFactory("TestErc20");
    token = await ERC20Factory.deploy();
    await token.deployed();

    const ramenSwapFactory = await ethers.getContractFactory(
      "RamenSwapFactory"
    );
    RamenSwapFactory = await ramenSwapFactory.deploy();
    RamenSwapFactory.deployed();

    await RamenSwapFactory.deployExchange(token.address);
    const RamenSwapExchangeAddress = await RamenSwapFactory.getExchange(
      token.address
    );

    const RamenSwapExchangeFactory = await ethers.getContractFactory(
      "RamenSwapExchange"
    );
    RamenSwapExchange = await RamenSwapExchangeFactory.attach(
      RamenSwapExchangeAddress
    );
  });

  describe("Add liquidity", async () => {
    it("Should revert if its after deadline", async () => {
      const currentTimestamp = await latestBlockTimestamp();
      const invalidDeadline = currentTimestamp - 10;
      const minLiquidity = BigNumber.from("1");
      const maxTokens = BigNumber.from("1");

      const tx = RamenSwapExchange.addLiquidity(
        minLiquidity,
        maxTokens,
        invalidDeadline
      );

      expect(tx).to.be.revertedWithCustomError(
        RamenSwapExchange,
        "AfterDeadline"
      );
    });
    it("Should revert if msg value is equal to zero", async () => {
      const currentTimestamp = await latestBlockTimestamp();
      const deadline = currentTimestamp + 100;
      const minLiquidity = BigNumber.from("1");
      const maxTokens = BigNumber.from("1");

      const tx = RamenSwapExchange.addLiquidity(
        minLiquidity,
        maxTokens,
        deadline
      );

      expect(tx).to.be.revertedWith(
        "RamenSwap: msg value should be greater than zero"
      );
    });
    it("Should revert if max tokens is equal to zero", async () => {
      const currentTimestamp = await latestBlockTimestamp();
      const deadline = currentTimestamp + 100;
      const minLiquidity = BigNumber.from("1");
      const invalidMaxTokens = BigNumber.from("0");

      const tx = RamenSwapExchange.addLiquidity(
        minLiquidity,
        invalidMaxTokens,
        deadline,
        { value: ethers.utils.parseEther("0.1") }
      );

      expect(tx).to.be.revertedWith(
        "RamenSwap: max tokens should be greater than zero"
      );
    });
    describe("totalLiquidity == 0", () => {
      beforeEach(async () => {
        const totalLiquidity = await RamenSwapExchange.totalSupply();
        expect(totalLiquidity).to.be.eql(BigNumber.from("0"));
      });

      it("Should revert if msg.value is less than one gwei", async () => {
        const currentTimestamp = await latestBlockTimestamp();
        const deadline = currentTimestamp + 100;
        const minLiquidity = BigNumber.from("0");
        const maxTokens = BigNumber.from("1");
        const invalidMsgValue = BigNumber.from("1");

        const tx = RamenSwapExchange.addLiquidity(
          minLiquidity,
          maxTokens,
          deadline,
          { value: invalidMsgValue }
        );

        await expect(tx).to.be.revertedWith(
          "RamenSwap: msg value should be at least one gwei"
        );
      });
      //@TODO check factory getExchange(address(token)) == address(this)
      it("Should revert if transfer from fails", async () => {
        const currentTimestamp = await latestBlockTimestamp();
        const deadline = currentTimestamp + 100;
        const minLiquidity = BigNumber.from("0");
        const maxTokens = await token.balanceOf(userA.address);
        const msgValue = ethers.utils.parseEther("1");

        const tx = RamenSwapExchange.addLiquidity(
          minLiquidity,
          maxTokens,
          deadline,
          { value: msgValue }
        );

        await expect(tx).to.be.reverted;
      });
      it("Should mint initial liquidity", async () => {
        const currentTimestamp = await latestBlockTimestamp();
        const deadline = currentTimestamp + 100;
        const minLiquidity = BigNumber.from("0");
        const maxTokens = await token.balanceOf(userA.address);
        const msgValue = ethers.utils.parseEther("1");

        await token
          .connect(userA)
          .approve(RamenSwapExchange.address, maxTokens);

        const addLiquidityTx = RamenSwapExchange.addLiquidity(
          minLiquidity,
          maxTokens,
          deadline,
          {
            value: msgValue,
          }
        );

        await expect(addLiquidityTx)
          .emit(RamenSwapExchange, "Transfer")
          .withArgs(ethers.constants.AddressZero, userA.address, msgValue)
          .emit(RamenSwapExchange, "AddLiquidity")
          .withArgs(userA.address, msgValue, maxTokens);

        const liquidityBalance = await RamenSwapExchange.balanceOf(
          userA.address
        );

        expect(liquidityBalance).to.be.eql(msgValue);
      });
    });
    describe("totalLiquidity > 0", () => {
      beforeEach(async () => {
        const maxTokens = await token.balanceOf(userA.address);
        const msgValue = ethers.utils.parseEther("1");

        await addInitialLiquidity(
          token,
          RamenSwapExchange,
          userA,
          maxTokens,
          msgValue
        );

        //mint 10 ^ 18 tokens
        await token.connect(userA).mint(ethers.utils.parseEther("10"));
      });

      it("Should revert if min liquidity is equal to zero", async () => {
        const currentTimestamp = await latestBlockTimestamp();
        const deadline = currentTimestamp + 100;
        const invalidMinLiquidity = BigNumber.from("0");
        const maxTokens = await token.balanceOf(userA.address);
        const msgValue = ethers.utils.parseEther("1");

        const tx = RamenSwapExchange.addLiquidity(
          invalidMinLiquidity,
          maxTokens,
          deadline,
          {
            value: msgValue,
          }
        );

        await expect(tx).to.be.revertedWith(
          "RamenSwap: minLiquidity should be greater than zero"
        );
      });

      it("Should revert if maxTokens is less than required token amount", async () => {
        const currentTimestamp = await latestBlockTimestamp();
        const deadline = currentTimestamp + 100;
        const minLiquidity = ethers.utils.parseEther("1");
        const invalidMaxTokens = ethers.utils.parseEther("0.1");
        const msgValue = ethers.utils.parseEther("1");

        const tx = RamenSwapExchange.addLiquidity(
          minLiquidity,
          invalidMaxTokens,
          deadline,
          {
            value: msgValue,
          }
        );

        await expect(tx).to.be.revertedWith(
          "maxTokens is less than required tokenAmount"
        );
      });

      it("Should revert if liquidity minted is less than minLiquidity", async () => {
        const currentTimestamp = await latestBlockTimestamp();
        const deadline = currentTimestamp + 100;
        const invalidMinLiquidity = ethers.utils.parseEther("2");
        const maxTokens = ethers.utils.parseEther("1").add("1");
        const msgValue = ethers.utils.parseEther("1");

        const tx = RamenSwapExchange.addLiquidity(
          invalidMinLiquidity,
          maxTokens,
          deadline,
          {
            value: msgValue,
          }
        );

        await expect(tx).to.be.revertedWith(
          "liquidity minted is less than minLiquidity"
        );
      });

      it("Should revert if token transfer fails", async () => {
        //@TODO
      });
      it("Should mint liquidity", async () => {
        const currentTimestamp = await latestBlockTimestamp();
        const deadline = currentTimestamp + 100;
        const minLiquidity = ethers.utils.parseEther("1");
        const maxTokens = ethers.utils.parseEther("1").add("1");
        const msgValue = ethers.utils.parseEther("1");

        await token
          .connect(userA)
          .approve(RamenSwapExchange.address, maxTokens);

        const tx = RamenSwapExchange.addLiquidity(
          minLiquidity,
          maxTokens,
          deadline,
          {
            value: msgValue,
          }
        );

        await expect(tx)
          .emit(RamenSwapExchange, "Transfer")
          .withArgs(ethers.constants.AddressZero, userA.address, minLiquidity)
          .emit(RamenSwapExchange, "AddLiquidity")
          .withArgs(userA.address, msgValue, maxTokens);
      });
    });
  });

  describe("getEthToTokenInputPrice", async () => {
    beforeEach(async () => {
      const maxTokens = BigNumber.from("50000000"); //5 * 10^7
      const msgValue = BigNumber.from("1000000000"); //10 ^ 9

      await addInitialLiquidity(
        token,
        RamenSwapExchange,
        userA,
        maxTokens,
        msgValue
      );
    });

    it("Should revert if ethSold amount is equal to zero", async () => {
      const ETH_SOLD = 0;
      const tx = RamenSwapExchange.getEthToTokenInputPrice(ETH_SOLD);

      await expect(tx).to.be.revertedWith(
        "ethSold should be greater than zero"
      );
    });
    it("Should return proper amount of tokens to be received", async () => {
      const ETH_SOLD = BigNumber.from("4000000000"); //4 * 10^9
      const ETH_AMOUNT = await ethers.provider.getBalance(
        RamenSwapExchange.address
      );
      const TOKEN_AMOUNT = await token.balanceOf(RamenSwapExchange.address);
      // deltaY = Y - (k/[X + deltaX])
      const expectedTokensReceived = TOKEN_AMOUNT.sub(
        ETH_AMOUNT.mul(TOKEN_AMOUNT).div(ETH_SOLD.add(ETH_AMOUNT))
      );
      const tokensReceived = await RamenSwapExchange.getEthToTokenInputPrice(
        ETH_SOLD
      );
      expect(tokensReceived).to.be.eql(expectedTokensReceived);
    });
  });

  describe("getEthToTokenOutputPrice", () => {
    beforeEach(async () => {
      const maxTokens = BigNumber.from("50000000"); //5 * 10^7
      const msgValue = BigNumber.from("1000000000"); //10 ^ 9

      await addInitialLiquidity(
        token,
        RamenSwapExchange,
        userA,
        maxTokens,
        msgValue
      );
    });

    it("Should revert if tokenBought is equal to zero", async () => {
      const TOKEN_BOUGHT = 0;
      const tx = RamenSwapExchange.getEthToTokenOutputPrice(TOKEN_BOUGHT);

      await expect(tx).to.be.revertedWith(
        "tokenBought should be greater than zero"
      );
    });
    it("Should revert if tokenBought is greater or equal to TokenAmount", async () => {
      const TOKEN_BOUGHT = await token.balanceOf(RamenSwapExchange.address);
      const tx = RamenSwapExchange.getEthToTokenOutputPrice(TOKEN_BOUGHT);

      await expect(tx).to.be.revertedWith(
        "tokenBought should be less than TokenAmount"
      );
    });
    it("Should return proper amount of wei that must be provided", async () => {
      const TOKEN_BOUGHT = BigNumber.from("40000000");
      const ETH_AMOUNT = await ethers.provider.getBalance(
        RamenSwapExchange.address
      );
      const TOKEN_AMOUNT = await token.balanceOf(RamenSwapExchange.address);

      const ethThatMustBeSold =
        await RamenSwapExchange.getEthToTokenOutputPrice(TOKEN_BOUGHT);

      const expectedEthThatMustBeSold = ETH_AMOUNT.mul(TOKEN_AMOUNT)
        .div(TOKEN_AMOUNT.sub(TOKEN_BOUGHT))
        .sub(ETH_AMOUNT)
        .add(1);

      await expect(ethThatMustBeSold).to.be.eql(expectedEthThatMustBeSold);
    });
  });

  describe("getTokenToEthInputPrice", () => {
    beforeEach(async () => {
      const maxTokens = BigNumber.from("50000000"); //5 * 10^7
      const msgValue = BigNumber.from("1000000000"); //10 ^ 9

      await addInitialLiquidity(
        token,
        RamenSwapExchange,
        userA,
        maxTokens,
        msgValue
      );
    });

    it("Should revert if tokenSold is equal to zero", async () => {
      const TOKEN_SOLD = BigNumber.from("0");

      const tx = RamenSwapExchange.getTokenToEthInputPrice(TOKEN_SOLD);
      await expect(tx).to.be.revertedWith(
        "tokenSold should be greater than zero"
      );
    });
    it("Should return proper amount of tokens to be received", async () => {
      const TOKEN_SOLD = BigNumber.from("50000000");
      const ETH_AMOUNT = await ethers.provider.getBalance(
        RamenSwapExchange.address
      );
      const TOKEN_AMOUNT = await token.balanceOf(RamenSwapExchange.address);

      const expectedEthReceived = ETH_AMOUNT.sub(
        TOKEN_AMOUNT.mul(ETH_AMOUNT).div(TOKEN_SOLD.add(TOKEN_AMOUNT))
      );
      const ethReceived = await RamenSwapExchange.getTokenToEthInputPrice(
        TOKEN_SOLD
      );
      expect(ethReceived).to.be.eql(expectedEthReceived);
    });
  });

  describe("getTokenToEthOutputPrice", () => {
    beforeEach(async () => {
      const maxTokens = BigNumber.from("50000000"); //5 * 10^7
      const msgValue = BigNumber.from("1000000000"); //10 ^ 9

      await addInitialLiquidity(
        token,
        RamenSwapExchange,
        userA,
        maxTokens,
        msgValue
      );
    });

    it("Should revert if ethBought is not greater than zero", async () => {
      const ETH_BOUGHT = BigNumber.from("0");

      const tx = RamenSwapExchange.getTokenToEthOutputPrice(ETH_BOUGHT);
      await expect(tx).to.be.revertedWith(
        "ethBought should be greater than zero"
      );
    });
    it("Should revert if ethBought is greater than or equal to EthAmount", async () => {
      const ETH_BOUGHT = await ethers.provider.getBalance(
        RamenSwapExchange.address
      );

      const tx = RamenSwapExchange.getTokenToEthOutputPrice(ETH_BOUGHT);
      await expect(tx).to.be.revertedWith(
        "ethBought should be less than EthAmount"
      );
    });
    it("Should return proper amount of tokens that must be provided", async () => {
      const ETH_BOUGHT = BigNumber.from("500000000");
      const ETH_AMOUNT = await ethers.provider.getBalance(
        RamenSwapExchange.address
      );
      const TOKEN_AMOUNT = await token.balanceOf(RamenSwapExchange.address);

      const tokensThatMustBeSold =
        await RamenSwapExchange.getTokenToEthOutputPrice(ETH_BOUGHT);
      const expectedTokensThatMustBeSold = ETH_AMOUNT.mul(TOKEN_AMOUNT)
        .div(ETH_AMOUNT.sub(ETH_BOUGHT))
        .sub(TOKEN_AMOUNT)
        .add(1);
      expect(tokensThatMustBeSold).to.be.eql(expectedTokensThatMustBeSold);
    });
  });
  describe("ethToTokenSwapInput", () => {
    beforeEach(async () => {
      const maxTokens = BigNumber.from("50000000"); //5 * 10^7
      const msgValue = BigNumber.from("1000000000"); //10 ^ 9

      await addInitialLiquidity(
        token,
        RamenSwapExchange,
        userA,
        maxTokens,
        msgValue
      );
    });
    it("Should revert if its after deadline", async () => {
      const currentTimestamp = await latestBlockTimestamp();
      const invalidDeadline = currentTimestamp - 10;
      const minTokens = BigNumber.from("1");
      const msgValue = ethers.utils.parseEther("1");

      const tx = RamenSwapExchange.connect(userA).ethToTokenSwapInput(
        minTokens,
        invalidDeadline,
        { value: msgValue }
      );

      expect(tx).to.be.revertedWithCustomError(
        RamenSwapExchange,
        "AfterDeadline"
      );
    });

    it("Should revert if msg value is equal to zero", async () => {
      const currentTimestamp = await latestBlockTimestamp();
      const deadline = currentTimestamp + 100;
      const minTokens = BigNumber.from("1");
      const invalidMsgValue = ethers.utils.parseEther("0");

      const tx = RamenSwapExchange.connect(userA).ethToTokenSwapInput(
        minTokens,
        deadline,
        { value: invalidMsgValue }
      );

      await expect(tx).to.be.revertedWithCustomError(
        RamenSwapExchange,
        "EthNotProvided"
      );
    });
    it("Should revert if tokens to be received is less than min_tokens", async () => {
      const currentTimestamp = await latestBlockTimestamp();
      const deadline = currentTimestamp + 100;
      const invalidMinTokens = BigNumber.from("50000000");
      const msgValue = BigNumber.from("4000000000");

      const tx = RamenSwapExchange.connect(userA).ethToTokenSwapInput(
        invalidMinTokens,
        deadline,
        { value: msgValue }
      );

      await expect(tx).to.be.revertedWithCustomError(
        RamenSwapExchange,
        "NotEnoughTokensToBeReceived"
      );
    });
    it("Should swap properly", async () => {
      const currentTimestamp = await latestBlockTimestamp();
      const deadline = currentTimestamp + 100;
      const minTokens = BigNumber.from("40000000");
      const msgValue = BigNumber.from("4000000000");

      const userEthBalanceBeforeSwap = await ethers.provider.getBalance(
        userA.address
      );
      const userTokenBalanceBeforeSwap = await token.balanceOf(userA.address);

      const tx = RamenSwapExchange.connect(userA).ethToTokenSwapInput(
        minTokens,
        deadline,
        { value: msgValue }
      );

      await expect(tx)
        .emit(RamenSwapExchange, "TokenPurchase")
        .withArgs(userA.address, msgValue, minTokens);

      const userEthBalanceAfterSwap = await ethers.provider.getBalance(
        userA.address
      );
      const userTokenBalanceAfterSwap = await token.balanceOf(userA.address);

      expect(
        userEthBalanceAfterSwap.sub(userEthBalanceBeforeSwap.div(msgValue))
      ).to.be.greaterThan(BigNumber.from("4000000000"));
      expect(userTokenBalanceAfterSwap).to.be.eql(
        userTokenBalanceBeforeSwap.add(minTokens)
      );
    });
  });
  describe("tokenToEthSwapInput", async () => {
    beforeEach(async () => {
      const maxTokens = BigNumber.from("50000000"); //5 * 10^7
      const msgValue = BigNumber.from("1000000000"); //10 ^ 9

      await addInitialLiquidity(
        token,
        RamenSwapExchange,
        userA,
        maxTokens,
        msgValue
      );
    });
    it("Should revert if its after deadline", async () => {
      const currentTimestamp = await latestBlockTimestamp();
      const invalidDeadline = currentTimestamp - 10;
      const tokenSold = BigNumber.from("1");
      const minEth = BigNumber.from("1");

      const tx = RamenSwapExchange.connect(userA).tokenToEthSwapInput(
        tokenSold,
        minEth,
        invalidDeadline
      );

      expect(tx).to.be.revertedWithCustomError(
        RamenSwapExchange,
        "AfterDeadline"
      );
    });
    it("Should revert if tokenSold is equal to zero", async () => {
      const currentTimestamp = await latestBlockTimestamp();
      const deadline = currentTimestamp + 100;
      const invalidTokenSold = BigNumber.from("0");
      const minEth = BigNumber.from("1");

      const tx = RamenSwapExchange.connect(userA).tokenToEthSwapInput(
        invalidTokenSold,
        minEth,
        deadline
      );

      await expect(tx).to.be.revertedWith(
        "tokenSold must be greater than zero"
      );
    });
    it("Should revert if eth to be received is less than min_eth", async () => {
      const currentTimestamp = await latestBlockTimestamp();
      const deadline = currentTimestamp + 100;
      const tokenSold = BigNumber.from("50000000"); //10^7
      const invalidMinEth = BigNumber.from("1000000000"); //10^9

      const tx = RamenSwapExchange.tokenToEthSwapInput(
        tokenSold,
        invalidMinEth,
        deadline
      );

      await expect(tx).to.be.revertedWith(
        "eth to be received is less than min_eth"
      );
    });
    it("Should swap properly", async () => {
      const currentTimestamp = await latestBlockTimestamp();
      const deadline = currentTimestamp + 100;
      const tokenSold = BigNumber.from("50000000"); //10^7
      const minEth = BigNumber.from("500000000"); //10^9

      await token.connect(userA).approve(RamenSwapExchange.address, tokenSold);

      const tx = RamenSwapExchange.tokenToEthSwapInput(
        tokenSold,
        minEth,
        deadline
      );

      await expect(tx)
        .emit(RamenSwapExchange, "EthPurchase")
        .withArgs(userA.address, tokenSold, minEth);
    });
  });
});
