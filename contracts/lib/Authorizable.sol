pragma solidity 0.5.7;


contract Authorizable {

  // Mapping of peer address to delegate address and expiry.
  mapping (address => mapping (address => uint256)) private approvals;

  event Authorization(
    address indexed approverAddress,
    address indexed delegateAddress,
    uint256 expiry
  );

  event Revocation(
    address indexed approverAddress,
    address indexed delegateAddress
  );

  function authorize(address delegate, uint256 expiry) external returns (bool) {
    require(expiry > block.timestamp, "INVALID_EXPIRY");
    approvals[msg.sender][delegate] = expiry;
    emit Authorization(msg.sender, delegate, expiry);
    return true;
  }

  function revoke(address delegate) external returns (bool) {
    delete approvals[msg.sender][delegate];
    emit Revocation(msg.sender, delegate);
    return true;
  }

  function isAuthorized(address approver, address delegate) internal view returns (bool) {
    return (approvals[approver][delegate] > block.timestamp);
  }
}
