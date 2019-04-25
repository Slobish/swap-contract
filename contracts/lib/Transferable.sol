pragma solidity 0.5.7;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC721/IERC721.sol";
import "openzeppelin-solidity/contracts/introspection/ERC165Checker.sol";


contract Transferable {
  using ERC165Checker for address;

  bytes4 internal constant INTERFACE_ERC721 = 0x80ac58cd;

  function swap(
      address makerAddress,
      uint256 makerParam,
      address makerToken,
      address takerAddress,
      uint256 takerParam,
      address takerToken
  ) internal {
    transferSafe("MAKER", makerAddress, takerAddress, makerParam, makerToken);
    transferSafe("TAKER", takerAddress, makerAddress, takerParam, takerToken);
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

  function transferFungible(
    address token,
    address from,
    address to,
    uint256 param
  ) internal {
    require(IERC20(token).transferFrom(from, to, param));
  }

  function transferAny(
    address token,
    address from,
    address to,
    uint256 param
  ) internal {
    if (token._supportsInterface(INTERFACE_ERC721)) {
      IERC721(token)
        .safeTransferFrom(from, to, param);
    } else {
      require(IERC20(token)
        .transferFrom(from, to, param));
    }
  }

  function transferSafe(
    bytes memory side,
    address from,
    address to,
    uint256 param,
    address token
  ) internal {
    if (token._supportsInterface(INTERFACE_ERC721)) {
      IERC721(token).safeTransferFrom(from, to, param);
    } else {
      require(IERC20(token).balanceOf(from) >= param,
        string(abi.encodePacked(side, "_INSUFFICIENT_BALANCE")));
      require(IERC20(token).allowance(from, address(this)) >= param,
        string(abi.encodePacked(side, "_INSUFFICIENT_ALLOWANCE")));
      require(IERC20(token).transferFrom(from, to, param));
    }
  }
}
