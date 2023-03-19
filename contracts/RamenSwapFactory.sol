pragma solidity 0.8.13;

import "@openzeppelin/contracts-upgradeable/proxy/ClonesUpgradeable.sol";
import "./RamenSwapExchange.sol";

contract RamenSwapFactory {
    using ClonesUpgradeable for address;

    address immutable RamenSwapExchangeImplementation;
    uint totalId = 0;

    mapping (address => address) Erc20ToExchange;
    mapping (address => address) ExchangeToErc20;
    mapping (uint => address) IdToToken;
    constructor() {
        RamenSwapExchangeImplementation = address(new RamenSwapExchange());
    }
    ///@dev function to deploy exchange for specified token
    ///@param token address of token that user wants to deploy exchange for
    ///@return returns address of the exchange assigned to the token
    function deployExchange(address token) external returns (address) {
        require(token != address(0), "token cannot be address zero");
        require(Erc20ToExchange[token] == address(0));
        address ramenSwapExchange = RamenSwapExchangeImplementation.clone();
        RamenSwapExchange(ramenSwapExchange).initialize(token);
        Erc20ToExchange[token] = ramenSwapExchange;
        ExchangeToErc20[ramenSwapExchange] = token;
        IdToToken[totalId] = token;
        totalId = totalId + 1;
        return ramenSwapExchange;
    }
    ///@dev function that returns address of the exchange assigned to provided token
    ///@param token address of token for which user wants to retrive assigned exchange
    ///@notice if return value is address zero it means that this token does not have Exchange assigned to it 
    function getExchange(address token) external view returns (address) {
        return Erc20ToExchange[token];
    }

    ///@dev function that returns address of the token assigned to provided exchange
    ///@param exchange address of exchange for which user wants to retrive assigned token
    ///@notice if return value is address zero it means that this address is not RamenSwap's exchange
    function getToken(address exchange) external view returns (address) {
        return ExchangeToErc20[exchange];
    }

     ///@dev function that returns address of the token assigned to provided Id
    ///@param tokenId id of the token that user wants to get address
    ///@notice if return value is address zero it means there is no such token with that id
    function getTokenWithId(uint tokenId) external view returns (address) {
        return IdToToken[tokenId];
    } 
}