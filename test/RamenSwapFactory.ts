import { expect } from "chai";
import { ethers } from "hardhat";
import { ERC20, RamenSwapFactory } from "../typechain-types";

//@TODO Run tests on fork
describe("RamenSwapFactory", ()=>{
    let RamenSwapFactory: RamenSwapFactory;
    let token:ERC20;

    beforeEach(async ()=> {
        const ERC20Factory = await ethers.getContractFactory("Erc20");
        token = await ERC20Factory.deploy();
        await token.deployed();

        const ramenSwapFactory = await ethers.getContractFactory("RamenSwapFactory");
        RamenSwapFactory = await ramenSwapFactory.deploy();

        RamenSwapFactory.deployed();
    })
    describe("deployExchange",  ()=> {
        const ETH_AMOUNT = 1000;
        const TOKEN_AMOUNT = 50;

        it("Should not deploy exchange if provided address is address zero", async ()=> {
            const deployExchangeTx = RamenSwapFactory.deployExchange(ethers.constants.AddressZero, ETH_AMOUNT, TOKEN_AMOUNT);
            await expect(deployExchangeTx).to.be.revertedWith("token cannot be address zero");
        })
        it("Should deploy exchange", async ()=> {
            await RamenSwapFactory.deployExchange(token.address,ETH_AMOUNT, TOKEN_AMOUNT);
            const exchangeAddress = await RamenSwapFactory.getExchange(token.address);
            const tokenAddress = await RamenSwapFactory.getToken(exchangeAddress);
            expect(exchangeAddress).to.not.be.eql(ethers.constants.AddressZero);
            expect(tokenAddress).to.be.eql(token.address);
        })
        
    })
});
