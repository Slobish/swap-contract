pragma solidity 0.5.7;

/**
 * @title Contract supports handling tracking and modifying delegate approvals
 * @dev contains a private mapping for tracking approvals
 */
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

  /**
   * @dev msg.sender gives permission to a delegate for some period of time
   * to trade on their behalf.
   * @param delegate The address of the delegate.
   * @param expiry timestamp for when the delegate can trade on behalf of the msg.sender.
   */
  function authorize(address delegate, uint256 expiry) external {
    require(expiry > block.timestamp, "INVALID_EXPIRY");
    approvals[msg.sender][delegate] = expiry;
    emit Authorization(msg.sender, delegate, expiry);
  }

  /**
   * @dev msg.sender removes permission from a delegate
   * @param delegate The address of the delegate.
   */
  function revoke(address delegate) external {
    delete approvals[msg.sender][delegate];
    emit Revocation(msg.sender, delegate);
  }

  /**
   * @dev checks whether a delegate is approved for an approver within the authorized
   * valid time window
   * @param approver The address of the approver.
   * @param delegate The address of the delegate.
   * @return true if authorized, or false otherwise
   */
  function isAuthorized(address approver, address delegate) internal view returns (bool) {
    return (approvals[approver][delegate] > block.timestamp);
  }
}
