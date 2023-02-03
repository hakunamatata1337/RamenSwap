pragma solidity 0.8.13;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract RamenSwapExchange {
    IERC20 public token;
    uint public EthAmount;
    uint public TokenAmount;
    uint public EthXToken;
    uint public totalLiquidity;//@TODO create ramen tokens 

    //@TODO change to Proxy pattern
    constructor(address _token, uint _EthAmount, uint _TokenAmount) {
        token = IERC20(_token);
        EthAmount = _EthAmount;
        TokenAmount = _TokenAmount;
        EthXToken = EthAmount * TokenAmount;
    }

    function addLiquidity(uint minLiquidity, uint maxTokens, uint deadline) external payable {}
    function removeLiquidity(uint amount,uint min_eth,uint min_tokens,uint deadline) external {}

    function tradeEthForErc20() external {}
    function tradeErc20ForEth() external {}

    //@TODO implement fees
    ///@dev function computes how much tokens can be bought by selling ethSold amount of ether
    ///@param ethSold amount of ether to be sold
    ///@return amount of tokens to be received 
    function getEthToTokenInputPrice(uint ethSold) view external returns(uint256){
        require(ethSold != 0, "ethSold should be greater than zero");
        return (ethSold * TokenAmount)/(1 * EthAmount + ethSold);
    }
     //@TODO implement fees
    ///@dev function computes how much eth user has to deposit to get tokenBought amount of tokens
    ///@param tokenBought amount of tokens to be bought
    ///@return amount of eth user has to deposit 
    function getEthToTokenOutputPrice(uint tokenBought) view external returns(uint256){
        require(tokenBought != 0, "tokenBought should be greater than zero");
        require(tokenBought < TokenAmount, "tokenBought should be less than TokenAmount");
        return ((EthAmount * tokenBought)/TokenAmount - tokenBought);//@TODO Check why there is +1 at the end in the formalized specification
    }
}