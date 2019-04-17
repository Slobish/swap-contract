pragma solidity 0.5.7;
pragma experimental ABIEncoderV2;

/**
 * @title Provides struct definitions and validation checks
 * on submitted signed Orders and Signatures for
 * ERC20 and ERC721 transfers of tokens and swapping them atomically
 * @dev supports EIP191 and EIP712 for validating signed data
 */
contract Verifiable {

  bytes constant internal EIP191_HEADER = "\x19\x01";
  bytes constant internal DOMAIN_NAME = "AIRSWAP";
  bytes constant internal DOMAIN_VERSION = "2";

  bytes32 private domainSeparator;

  struct Party {
    address wallet;
    address token;
    uint256 param;
  }

  struct Order {
    uint256 expiry;
    uint256 nonce;
    address signer;
    Party maker;
    Party taker;
    Party affiliate;
  }

  struct Signature {
    uint8 v;
    bytes32 r;
    bytes32 s;
    bytes1 version;
  }

  bytes32 internal constant DOMAIN_TYPEHASH = keccak256(abi.encodePacked(
      "EIP712Domain(",
      "string name,",
      "string version,",
      "address verifyingContract",
      ")"
  ));

  bytes32 internal constant ORDER_TYPEHASH = keccak256(abi.encodePacked(
      "Order(",
      "uint256 expiry,",
      "uint256 nonce,",
      "address signer,",
      "Party maker,",
      "Party taker,",
      "Party affiliate",
      ")",
      "Party(",
      "address wallet,",
      "address token,",
      "uint256 param",
      ")"
  ));

  bytes32 internal constant PARTY_TYPEHASH = keccak256(abi.encodePacked(
      "Party(",
      "address wallet,",
      "address token,",
      "uint256 param",
      ")"
  ));


  constructor() public {
    domainSeparator = keccak256(abi.encode(
        DOMAIN_TYPEHASH,
        keccak256(DOMAIN_NAME),
        keccak256(DOMAIN_VERSION),
        this
    ));
  }

  /**
   * @dev Helper function to keccak256 hash a Party struct element
   * @param party Party element to hash.
   * @return the keccak256 encoded Party element in bytes32
   */
  function hashParty(Party memory party) public pure returns (bytes32) {
    return keccak256(abi.encode(
        PARTY_TYPEHASH,
        party.wallet,
        party.token,
        party.param
    ));
  }

  /**
   * @dev Helper function to keccak256 hash a Order struct element
   * @param order Order element to hash.
   * @return the keccak256 encoded Order element in bytes32
   */
  function hashOrder(Order memory order) public view returns (bytes32) {
    return keccak256(abi.encodePacked(
        EIP191_HEADER,
        domainSeparator,
        keccak256(abi.encode(
            ORDER_TYPEHASH,
            order.expiry,
            order.nonce,
            order.signer,
            hashParty(order.maker),
            hashParty(order.taker),
            hashParty(order.affiliate)
        ))
    ));
  }

  /**
   * @dev Helper function to determine that order was signed
   * in Signature by the signer using either ERC191 or ERC712 signing scheme
   * @param order Order element to hash.
   * @return true if from correct signer
   */
  function isValid(Order memory order, address signer, Signature memory signature) public view returns (bool) {
    if (signature.version == byte(0x01)) {
      return signer == ecrecover(
          hashOrder(order),
          signature.v, signature.r, signature.s
      );
    }
    if (signature.version == byte(0x45)) {
      return signer == ecrecover(
          keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hashOrder(order))),
          signature.v, signature.r, signature.s
      );
    }
    return false;
  }

  /**
   * @dev Helper function to determine that order was signed
   * in Signature by the signer using ERC191 signing signing scheme
   * @param makerAddress address creator of the signed order to trade with a counterparty.
   * @param makerAmount uint256 defines ERC20 token amount for maker.
   * @param makerToken address defines the token address for either an ERC20 contract for maker.
   * @param takerAddress address submitter of the signed order and counterparty of the trade.
   * @param takerAmount uint256 defines ERC20 token amount for taker.
   * @param takerToken address defines the token address for either an ERC20 contract for taker.
   * @param expiration specifies uint256 timestamp that order is valid until.
   * @param nonce unique identifier unique and specified by the makerAddress.
   * @param v uint8 either 27 or 28.
   * @param r bytes32 part of the elliptic curve signature.
   * @param s bytes32 part of the elliptic curve signature.
   * @return true if makerAddress is the signer
   */
  function isValidLegacy(
    address makerAddress,
    uint makerAmount,
    address makerToken,
    address takerAddress,
    uint takerAmount,
    address takerToken,
    uint256 expiration,
    uint256 nonce,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) public view returns (bool) {

    return makerAddress == ecrecover(
      keccak256(abi.encodePacked(
        "\x19Ethereum Signed Message:\n32",
        keccak256(abi.encodePacked(
          byte(0),
          this,
          makerAddress,
          makerAmount,
          makerToken,
          takerAddress,
          takerAmount,
          takerToken,
          expiration,
          nonce
        )))),
      v, r, s);
  }
}
