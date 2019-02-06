pragma solidity 0.5.0;

import "./Interfaces.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC721/IERC721.sol";


contract Transfers is Interfaces {

  bytes4 internal constant INTERFACE_ERC721 = 0x80ac58cd;

  constructor () public Interfaces() {}

  function swap(
      address makerAddress,
      uint256 makerParam,
      address makerToken,
      address takerAddress,
      uint256 takerParam,
      address takerToken
  ) public {
    transfer(makerAddress, takerAddress, makerParam, makerToken);
    transfer(takerAddress, makerAddress, takerParam, takerToken);
  }

  function send(
      address receiver,
      uint256 value
  ) internal {
    // Cast the order maker as a payable address for ether transfer.
    address payable wallet = address(uint160(receiver));

    // Transfer the taker side of the trade (ether) to the makerWallet.
    wallet.transfer(value);
  }

  function transfer(
      address from,
      address to,
      uint256 param,
      address token
  ) internal {
    if (doesContractImplementInterface(token, INTERFACE_ERC721)) {
      IERC721(token).safeTransferFrom(from, to, param);
    } else {
      require(IERC20(token).allowance(from, address(this)) >= param, "INSUFFICIENT_ALLOWANCE");
      require(IERC20(token).balanceOf(from) >= param, "INSUFFICIENT_BALANCE");
      IERC20(token).transferFrom(from, to, param);
    }
  }
}
