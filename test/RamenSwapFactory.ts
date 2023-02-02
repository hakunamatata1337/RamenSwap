import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { RamenSwapFactory } from "../typechain-types";

//@TODO Run tests on fork
describe("RamenSwapFactory", ()=>{
    let RamenSwapFactory: RamenSwapFactory;

    beforeEach(async ()=> {
        const ramenSwapFactory = await ethers.getContractFactory("RamenSwapFactory");
        RamenSwapFactory = await ramenSwapFactory.deploy();

        RamenSwapFactory.deployed();
    })
    describe("deployExchange",  ()=> {
        it("should not deploy exchange if provided address is address zero", async ()=> {
            const deployExchangeTx = RamenSwapFactory.deployExchange(ethers.constants.AddressZero);
            await expect(deployExchangeTx).to.be.revertedWith("token cannot be address zero");
        })
    })
});
