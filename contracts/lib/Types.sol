pragma solidity 0.5.0;
pragma experimental ABIEncoderV2;


contract Types {

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
    bool prefixed;
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

}
