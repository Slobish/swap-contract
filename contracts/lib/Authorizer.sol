pragma solidity 0.5.0;


contract Authorizer {

  // Mapping of peer address to delegate address and expiration.
  mapping (address => mapping (address => uint256)) private approvals;

  event Authorization(
    address indexed approverAddress,
    address delegateAddress,
    uint256 expiration
  );

  event Revocation(
    address indexed approverAddress,
    address delegateAddress
  );

  function authorize(address delegate, uint256 expiration) external returns (bool) {
    require(delegate != address(0));

    approvals[msg.sender][delegate] = expiration;
    emit Authorization(msg.sender, delegate, expiration);
    return true;
  }

  function revoke(address delegate) external returns (bool) {
    require(delegate != address(0));

    delete approvals[msg.sender][delegate];
    emit Revocation(msg.sender, delegate);
    return true;
  }

  function isAuthorized(address approver, address delegate) internal view returns (bool) {
    if (approver == delegate) {
      return true;
    }
    if (approvals[approver][delegate] > block.timestamp) {
      return true;
    }
    return false;
  }
}
