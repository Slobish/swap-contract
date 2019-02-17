pragma solidity 0.5.0;
pragma experimental ABIEncoderV2;

import "./lib/Authorizable.sol";
import "./lib/Transferable.sol";
import "./lib/Verifiable.sol";


/**
* @title Swap Protocol
*/
contract Swap is Authorizable, Transferable, Verifiable {

  // Mapping of maker address to mapping of nonces to mark fills.
  mapping (address => mapping (uint256 => bool)) public fills;

  // Event emitted on order fill.
  event Fill(
    address indexed makerAddress,
    uint256 makerParam,
    address makerToken,
    address takerAddress,
    uint256 takerParam,
    address takerToken,
    address affiliateAddress,
    uint256 affiliateParam,
    address affiliateToken,
    uint256 indexed nonce,
    uint256 expiry,
    address signer
  );

  // Event emitted on order cancel.
  event Cancel(
    address indexed makerAddress,
    uint256 nonce
  );

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
        require(order.expiry > block.timestamp,
            "ORDER_EXPIRED");

        // Check that a specified sender is the actual sender.
        if (msg.sender != order.taker.wallet) {
          require(isAuthorized(order.taker.wallet, msg.sender),
            "SENDER_NOT_AUTHORIZED");
        }

        // Check that the order has a valid signature.
        if (order.signer != address(0)) {
          require(isAuthorized(order.maker.wallet, order.signer),
            "SIGNER_NOT_AUTHORIZED");

          require(isValid(order, order.signer, signature),
            "INVALID_DELEGATE_SIGNATURE");
        } else {
          require(isValid(order, order.maker.wallet, signature),
            "INVALID_MAKER_SIGNATURE");
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

        // Transfer a specified fee to an affiliate.
        if (order.affiliate.wallet != address(0)) {
          transfer(
            order.maker.wallet,
            order.affiliate.wallet,
            order.affiliate.param,
            order.affiliate.token
          );
        }

        emit Fill(
            order.maker.wallet, order.maker.param, order.maker.token,
            order.taker.wallet, order.taker.param, order.taker.token,
            order.affiliate.wallet, order.affiliate.param, order.affiliate.token,
            order.nonce, order.expiry, order.signer );
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
