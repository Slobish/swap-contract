pragma solidity 0.5.0;
pragma experimental ABIEncoderV2;

import "./lib/Authorizable.sol";
import "./lib/Transferable.sol";
import "./lib/Verifiable.sol";


/**
* @title Swap Protocol
*/
contract Swap is Authorizable, Transferable, Verifiable {

  // Maps maker to map of nonces marking fills (0x01) and cancels (0x02).
  mapping (address => mapping (uint256 => byte)) public fills;

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
    * @dev Swap Protocol V2
    *
    * @param order Order
    * @param signature Signature
    */
  function fill(Order memory order, Signature memory signature) public payable {

    // Check that the V2 signature is valid.
    if (order.signer != address(0)) {
      require(isAuthorized(order.maker.wallet, order.signer),
        "SIGNER_NOT_AUTHORIZED");

      require(isValid(order, order.signer, signature),
        "INVALID_DELEGATE_SIGNATURE");
    } else {
      require(isValid(order, order.maker.wallet, signature),
        "INVALID_MAKER_SIGNATURE");
    }

    // Execute the order.
    execute(order);

  }

  /**
    * @dev Swap Protocol V1
    *
    * @param makerAddress address
    * @param makerAmount uint256
    * @param makerToken address
    * @param takerAddress address
    * @param takerAmount uint256
    * @param takerToken address
    * @param expiration uint256
    * @param nonce uint256
    * @param v uint8
    * @param r bytes32
    * @param s bytes32
    *
    */
  function fill(
      address makerAddress,
      uint256 makerAmount,
      address makerToken,
      address takerAddress,
      uint256 takerAmount,
      address takerToken,
      uint256 expiration,
      uint256 nonce,
      uint8 v,
      bytes32 r,
      bytes32 s
  )
    public payable
  {

    // Check that the V1 signature is valid.
    require(isValidLegacy(makerAddress, makerAmount, makerToken,
      takerAddress, takerAmount, takerToken, expiration, nonce, v, r, s),
      "INVALID_LEGACY_SIGNATURE");

    // Execute the order.
    execute(
      Order(expiration, nonce, address(0),
        Party(makerAddress, makerToken, makerAmount),
        Party(takerAddress, takerToken, takerAmount),
        Party(address(0), address(0), 0)
    ));

  }

  /**   @dev Cancels orders by marking filled.
    *   @param nonces uint256[]
    */
  function cancel(uint256[] memory nonces) public {
    for (uint256 i = 0; i < nonces.length; i++) {
      if (fills[msg.sender][nonces[i]] == 0x00) {
        fills[msg.sender][nonces[i]] = 0x02;
        emit Cancel(msg.sender, nonces[i]);
      }
    }
  }

  /**
    * @dev Execute and settle an order.
    * @param order Order
    */
  function execute(Order memory order) internal {
    // Ensure the order has not been filled.
    require(fills[order.maker.wallet][order.nonce] != 0x01,
      "ORDER_ALREADY_FILLED");

    // Ensure the order has not been canceled.
    require(fills[order.maker.wallet][order.nonce] != 0x02,
      "ORDER_ALREADY_CANCELED");

    // Ensure the order has not expired.
    require(order.expiry > block.timestamp,
      "ORDER_EXPIRED");

    // Check that a specified sender is the actual sender.
    if (msg.sender != order.taker.wallet) {
      require(isAuthorized(order.taker.wallet, msg.sender),
        "SENDER_NOT_AUTHORIZED");
    }

    // Mark the order filled.
    fills[order.maker.wallet][order.nonce] = 0x01;

    // If the takerToken is null, expect that this is an order for ether.
    if (order.taker.token == address(0)) {

      // The amount of ether sent must match the taker param.
      require(msg.value == order.taker.param,
        "VALUE_MUST_BE_SENT");

      // Send the ether amount to the maker.
      send(order.maker.wallet, msg.value);

      // Transfer the maker side of the trade to the taker.
      transfer(
        "MAKER",
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
        "MAKER",
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

}
