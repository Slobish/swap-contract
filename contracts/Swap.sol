pragma solidity 0.5.7;
pragma experimental ABIEncoderV2;

import "./lib/Authorizable.sol";
import "./lib/Transferable.sol";
import "./lib/Verifiable.sol";


/**
* @title Swap Protocol
*/
contract Swap is Authorizable, Transferable, Verifiable {

  byte constant private OPEN = 0x00;
  byte constant private COMPLETED = 0x01;
  byte constant private CANCELED = 0x02;

  // Maps makers to orders by ID as completed (0x01) or canceled (0x02).
  mapping (address => mapping (uint256 => byte)) public makerOrderStatus;

  // Event emitted on swap.
  event Swap(
    uint256 indexed id,
    address indexed makerAddress,
    uint256 makerParam,
    address makerToken,
    address takerAddress,
    uint256 takerParam,
    address takerToken,
    address affiliateAddress,
    uint256 affiliateParam,
    address affiliateToken
  );

  // Event emitted on order cancel.
  event Cancel(
    uint256 indexed id,
    address indexed makerAddress
  );

  /**
    * @notice Execute an atomic token purchase for ETH
    * @dev Determines type (ERC-20 or ERC-721) using ERC-165
    *
    * @param sellerWallet address
    * @param sellerParam uint256
    * @param sellerToken address
    * @param totalPrice uint256
    * @param expiry uint256
    * @param id uint256
    * @param v uint8
    * @param r bytes32
    * @param s bytes32
    *
    */
  function purchase(
    address sellerWallet,
    uint256 sellerParam,
    address sellerToken,
    uint256 totalPrice,
    uint256 expiry,
    uint256 id,
    uint8 v,
    bytes32 r,
    bytes32 s
  )
    external payable
  {

    require(expiry > block.timestamp,
      "ORDER_EXPIRED");

    require(makerOrderStatus[sellerWallet][id] == OPEN,
      "ORDER_UNAVAILABLE");

    require(msg.value == totalPrice,
      "AMOUNT_INCORRECT");

    require(isValidLegacy(
      sellerWallet,
      sellerParam,
      sellerToken,
      msg.sender,
      totalPrice,
      address(0),
      expiry,
      id, v, r, s
    ), "SIGNATURE_INVALID");

    makerOrderStatus[sellerWallet][id] = COMPLETED;

    send(sellerWallet, totalPrice);
    transferAny(sellerToken, sellerWallet, msg.sender, sellerParam);

    emit Swap(id, sellerWallet, sellerParam, sellerToken,
      msg.sender, totalPrice, address(0),
      address(0), 0, address(0)
    );

  }

  /**
    * @notice Execute an atomic token swap (V1)
    * @dev Determines type (ERC-20 or ERC-721) using ERC-165
    *
    * @param makerWallet address
    * @param makerParam uint256
    * @param makerToken address
    * @param takerWallet address
    * @param takerParam uint256
    * @param takerToken address
    * @param expiry uint256
    * @param id uint256
    * @param v uint8
    * @param r bytes32
    * @param s bytes32
    *
    */
  function swap(
    address makerWallet,
    uint256 makerParam,
    address makerToken,
    address takerWallet,
    uint256 takerParam,
    address takerToken,
    uint256 expiry,
    uint256 id,
    uint8 v,
    bytes32 r,
    bytes32 s
  )
    external
  {

    require(expiry > block.timestamp,
      "ORDER_EXPIRED");

    require(makerOrderStatus[makerWallet][id] == OPEN,
      "ORDER_UNAVAILABLE");

    require(isValidLegacy(
      makerWallet,
      makerParam,
      makerToken,
      takerWallet,
      takerParam,
      takerToken,
      expiry,
      id, v, r, s
    ), "SIGNATURE_INVALID");

    makerOrderStatus[makerWallet][id] = COMPLETED;

    transferAny(makerToken, makerWallet, takerWallet, makerParam);
    transferAny(takerToken, takerWallet, makerWallet, takerParam);

    emit Swap(id, makerWallet, makerParam, makerToken,
      takerWallet, takerParam, takerToken,
      address(0), 0, address(0)
    );

  }

  /**
    * @notice Execute an atomic token swap (V2)
    * @dev Determines type (ERC-20 or ERC-721) using ERC-165
    *
    * @param order Order
    * @param signature Signature
    */
  function swap(Order calldata order, Signature calldata signature, address signer) external payable {

    require(isAuthorized(order.maker.wallet, signer),
      "SIGNER_UNAUTHORIZED");

    require(isValid(order, signature, signer),
      "SIGNATURE_INVALID");

    // Ensure the order has not been swapped.
    require(makerOrderStatus[order.maker.wallet][order.id] != COMPLETED,
      "ORDER_ALREADY_FILLED");

    // Ensure the order has not been canceled.
    require(makerOrderStatus[order.maker.wallet][order.id] != CANCELED,
      "ORDER_ALREADY_CANCELED");

    // Ensure the order has not expired.
    require(order.expiry > block.timestamp,
      "ORDER_EXPIRED");

    // Check that a specified sender is the actual sender.
    if (msg.sender != order.taker.wallet) {
      require(isAuthorized(order.taker.wallet, msg.sender),
        "SENDER_UNAUTHORIZED");
    }

    // Mark the id as swaped (0x01).
    makerOrderStatus[order.maker.wallet][order.id] = COMPLETED;

    // If the takerToken is null, expect that this is an order for ether.
    if (order.taker.token == address(0)) {

      // The amount of ether sent must match the taker param.
      require(msg.value == order.taker.param,
        "VALUE_MUST_BE_SENT");

      // Send the ether amount to the maker.
      send(order.maker.wallet, msg.value);

      // Transfer the maker side of the trade to the taker.
      transferSafe(
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
      transferSafe(
        "MAKER",
        order.maker.wallet,
        order.affiliate.wallet,
        order.affiliate.param,
        order.affiliate.token
      );
    }

    emit Swap(order.id, order.maker.wallet, order.maker.param, order.maker.token,
      order.taker.wallet, order.taker.param, order.taker.token,
      order.affiliate.wallet, order.affiliate.param, order.affiliate.token
    );
  }

  /**   @notice Cancel a batch of orders.
    *   @dev Canceled orders are marked with byte 0x02.
    *   @param ids uint256[]
    */
  function cancel(uint256[] memory ids) public {
    for (uint256 i = 0; i < ids.length; i++) {
      if (makerOrderStatus[msg.sender][ids[i]] == OPEN) {
        makerOrderStatus[msg.sender][ids[i]] = CANCELED;
        emit Cancel(ids[i], msg.sender);
      }
    }
  }

}
