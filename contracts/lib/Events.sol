pragma solidity 0.5.0;


contract Events {
  event Fill(
    address indexed makerAddress,
    uint256 makerParam,
    address makerToken,
    address takerAddress,
    uint256 takerParam,
    address takerToken,
    address partnerAddress,
    uint256 partnerParam,
    address partnerToken,
    uint256 expiration,
    uint256 indexed nonce
  );

  event Cancel(
    address indexed makerAddress,
    uint256 nonce
  );
}
