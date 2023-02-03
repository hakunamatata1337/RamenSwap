import { expect } from "chai";
import { ethers } from "hardhat";
import { BigNumber } from "ethers";
import { ERC20, RamenSwapExchange, RamenSwapFactory } from "../typechain-types";

describe("RamenSwapExchane",async ()=> {
    const ETH_AMOUNT = BigNumber.from("1000");
    const TOKEN_AMOUNT = BigNumber.from("50");
    let token:ERC20; 
    let RamenSwapFactory:RamenSwapFactory;
    let RamenSwapExchange: RamenSwapExchange;

    beforeEach(async ()=> {
        const ERC20Factory = await ethers.getContractFactory("Erc20");
        token = await ERC20Factory.deploy();
        await token.deployed();

        const ramenSwapFactory = await ethers.getContractFactory("RamenSwapFactory");
        RamenSwapFactory = await ramenSwapFactory.deploy();
        RamenSwapFactory.deployed();

        await RamenSwapFactory.deployExchange(token.address, ETH_AMOUNT, TOKEN_AMOUNT);
        const RamenSwapExchangeAddress =await RamenSwapFactory.getExchange(token.address);

        const RamenSwapExchangeFactory = await ethers.getContractFactory("RamenSwapExchange");
        RamenSwapExchange = await RamenSwapExchangeFactory.attach(RamenSwapExchangeAddress);
    })

    describe("getEthToTokenInputPrice",async ()=> {
        it("Should revert if ethSold amount is equal to zero", async ()=> {
            const ETH_SOLD = 0;
            const tx = RamenSwapExchange.getEthToTokenInputPrice(ETH_SOLD);

            await expect(tx).to.be.revertedWith("ethSold should be greater than zero");
        })
        it("Should return proper amount of tokens to be received", async ()=> {
            const ETH_SOLD = BigNumber.from("4000");
            // deltaY = Y - (k/[X + deltaX])
            const expectedTokensReceived = TOKEN_AMOUNT.sub((ETH_AMOUNT.mul(TOKEN_AMOUNT)).div(ETH_SOLD.add(ETH_AMOUNT)));
            const tokensReceived = await RamenSwapExchange.getEthToTokenInputPrice(ETH_SOLD);
           
            expect(tokensReceived).to.be.eql(expectedTokensReceived);
        })
    })

    describe("getEthToTokenOutputPrice",()=> {
        it("Should revert if tokenBought is equal to zero", async ()=> {
            const TOKEN_BOUGHT = 0;
            const tx = RamenSwapExchange.getEthToTokenOutputPrice(TOKEN_BOUGHT);

            await expect(tx).to.be.revertedWith("tokenBought should be greater than zero");
        })
        it("Should revert if tokenBought is greater or equal to TokenAmount", async ()=> {
            const TOKEN_BOUGHT = TOKEN_AMOUNT;
            const tx = RamenSwapExchange.getEthToTokenOutputPrice(TOKEN_BOUGHT);

            await expect(tx).to.be.revertedWith("tokenBought should be less than TokenAmount");
        })
        it("Should return proper amount of wei that must be provided", async ()=> {
            const TOKEN_BOUGHT = BigNumber.from("40");

            const ethThatMustBeSold = await RamenSwapExchange.getEthToTokenOutputPrice(TOKEN_BOUGHT);
            const expectedEthThatMustBeSold = (ETH_AMOUNT.mul(TOKEN_AMOUNT).div(TOKEN_AMOUNT.sub(TOKEN_BOUGHT))).sub(ETH_AMOUNT); 

            await expect(ethThatMustBeSold).to.be.eql(expectedEthThatMustBeSold);
        })
    })
})