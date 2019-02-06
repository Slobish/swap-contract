pragma solidity 0.5.0;
pragma experimental ABIEncoderV2;

import "./lib/Events.sol";
import "./lib/Transfers.sol";
import "./lib/Verifier.sol";


/**
* @title Swap Protocol
*/
contract Swap is
    Events,
    Transfers,
    Verifier {

  // Mapping of makerAddress to mapping of nonces (true = already filled).
  mapping (address => mapping (uint256 => bool)) public fills;

  // Construct the contract and pull in mixins.
  constructor () public Events() Transfers() Verifier() {}

/**
  *   @param order Order
  *   @param signature bytes
  */
  function fill(Order memory order, Signature memory signature)
      public
      payable {
      // Ensure the order has not been filled or canceled.
        require(!fills[order.maker.wallet][order.nonce],
            "ALREADY_FILLED");

        // Ensure the order has not expired.
        require(order.expiration > block.timestamp,
            "ORDER_EXPIRED");

        // Check that the order has a valid signature.
        require(verify(order, signature),
            "INVALID_SIGNATURE");

        // Check that a specified sender is the actual sender.
        // TODO: Taker should approve Sender to fill orders on its behalf.
        if (order.sender != address(0)) {
          require(order.sender == msg.sender,
            "INCORRECT_SENDER");
        } else {
          require(order.taker.wallet == msg.sender,
            "TAKER_MUST_BE_SENDER");
        }

        // Mark the order filled.
        fills[order.maker.wallet][order.nonce] = true;

        // If the takerToken is null, expect that this is an order for ether.
        if (order.taker.token == address(0)) {

          // The amount of ether sent must match the taker param.
          require(msg.value == order.taker.param,
              "VALUE_MUST_BE_SENT");

          // Send the ether amount to the maker.
          send(order.maker.wallet, msg.value);

          // Transfer the maker side of the trade to the taker.
          transfer(
              order.maker.wallet,
              order.taker.wallet,
              order.maker.param,
              order.maker.token
          );

        } else {

          // Perform the trade for ether or tokens.
          require(msg.value == 0,
              "VALUE_MUST_BE_ZERO");

          // Perform the swap between maker and taker.
          swap(
              order.maker.wallet,
              order.maker.param,
              order.maker.token,
              order.taker.wallet,
              order.taker.param,
              order.taker.token
          );

        }

        // Transfer a specified fee to an partner.
        if (order.partner.wallet != address(0)) {
          transfer(
            order.maker.wallet,
            order.partner.wallet,
            order.partner.param,
            order.partner.token
          );
        }

        emit Fill(
            order.maker.wallet, order.maker.param, order.maker.token,
            order.taker.wallet, order.taker.param, order.taker.token,
            order.partner.wallet, order.partner.param, order.partner.token,
            order.expiration,
            order.nonce);
      }

  /**   @dev Cancels orders by marking filled.
    *   @param nonces uint256[]
    */
  function cancel(uint256[] memory nonces) public {
    for (uint256 i = 0; i < nonces.length; i++) {
      if (!fills[msg.sender][nonces[i]]) {
        fills[msg.sender][nonces[i]] = true;
        emit Cancel(msg.sender, nonces[i]);
      }
    }
  }
}
