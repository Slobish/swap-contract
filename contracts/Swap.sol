pragma solidity >=0.5.8;
pragma experimental ABIEncoderV2;

import "./lib/Authorizable.sol";
import "./lib/Transferable.sol";
import "./lib/Verifiable.sol";

/**
* @title Atomic swap contract used by the Swap Protocol
*/
contract Swap is Authorizable, Transferable, Verifiable {

  // Status that an order may hold
  enum ORDER_STATUS { OPEN, TAKEN, CANCELED }

  // Maps makers to orders by nonce as TAKEN (0x01) or CANCELED (0x02)
  mapping (address => mapping (uint256 => ORDER_STATUS)) public makerOrderStatus;

  // Maps makers to an optionally set minimum valid nonce
  mapping (address => uint256) public makerMinimumNonce;

  // Emitted on Swap
  event Swap(
    uint256 indexed nonce,
    uint256 timestamp,
    address indexed makerWallet,
    uint256 makerParam,
    address makerToken,
    address indexed takerWallet,
    uint256 takerParam,
    address takerToken,
    address affiliateWallet,
    uint256 affiliateParam,
    address affiliateToken
  );

  // Emitted on Cancel
  event Cancel(
    uint256 indexed nonce,
    address indexed makerWallet
  );

  // Emitted on SetMinimumNonce
  event SetMinimumNonce(
    uint256 indexed nonce,
    address indexed makerWallet
  );

  /**
    * @notice Atomic Token Swap
    * @dev Determines type (ERC-20 or ERC-721) with ERC-165
    *
    * @param order Order
    * @param signature Signature
    */
  function swap(
    Order calldata order,
    Signature calldata signature
  )
    external payable
  {

    // Ensure the order is not expired
    require(order.expiry > block.timestamp,
      "ORDER_EXPIRED");

    // Ensure the order has not already been taken
    require(makerOrderStatus[order.maker.wallet][order.nonce] != ORDER_STATUS.TAKEN,
      "ORDER_ALREADY_TAKEN");

    // Ensure the order has not already been canceled
    require(makerOrderStatus[order.maker.wallet][order.nonce] != ORDER_STATUS.CANCELED,
      "ORDER_ALREADY_CANCELED");

    require(order.nonce >= makerMinimumNonce[order.maker.wallet],
      "NONCE_TOO_LOW");

    // Ensure the order taker is set and authorized
    address finalTakerWallet;

    if (order.taker.wallet == address(0)) {

      // Set a null taker to be the order sender
      finalTakerWallet = msg.sender;

    } else {

      // Ensure the order sender is authorized
      if (msg.sender != order.taker.wallet) {
        require(isAuthorized(order.taker.wallet, msg.sender),
          "SENDER_UNAUTHORIZED");
      }

      // Set the taker to be the specified taker
      finalTakerWallet = order.taker.wallet;

    }

    // Ensure the order signer is authorized
    require(isAuthorized(order.maker.wallet, signature.signer),
      "SIGNER_UNAUTHORIZED");

    // Ensure the order signature is valid
    require(isValid(order, signature),
      "SIGNATURE_INVALID");

    // Mark the order TAKEN (0x01)
    makerOrderStatus[order.maker.wallet][order.nonce] = ORDER_STATUS.TAKEN;

    // A null taker token is an order for ether
    if (order.taker.token == address(0)) {

      // Ensure the ether sent matches the taker param
      require(msg.value == order.taker.param,
        "VALUE_MUST_BE_SENT");

      // Transfer ether from taker to maker
      send(order.maker.wallet, msg.value);

    } else {

      // Ensure the value sent is zero
      require(msg.value == 0,
        "VALUE_MUST_BE_ZERO");

      // Transfer token from taker to maker
      safeTransferAny(
        "TAKER",
        finalTakerWallet,
        order.maker.wallet,
        order.taker.param,
        order.taker.token
      );

    }

    // Transfer token from maker to taker
    safeTransferAny(
      "MAKER",
      order.maker.wallet,
      finalTakerWallet,
      order.maker.param,
      order.maker.token
    );

    // Transfer token from maker to affiliate if specified
    if (order.affiliate.wallet != address(0)) {
      safeTransferAny(
        "MAKER",
        order.maker.wallet,
        order.affiliate.wallet,
        order.affiliate.param,
        order.affiliate.token
      );
    }

    emit Swap(order.nonce, block.timestamp,
      order.maker.wallet, order.maker.param, order.maker.token,
      finalTakerWallet, order.taker.param, order.taker.token,
      order.affiliate.wallet, order.affiliate.param, order.affiliate.token
    );
  }

  /**
    * @notice Atomic Token Swap (Simple)
    * @dev Determines type (ERC-20 or ERC-721) with ERC-165
    *
    * @param nonce uint256
    * @param expiry uint256
    * @param makerWallet address
    * @param makerParam uint256
    * @param makerToken address
    * @param takerWallet address
    * @param takerParam uint256
    * @param takerToken address
    * @param v uint8
    * @param r bytes32
    * @param s bytes32
    */
  function swapSimple(
    uint256 nonce,
    uint256 expiry,
    address makerWallet,
    uint256 makerParam,
    address makerToken,
    address takerWallet,
    uint256 takerParam,
    address takerToken,
    uint8 v,
    bytes32 r,
    bytes32 s
  )
      external payable
  {

    // Ensure the order is not expired
    require(expiry > block.timestamp,
      "ORDER_EXPIRED");

    // Ensure the order has not already been taken or canceled
    require(makerOrderStatus[makerWallet][nonce] == ORDER_STATUS.OPEN,
      "ORDER_UNAVAILABLE");

    require(nonce >= makerMinimumNonce[makerWallet],
      "NONCE_TOO_LOW");

    // Ensure the order taker is set and authorized
    address finalTakerWallet;

    if (takerWallet == address(0)) {

      // Set a null taker to be the order sender
      finalTakerWallet = msg.sender;

    } else {

      // Ensure the order sender is authorized
      if (msg.sender != takerWallet) {
        require(isAuthorized(takerWallet, msg.sender),
          "SENDER_UNAUTHORIZED");
      }

      finalTakerWallet = takerWallet;

    }

    // Ensure the order signature is valid
    require(isValidSimple(
      nonce,
      expiry,
      makerWallet,
      makerParam,
      makerToken,
      takerWallet,
      takerParam,
      takerToken,
      v, r, s
    ), "SIGNATURE_INVALID");

    // Mark the order TAKEN (0x01)
    makerOrderStatus[makerWallet][nonce] = ORDER_STATUS.TAKEN;

    // A null taker token is an order for ether
    if (takerToken == address(0)) {

      // Ensure the ether sent matches the taker param
      require(msg.value == takerParam,
        "VALUE_MUST_BE_SENT");

      // Transfer ether from taker to maker
      send(makerWallet, msg.value);

    } else {

      // Ensure the value sent is zero
      require(msg.value == 0,
        "VALUE_MUST_BE_ZERO");

      // Transfer token from taker to maker
      transferAny(takerToken, finalTakerWallet, makerWallet, takerParam);

    }

    // Transfer token from maker to taker
    transferAny(makerToken, makerWallet, finalTakerWallet, makerParam);

    emit Swap(nonce, block.timestamp,
      makerWallet, makerParam, makerToken,
      finalTakerWallet, takerParam, takerToken,
      address(0), 0, address(0)
    );

  }

  /** @notice Cancel a batch of orders for a maker
    * @dev Canceled orders are marked CANCELED (0x02)
    * @param nonces uint256[]
    */
  function cancel(uint256[] calldata nonces) external {
    for (uint256 i = 0; i < nonces.length; i++) {
      if (makerOrderStatus[msg.sender][nonces[i]] == ORDER_STATUS.OPEN) {
        makerOrderStatus[msg.sender][nonces[i]] = ORDER_STATUS.CANCELED;
        emit Cancel(nonces[i], msg.sender);
      }
    }
  }

  /** @notice Set a minimum valid nonce for a maker
    * @dev Order nonces below the value will be rejected
    * @param minimumNonce uint256
    */
  function setMinimumNonce(uint256 minimumNonce) external {
    makerMinimumNonce[msg.sender] = minimumNonce;
    emit SetMinimumNonce(minimumNonce, msg.sender);
  }

}
