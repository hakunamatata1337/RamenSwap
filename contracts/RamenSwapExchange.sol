pragma solidity 0.8.13;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./interfaces/IRamenSwapFactory.sol";

//@Todo use custom errors
contract RamenSwapExchange is ERC20Upgradeable{
    using SafeERC20 for ERC20;

    IRamenSwapFactory public factory;
    ERC20 public token;
    

    event TokenPurchase(address indexed buyer, uint256 indexed eth_sold, uint256 indexed tokens_bought);
    event EthPurchase(address indexed buyer, uint256 indexed tokens_sold, uint256 indexed eth_bought);
    event AddLiquidity(address indexed provider, uint256 indexed eth_amount, uint256 indexed token_amount);
    event RemoveLiquidity(address indexed provider, uint256 indexed eth_amount, uint256 indexed token_amount);

    function initialize(address _token) public initializer {
        __ERC20_init("RamenToken", "RAMEN");
        token = ERC20(_token);
        factory = IRamenSwapFactory(msg.sender);
    }
    
    ///@dev function used to add liquidity to the pool
    ///@param minLiquidity minimal amount of liquidity tokens that wants to receiver
    ///@param maxTokens max amount of tokens that user is willing to deposit to the pool
    ///@param deadline time after which transaction is invalid 
    function addLiquidity(uint minLiquidity, uint maxTokens, uint deadline) external payable returns(uint256) {
            require(deadline > block.timestamp, "RamenSwap: Its after deadline");
            require( msg.value > 0 , "RamenSwap: msg value should be greater than zero");
            require(maxTokens > 0, "RamenSwap: max tokens should be greater than zero");
            uint totalLiquidity= totalSupply();
            if(totalLiquidity != 0) {
                require(minLiquidity != 0, "RamenSwap: minLiquidity should be greater than zero");
                uint ethReserve = address(this).balance - msg.value;
                uint tokenReserve = token.balanceOf(address(this));
                uint tokenAmount = msg.value * tokenReserve / ethReserve + 1;
                uint liquidityMinted = msg.value * totalLiquidity / ethReserve;
                require(maxTokens >= tokenAmount,"maxTokens is less than required tokenAmount"); 
                require(liquidityMinted >= minLiquidity, "liquidity minted is less than minLiquidity");
                token.safeTransferFrom(msg.sender, address(this), tokenAmount);
                emit AddLiquidity(msg.sender, msg.value, tokenAmount);
                _mint(msg.sender, liquidityMinted);
                return liquidityMinted;
            }else {
                require(msg.value >= 1 gwei, "RamenSwap: msg value should be at least one gwei");
                require(factory.getExchange(address(token)) == address(this));
                uint initialLiquidity = address(this).balance;
                token.safeTransferFrom(msg.sender, address(this), maxTokens);
                _mint(msg.sender, initialLiquidity);
                emit AddLiquidity(msg.sender, msg.value, maxTokens);
                return initialLiquidity;
            }
    }
    ///@dev function used to remove liquidity from the pool
    ///@param amount amount of liquidity that user wants to burn
    ///@param min_eth minimum amount of eth user wants to receive
    ///@param min_tokens minimum amount of tokens user wants to receive
    ///@param deadline time after which transaction is invalid
    function removeLiquidity(uint amount,uint min_eth,uint min_tokens,uint deadline) external returns (uint256, uint256) {
        require(deadline > block.timestamp, "RamenSwap: Its after deadline");
        require(amount > 0, "RamenSwap: amount must be greater than zero");
        require(min_eth > 0 && min_tokens > 0, "min_eth and min_token should be greater than zero");
        uint totalLiquidity = totalSupply();
        require(totalLiquidity > 0, "RamenSwap: totalLiquidity");
        uint ethAmount = amount * address(this).balance / totalLiquidity;
        uint tokenAmount = amount * token.balanceOf(address(this)) / totalLiquidity;
        require(min_eth <= ethAmount && min_tokens <= tokenAmount, "not enough tokens or eth withdrawn");
        _burn(msg.sender, amount);
        token.safeTransferFrom(address(this), msg.sender, tokenAmount);
        payable(msg.sender).transfer(ethAmount);
        emit RemoveLiquidity(msg.sender, ethAmount, tokenAmount);
        return (ethAmount , tokenAmount);
    }

    
    ///@dev function to swap provided ethereum for tokens
    ///@param min_tokens minimum amount of tokens that user wants to receive
    ///@param deadline time after which transaction is invalid
    function ethToTokenSwapInput(uint256 min_tokens, uint256 deadline) external payable returns (uint256) {
        require(deadline > block.timestamp, "RamenSwap: Its after deadline");
         require(msg.value != 0, "msg value must be greater than zero");
        uint256 tokensToBeReceived = _getInputPrice(msg.value, address(this).balance - msg.value, token.balanceOf(address(this)));
        require(tokensToBeReceived >= min_tokens, "tokens to be received is less than min_tokens");
        token.safeTransfer( msg.sender, tokensToBeReceived);
        emit TokenPurchase(msg.sender, msg.value, tokensToBeReceived);
        return tokensToBeReceived;
    } 

    ///@dev function to swap ethereum for specified amount of tokens
    ///@param tokensBought amount of tokens user wants to buy
    ///@param deadline time after which transaction is invalid
    function ethToTokenSwapOutput(uint tokensBought, uint deadline) external payable returns (uint256) {
        require(deadline > block.timestamp, "RamenSwap: Its after deadline");
        uint tokenAmount = token.balanceOf(address(this));
        uint ethAmount = address(this).balance;
        uint ethToProvide = _getOutputPrice(tokensBought, tokenAmount, ethAmount - msg.value);
        require(ethToProvide >= msg.value , "user did not provide enough eth");
        uint refund = ethToProvide - msg.value;
        if(refund > 0) {
            payable(msg.sender).transfer(refund);
        }
        token.safeTransferFrom(address(this), msg.sender, tokensBought);
        emit TokenPurchase(msg.sender, ethToProvide, tokensBought);
        return ethToProvide;
    }

    
    ///@dev function to swap provided tokens for ethereum
    ///@param tokenSold amount of tokens user is selling for ethereum
    ///@param min_eth minimum amount of eth that user wants to receive
    ///@param deadline time after which transaction is invalid
    function tokenToEthSwapInput(uint256 tokenSold, uint256 min_eth, uint256 deadline) external  returns (uint256) {
        require(deadline > block.timestamp, "RamenSwap: Its after deadline");
        require(tokenSold != 0, "tokenSold must be greater than zero");
        uint ethToBeReceived = _getInputPrice(tokenSold, token.balanceOf(address(this)), address(this).balance);
        require(ethToBeReceived >= min_eth, "eth to be received is less than min_eth");
        token.safeTransferFrom(msg.sender, address(this), tokenSold);
        payable(msg.sender).transfer(ethToBeReceived);
        emit EthPurchase(msg.sender, tokenSold, ethToBeReceived);
        return ethToBeReceived;
    } 

    ///@dev function to swap  tokens for specified amount of ethereum
    ///@param ethBought amount of ethereum user wants to buy
    ///@param maxTokens maximum amount of tokens user wants to sell
    ///@param deadline time after which transaction is invalid
    function tokenToEthSwapOutput(uint ethBought,uint maxTokens, uint deadline) external payable returns (uint256) {
        require(deadline > block.timestamp, "RamenSwap: Its after deadline");
        uint ethAmount = address(this).balance;
        uint tokenAmount = token.balanceOf(address(this));
        uint tokensToProvide = _getOutputPrice(ethBought, ethAmount, tokenAmount);
        require(maxTokens >= tokensToProvide, "RamenSwap: user needs to provide more tokens");
        token.safeTransferFrom(msg.sender, address(this), tokensToProvide);
        payable(msg.sender).transfer(ethBought);
        emit EthPurchase(msg.sender, tokensToProvide, ethBought);
        return tokensToProvide;
    }


    //@TODO implement fees
    //@TODO check if it reverts if ethSold is so great that tokensBought exceedes tokenAmount
    ///@dev function computes how much tokens can be bought by selling ethSold amount of ether
    ///@param ethSold amount of ether to be sold
    ///@return amount of tokens to be received 
    function getEthToTokenInputPrice(uint ethSold) view public returns(uint256){
        require(ethSold != 0, "ethSold should be greater than zero");
        uint tokenAmount = token.balanceOf(address(this));
        uint ethAmount = address(this).balance;
        return _getInputPrice(ethSold, ethAmount, tokenAmount);
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
        return _getOutputPrice(tokenBought, tokenAmount,ethAmount);
    }

 
    ///@dev function computes how much ethereum can be bought by selling tokenSold amount of tokens
    ///@param tokenSold amount of tokens to be sold
    ///@return amount of eth to be received 
     function getTokenToEthInputPrice(uint tokenSold) view external returns(uint256){
        uint tokenAmount = token.balanceOf(address(this));
        uint ethAmount = address(this).balance;
        require(tokenSold != 0, "tokenSold should be greater than zero");
        return _getInputPrice(tokenSold, tokenAmount, ethAmount);
    }

    ///@dev function computes how much tokens user has to deposit to get ethBought amount of ethereum
    ///@param ethBought amount of ethereum user wants to buy
    ///@return amount of tokens user has to deposit 
    function getTokenToEthOutputPrice(uint ethBought) view external returns(uint256){
        uint tokenAmount = token.balanceOf(address(this));
        uint ethAmount = address(this).balance;
        require(ethBought != 0, "ethBought should be greater than zero");
        require(ethBought < ethAmount, "ethBought should be less than EthAmount");
        return _getOutputPrice(ethBought, ethAmount,tokenAmount);
    }

    
    function _getInputPrice(uint inputAmount, uint inputReserve, uint outputReserve) private pure returns(uint256) {
        require(inputReserve > 0 && outputReserve > 0);
        return ((inputAmount * outputReserve)/(inputReserve + inputAmount));
    }

    function _getOutputPrice(uint outputAmount, uint outputReserve, uint inputReserve) private pure returns (uint256) {
        require(inputReserve > 0 && outputReserve > 0);
        return ((inputReserve * outputAmount)/(outputReserve - outputAmount)+1);
    }


}