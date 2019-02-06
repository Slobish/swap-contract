pragma solidity 0.5.0;


contract Interfaces {
  bytes4 private constant ERC165ID = 0x01ffc9a7;

  function doesContractImplementInterface(address _contract, bytes4 _interfaceId) internal view returns (bool) {
    uint256 success;
    uint256 result;

    (success, result) = noThrowCall(_contract, _interfaceId);
    if ((success == 1)&&(result == 1)) {
      return true;
    }
    return false;
  }

  function noThrowCall(address _contract, bytes4 _interfaceId)
      internal view returns (uint256 success, uint256 result) {
        bytes4 erc165ID = ERC165ID;

        assembly {
            let x := mload(0x40)
            mstore(x, erc165ID)
            mstore(add(x, 0x04), _interfaceId)

            success := staticcall(
                                30000,
                                _contract,
                                x,
                                0x24,
                                x,
                                0x20)

            result := mload(x)
        }
      }
}
