pragma solidity 0.8.13;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract RamenSwapExchange {
    IERC20 public token;
    uint EthAmount;
    uint TokenAmount;
    uint totalLiquidity;//@TODO create ramen tokens 

    //@TODO change to Proxy pattern
    constructor(address _token) {
        token = IERC20(_token);
    }

    function addLiquidity(uint minLiquidity, uint maxTokens, uint deadline) external payable {}
    function removeLiquidity(uint amount,uint min_eth,uint min_tokens,uint deadline) external {}

    function tradeEthForErc20() external {}
    function tradeErc20ForEth() external {}

    function getEthToTokenInputPrice() external {}
    function getEthToTokenOutputPrice() external {}
}