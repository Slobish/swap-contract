pragma solidity 0.5.0;


contract Authorizable {

  // Mapping of account to delegate to token to expiry.
  mapping (address => mapping (address => mapping (address => uint256))) private approvals;

  event Authorization(
    address indexed approverAddress,
    address indexed delegateAddress,
    uint256 expiry
  );

  event Revocation(
    address indexed approverAddress,
    address indexed delegateAddress
  );

  function authorize(address delegate, address token, uint256 expiry) external returns (bool) {
    require(expiry > block.timestamp, "INVALID_EXPIRY");
    approvals[msg.sender][delegate][token] = expiry;
    emit Authorization(msg.sender, delegate, expiry);
    return true;
  }

  function revoke(address delegate, address token) external returns (bool) {
    delete approvals[msg.sender][delegate][token];
    emit Revocation(msg.sender, delegate);
    return true;
  }

  function isAuthorized(address approver, address delegate, address token) internal view returns (bool) {
    return (approvals[approver][delegate][token] > block.timestamp);
  }
}
