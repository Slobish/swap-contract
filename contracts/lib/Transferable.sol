pragma solidity 0.5.7;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC721/IERC721.sol";
import "openzeppelin-solidity/contracts/introspection/ERC165Checker.sol";

/**
 * @title Contracts that contains functions for supporting
 * ERC20 and ERC721 transfers of tokens and swapping them atomically
 * @dev contains INTERFACE_ERC721 = 0x80ac58cd.
 */
contract Transferable {
  using ERC165Checker for address;

  bytes4 internal constant INTERFACE_ERC721 = 0x80ac58cd;

  /**
   * @dev Performs two-part token transfer between a maker and a taker with specified tokens and amount
   * @param makerAddress address creator of the signed order to trade with a counterparty.
   * @param makerParam uint256 defines either the amount if ERC20 token or id of token if ERC721 for maker.
   * @param makerToken address defines the token address for either an ERC20 or ERC721 token contract for maker.
   * @param takerAddress address submitter of the signed order and counterparty of the trade.
   * @param takerParam uint256 defines either the amount if ERC20 token or id of token if ERC721 for taker.
   * @param takerToken address defines the token address for either an ERC20 or ERC721 token contract for taker.
   */
  function swap(
      address makerAddress,
      uint256 makerParam,
      address makerToken,
      address takerAddress,
      uint256 takerParam,
      address takerToken
  ) internal {
    transfer("MAKER", makerAddress, takerAddress, makerParam, makerToken);
    transfer("TAKER", takerAddress, makerAddress, takerParam, takerToken);
  }

  /**
   * @dev Performs address conversion and Ether transfer
   * @param receiver address internal helper function that allows taker
   * to send Ether (in wei) to a maker.
   * @param value uint256 amount in wei sent.
   */
  function send(
      address receiver,
      uint256 value
  ) internal {
    // Cast the order maker as a payable address for ether transfer.
    address payable wallet = address(uint160(receiver));

    // Transfer the taker side of the trade (ether) to the makerWallet.
    wallet.transfer(value);
  }

  /**
   * @dev Performs a token transfer between a maker and a taker with specified token and amount
   * @param side bytes memory value is either MAKER or TAKER and used for require strings.
   * @param from address defines either the amount if ERC20 token or id of token if ERC721 for maker.
   * @param to address defines the token address for either an ERC20 or ERC721 token contract for maker.
   * @param param uint256 submitter of the signed order and counterparty of the trade.
   * @param token address defines either the amount if ERC20 token or id of token if ERC721 for taker.
   */
  function transfer(
    bytes memory side,
    address from,
    address to,
    uint256 param,
    address token
  ) internal {
    if (token._supportsInterface(INTERFACE_ERC721)) {
      IERC721(token).safeTransferFrom(from, to, param);
    } else {
      require(IERC20(token).allowance(from, address(this)) >= param,
        string(abi.encodePacked(side, "_INSUFFICIENT_ALLOWANCE")));
      require(IERC20(token).balanceOf(from) >= param,
        string(abi.encodePacked(side, "_INSUFFICIENT_BALANCE")));
      require(IERC20(token).transferFrom(from, to, param));
    }
  }
}
