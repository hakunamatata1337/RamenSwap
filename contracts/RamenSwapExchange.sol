pragma solidity 0.8.13;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./interfaces/IRamenSwapFactory.sol";

contract RamenSwapExchange is ERC20{
    IRamenSwapFactory public immutable factory;
    IERC20 public token;

    // mapping(address => ) public balanceOf;

    //@TODO change to Proxy pattern
    constructor(address _token) ERC20("RamenToken","RAMEN"){
        token = IERC20(_token);
        factory = IRamenSwapFactory(msg.sender);
    }

    function addLiquidity(uint minLiquidity, uint maxTokens, uint deadline) external payable returns(uint256) {
            uint totalLiquidity= totalSupply();
            if(totalLiquidity > 0) {
                require(minLiquidity > 0);
                uint ethReserve = address(this).balance - msg.value;
                uint tokenReserve = token.balanceOf(address(this));
                uint tokenAmount = msg.value * tokenReserve / ethReserve + 1;
                uint liquidityMinted = msg.value * totalLiquidity / ethReserve;
                require(maxTokens >= tokenAmount && liquidityMinted >= minLiquidity);
                require(token.transferFrom(msg.sender, address(this), tokenAmount), "Token transfer did not succed");
                _mint(msg.sender, liquidityMinted);
                return liquidityMinted;
            }else {
                require(deadline > block.timestamp, "block timestamp is after deadline");
                require(msg.value >= 1 gwei);
                require(factory.getExchange(address(token)) == address(this));
                uint initialLiquidity = address(this).balance;
                require(token.transferFrom(msg.sender, address(this), maxTokens));
                _mint(msg.sender, initialLiquidity);
                //Log Add Liquidity
                return initialLiquidity;
            }
            
    }
    function removeLiquidity(uint amount,uint min_eth,uint min_tokens,uint deadline) external {}

    function tradeEthForErc20() external {}
    function tradeErc20ForEth() external {}

    //@TODO implement fees
    //@TODO check if it reverts if ethSold is so great that tokensBought exceedes tokenAmount
    ///@dev function computes how much tokens can be bought by selling ethSold amount of ether
    ///@param ethSold amount of ether to be sold
    ///@return amount of tokens to be received 
    function getEthToTokenInputPrice(uint ethSold) view external returns(uint256){
        require(ethSold != 0, "ethSold should be greater than zero");
        //@TODO check if deltaY = Y - (k/[X + deltaX]) is more efficient
        uint tokenAmount = token.balanceOf(address(this));
        uint ethAmount = address(this).balance;
        return (ethSold * tokenAmount)/(ethAmount + ethSold);
    }
     //@TODO implement fees
    ///@dev function computes how much eth user has to deposit to get tokenBought amount of tokens
    ///@param tokenBought amount of tokens to be bought
    ///@return amount of eth user has to deposit 
    function getEthToTokenOutputPrice(uint tokenBought) view external returns(uint256){
        uint tokenAmount = token.balanceOf(address(this));
        uint ethAmount = address(this).balance;
        require(tokenBought != 0, "tokenBought should be greater than zero");
        require(tokenBought < tokenAmount, "tokenBought should be less than TokenAmount");
        return ((ethAmount * tokenBought)/(tokenAmount - tokenBought) + 1);
    }

     function getTokenToEthInputPrice(uint tokenSold) view external returns(uint256){
        uint tokenAmount = token.balanceOf(address(this));
        uint ethAmount = address(this).balance;
        require(tokenSold != 0, "tokenSold should be greater than zero");
        return (tokenSold * ethAmount)/(tokenAmount + tokenSold);
    }

     function getTokenToEthOutputPrice(uint ethBought) view external returns(uint256){
        uint tokenAmount = token.balanceOf(address(this));
        uint ethAmount = address(this).balance;
        require(ethBought != 0, "ethBought should be greater than zero");
        require(ethBought < ethAmount, "ethBought should be less than EthAmount");
        return ((tokenAmount * ethBought)/(ethAmount - ethBought) + 1);
    }

}