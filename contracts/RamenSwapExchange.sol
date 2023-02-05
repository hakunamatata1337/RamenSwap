pragma solidity 0.8.13;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IRamenSwapFactory.sol";

contract RamenSwapExchange {
    IRamenSwapFactory public immutable factory;
    IERC20 public token;
    uint public EthAmount;
    uint public TokenAmount;
    uint public EthXToken;
    uint public totalLiquidity;//@TODO create ramen tokens 
    uint public totalSupply;

    // mapping(address => ) public balanceOf;

    //@TODO change to Proxy pattern
    constructor(address _token, uint _EthAmount, uint _TokenAmount) {
        token = IERC20(_token);
        EthAmount = _EthAmount;
        TokenAmount = _TokenAmount;
        EthXToken = EthAmount * TokenAmount;
        factory = IRamenSwapFactory(msg.sender);
    }

    function addLiquidity(uint minLiquidity, uint maxTokens, uint deadline) external payable returns(uint256) {
            if(totalLiquidity > 0) {

            }else {
                require(deadline > block.timestamp, "block timestamp is after deadline");
                require(msg.value >= 1 gwei);
                require(factory.getExchange(address(token)) == address(this));
                uint tokenAmount = maxTokens;  
                uint initialLiquidity = address(this).balance;
                totalSupply = totalSupply + initialLiquidity;
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
        return (ethSold * TokenAmount)/(EthAmount + ethSold);
    }
     //@TODO implement fees
    ///@dev function computes how much eth user has to deposit to get tokenBought amount of tokens
    ///@param tokenBought amount of tokens to be bought
    ///@return amount of eth user has to deposit 
    function getEthToTokenOutputPrice(uint tokenBought) view external returns(uint256){
        require(tokenBought != 0, "tokenBought should be greater than zero");
        require(tokenBought < TokenAmount, "tokenBought should be less than TokenAmount");
        return ((EthAmount * tokenBought)/(TokenAmount - tokenBought));//@TODO Check why there is +1 at the end in the formalized specification
    }

     function getTokenToEthInputPrice(uint tokenSold) view external returns(uint256){
        require(tokenSold != 0, "tokenSold should be greater than zero");
        return (tokenSold * EthAmount)/(TokenAmount + tokenSold);
    }

     function getTokenToEthOutputPrice(uint ethBought) view external returns(uint256){
        require(ethBought != 0, "ethBought should be greater than zero");
        require(ethBought < EthAmount, "ethBought should be less than EthAmount");
        return ((TokenAmount * ethBought)/(EthAmount - ethBought));//@TODO Check why there is +1 at the end in the formalized specification
    }

}