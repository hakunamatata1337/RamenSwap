import { expect } from "chai";
import { ethers } from "hardhat";
import { RamenSwapExchange, RamenSwapFactory } from "../typechain-types";

describe("RamenSwapExchane",async ()=> {
    let token; 
    let RamenSwapFactory:RamenSwapFactory;
    let RamenSwapExchange: RamenSwapExchange;

    beforeEach(async ()=> {
        //@TODO create mock token
        [token] =await ethers.getSigners();
        token = token.address;
        const ETH_AMOUNT = 1000;
        const TOKEN_AMOUNT = 50;

        const ramenSwapFactory = await ethers.getContractFactory("RamenSwapFactory");
        RamenSwapFactory = await ramenSwapFactory.deploy();
        RamenSwapFactory.deployed();

        await RamenSwapFactory.deployExchange(token, ETH_AMOUNT, TOKEN_AMOUNT);
        const RamenSwapExchangeAddress =await RamenSwapFactory.getExchange(token);

        const RamenSwapExchangeFactory = await ethers.getContractFactory("RamenSwapExchange");
        RamenSwapExchange = await RamenSwapExchangeFactory.attach(RamenSwapExchangeAddress);
    })
})