pragma solidity 0.5.7;
pragma experimental ABIEncoderV2;


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
    uint256 id;
    uint256 expiry;
    Party maker;
    Party taker;
    Party affiliate;
    address signer;
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
      "uint256 id,",
      "uint256 expiry,",
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

  function hashParty(Party memory party) internal pure returns (bytes32) {
    return keccak256(abi.encode(
        PARTY_TYPEHASH,
        party.wallet,
        party.token,
        party.param
    ));
  }

  function hashOrder(Order memory order) internal view returns (bytes32) {
    return keccak256(abi.encodePacked(
        EIP191_HEADER,
        domainSeparator,
        keccak256(abi.encode(
            ORDER_TYPEHASH,
            order.id,
            order.expiry,
            hashParty(order.maker),
            hashParty(order.taker),
            hashParty(order.affiliate)
        ))
    ));
  }

  function isValid(Order memory order, Signature memory signature, address signer) internal view returns (bool) {
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

  function isValidLegacy(
    address makerWallet, uint256 makerParam, address makerToken,
    address takerWallet, uint256 takerParam, address takerToken,
    uint256 expiry, uint256 id, uint8 v, bytes32 r, bytes32 s
    ) internal view returns (bool) {
      return makerWallet == ecrecover(
        keccak256(abi.encodePacked(
          "\x19Ethereum Signed Message:\n32",
          keccak256(abi.encodePacked(
            byte(0),
            this,
            makerWallet,
            makerParam,
            makerToken,
            takerWallet,
            takerParam,
            takerToken,
            expiry,
            id
          )))),
        v, r, s);
  }

}
