pragma solidity 0.8.13;

import "./RamenSwapExchange.sol";

contract RamenSwapFactory {
    uint totalId = 0;

    mapping (address => address) Erc20ToExchange;
    mapping (address => address) ExchangeToErc20;
    constructor() {
        
    }
    ///@dev function to deploy exchange for specified token
    ///@param token address of token that user wants to deploy exchange for
    ///@return returns address of the exchange assigned to the token
    ///@notice if token already has exchange assigned to it function returns assigned exchange
    function deployExchange(address token) external returns (address) {
        require(token != address(0), "token cannot be address zero");
        require(Erc20ToExchange[token] == address(0));
        address ramenSwapExchange = address(new RamenSwapExchange(token));
        Erc20ToExchange[token] = ramenSwapExchange;
        ExchangeToErc20[ramenSwapExchange] = token;
        return ramenSwapExchange;
        
    }

    ///@notice if return value is address zero it means that this token does not have Exchange assigned to it 
    function getExchange(address token) external view returns (address) {
        return Erc20ToExchange[token];
    }

    ///@notice if return value is address zero it means that this token does not have exchange assigned to it
    function getToken(address exchange) external view returns (address) {
        return ExchangeToErc20[exchange];
    }

    function getTokenWithId(uint tokenId) external view returns (address) {
        return address(0);
    } 
}