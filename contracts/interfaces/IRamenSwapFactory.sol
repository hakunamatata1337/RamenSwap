interface IRamenSwapFactory {

    ///@dev function to deploy exchange for specified token
    ///@param token address of token that user wants to deploy exchange for
    ///@return returns address of the exchange assigned to the token
    ///@notice if token already has exchange assigned to it function returns assigned exchange
    function deployExchange(address token, uint ethAmount, uint tokenAmount) external returns (address);

    ///@notice if return value is address zero it means that this token does not have Exchange assigned to it 
    function getExchange(address token) external view returns (address);

    ///@notice if return value is address zero it means that this token does not have exchange assigned to it
    function getToken(address exchange) external view returns (address);

    function getTokenWithId(uint tokenId) external view returns (address); 
}