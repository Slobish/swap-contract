pragma solidity 0.5.0;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC721/IERC721.sol";


contract Transferable {

  bytes4 internal constant INTERFACE_ERC165 = 0x01ffc9a7;
  bytes4 internal constant INTERFACE_ERC721 = 0x80ac58cd;

  function swap(
      address makerAddress,
      uint256 makerParam,
      address makerToken,
      address takerAddress,
      uint256 takerParam,
      address takerToken
  ) public {
    transfer("MAKER", makerAddress, takerAddress, makerParam, makerToken);
    transfer("TAKER", takerAddress, makerAddress, takerParam, takerToken);
  }

  function send(
      address receiver,
      uint256 value
  ) internal {
    // Cast the order maker as a payable address for ether transfer.
    address payable wallet = address(uint160(receiver));

    // Transfer the taker side of the trade (ether) to the makerWallet.
    wallet.transfer(value);
  }

  function transfer(
    bytes memory side,
    address from,
    address to,
    uint256 param,
    address token
  ) internal {
    if (doesContractImplementInterface(token, INTERFACE_ERC721)) {
      IERC721(token).safeTransferFrom(from, to, param);
    } else {
      require(IERC20(token).allowance(from, address(this)) >= param,
        string(abi.encodePacked(side, "_INSUFFICIENT_ALLOWANCE")));
      require(IERC20(token).balanceOf(from) >= param,
        string(abi.encodePacked(side, "_INSUFFICIENT_BALANCE")));
      IERC20(token).transferFrom(from, to, param);
    }
  }

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
        bytes4 erc165ID = INTERFACE_ERC165;

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
