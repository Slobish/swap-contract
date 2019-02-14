pragma solidity 0.5.0;
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
    uint256 expiry;
    uint256 nonce;
    address signer;
    Party maker;
    Party taker;
    Party partner;
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
      "Party partner",
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

  function hashParty(Party memory party) public pure returns (bytes32) {
    return keccak256(abi.encode(
        PARTY_TYPEHASH,
        party.wallet,
        party.token,
        party.param
    ));
  }

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
            hashParty(order.partner)
        ))
    ));
  }

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
    revert("INVALID_SIGNATURE_VERSION");
  }
}
