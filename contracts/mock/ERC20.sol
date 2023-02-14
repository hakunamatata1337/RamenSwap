pragma solidity 0.8.13;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestErc20 is ERC20 {
    constructor() ERC20("Tether USD", "USDT") {
        _mint(msg.sender, 1 ether);//10^18
    }

    function mint(uint amount) external {
        _mint(msg.sender, amount);
    }
}