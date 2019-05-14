# Swap Protocol
The [Swap Protocol](https://swap.tech/whitepaper/) is a peer-to-peer protocol for trading Ethereum tokens.

## Quick Start

```bash
$ git clone git:github.com/airswap/swap-protocol.git
$ cd swap-protocol
$ yarn
$ yarn coverage
```

## Highlights

### Atomic Swap
Transact directly peer-to-peer on Ethereum.

### Fungible and Non-Fungible
Swap between any two ERC20 or ERC721 assets.

### Typed Data Signatures
Sign informative messages for improved transparency.

### Delegate Authorization
Authorize peers to act on behalf of others.

### Affiliate Fees
Compensate those who connect peers that trade.

### Batch Cancels
Cancel multiple orders in a single transaction.

## Table of Contents

* [Definitions](#definitions)
* [Swap](#swap)
  * [Arguments](#arguments)
  * [Order](#order)
  * [Party](#party)
  * [Signature](#signature)
  * [Reverts](#reverts)
* [Swap (Light)](#swap-light)
  * [Arguments](#arguments-1)
  * [Reverts](#reverts-1)
* [Purchase](#purchase)
  * [Arguments](#arguments-2)
  * [Reverts](#reverts-2)
* [Cancel](#cancel)
* [Authorizations](#authorize)
  * [Authorize](#authorize)
  * [Revoke](#revoke)
* [Signatures](#signatures)
  * [Simple](#simple)
  * [Typed Data](#typed-data)
* [Sources](#sources)
* [Tooling](#tooling)

## Definitions

| Term | Definition |
| :--- | :--- |
| Swap | A transaction of multiple Token transfers that succeeds for all parties or fails. |
| Token | A fungible (ERC-20) or non-fungible (ERC-721) Ethereum asset to be transferred. |
| Maker | A party that sets and signs the parameters and price of an Order. |
| Taker | A party that accepts the parameters of an Order and settles it on Ethereum. |
| Affiliate | An *optional* party compensated by the Maker for facilitating a Swap. |
| Delegate | An *optional* party authorized to make or take orders on behalf of another party. |
| Order | A specification of the tokens, amounts, and parties to a Swap. |
| ID | A parameter of every Order that is unique to its Maker. |

## Swap
Swap between tokens (ERC-20 or ERC-721) or ETH with all features using typed data signatures.

```Solidity
function swap(
  Order calldata order,
  Signature calldata signature
) external payable
```

### Arguments

| Name | Type | Optionality | Description |
| :--- | :--- | :--- | :--- |
| `order` | `Order` | Required | A unique identifier for the order. |
| `signature` | `Signature` | Required | The expiry in seconds since unix epoch. |

### Order
```Solidity
struct Order {
  uint256 id;
  uint256 expiry;
  Party maker;
  Party taker;
  Party affiliate;
}
```

| Property | Type | Optionality | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uint256` | Required | A unique identifier for the order. |
| `expiry` | `uint256` | Required | The expiry in seconds since unix epoch. |
| `maker` | `Party` | Required | The maker of the order who sets price. |
| `taker` | `Party` | Required | The taker of the order who accepts price. |
| `affiliate` | `Party` | Optional | An affiliate to be paid by the maker. |

### Party
```Solidity
struct Party {
  address wallet;
  address token;
  uint256 param;
}
```

| Property | Type | Optionality | Description |
| :--- | :--- | :--- | :--- |
| `wallet` | `address` | Required | The wallet address of a party. |
| `token` | `address` | Required | The address of the token the party will send or receive. |
| `param` | `uint256` | Required | Either an amount of ERC-20 or identifier of an ERC-721. |


### Signature

```Solidity
struct Signature {
  uint8 v;
  bytes32 r;
  bytes32 s;
  bytes1 version;
}
```

| Property | Type | Optionality | Description |
| :--- | :--- | :--- | :--- |
| `v` | `address` | Required | The wallet address of a party. |
| `r` | `address` | Required | The address of the token the party will send or receive. |
| `s` | `uint256` | Required | Either an amount of ERC-20 or identifier of an ERC-721. |
| `version` | `uint256` | Required | Either an amount of ERC-20 or identifier of an ERC-721. |

### Reverts

| Reason | Scenario |
| :--- | :--- |
| `SIGNER_UNAUTHORIZED` | Order has been signed by an account that has not been authorized to sign it. |
| `SIGNATURE_INVALID` | Signature provided does not match the Order and signer provided. |
| `ORDER_ALREADY_TAKEN` | Order has already been taken by its `id` value. |
| `ORDER_ALREADY_CANCELED` | Order has already been canceled by its `id` value. |
| `ORDER_EXPIRED` | Order has an `expiry` lower than the current block time. |
| `SENDER_UNAUTHORIZED` | Order has been sent by an account that has not been authorized to send it. |
| `VALUE_MUST_BE_SENT` | Order indicates an ether (ETH) Swap, but insufficient ether was sent. |
| `VALUE_MUST_BE_ZERO` | Order indicates a token Swap, but ether (ETH) was sent along with the transaction. |
| `INSUFFICIENT_ALLOWANCE` | Transfer was attempted but the sender has not approved the Swap contract to move the balance. |
| `INSUFFICIENT_BALANCE` | Transfer was attempted but the sender has an insufficient balance. |
| `INVALID_AUTH_DELEGATE` | Delegate address is the same as the transaction sender address. |
| `INVALID_AUTH_EXPIRY` | Delegate authorization was attempted but the expiry time has already passed. |

## Swap (Light)
Lightweight swap between tokens (ERC-20 or ERC-721) using simple signatures.

```Solidity
function swap(
  uint256 id,
  address makerWallet,
  uint256 makerParam,
  address makerToken,
  address takerWallet,
  uint256 takerParam,
  address takerToken,
  uint256 expiry,
  bytes32 r,
  bytes32 s,
  uint8 v
) external
```

### Arguments

| Name | Type | Optionality | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uint256` | Required | A unique identifier for the order. |
| `expiry` | `uint256` | Required | The expiry in seconds since unix epoch. |
| `makerWallet` | `address` | Required | A unique identifier for the order. |
| `makerParam` | `uint256` | Required | The expiry in seconds since unix epoch. |
| `makerToken` | `address` | Required | A unique identifier for the order. |
| `totalCost` | `uint256` | Required | A unique identifier for the order. |
| `expiry` | `uint256` | Required | The expiry in seconds since unix epoch. |
| `r` | `bytes32` | Required | A unique identifier for the order. |
| `s` | `bytes32` | Required | A unique identifier for the order. |
| `v` | `uint8` | Required | The expiry in seconds since unix epoch. |

### Reverts

| Reason | Scenario |
| :--- | :--- |
| `ORDER_EXPIRED` | Order has an `expiry` lower than the current block time. |
| `ORDER_UNAVAILABLE` | Order has already been taken by its `id` value. |
| `SIGNATURE_INVALID` | Order has been signed by the maker but the signature is incorrect. |

## Purchase
Lightweight purchase of a token for ether using simple signatures.

* Transaction `sender` must be same as `takerAddress` in the signature.
* Transaction `value` must be same as `takerParam` in the signature.

```Solidity
function purchase(
  uint256 id,
  address makerWallet,
  uint256 makerParam,
  address makerToken,
  uint256 totalCost,
  uint256 expiry,
  bytes32 r,
  bytes32 s,
  uint8 v
) external payable
```

### Arguments

| Name | Type | Optionality | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uint256` | Required | A unique identifier for the order. |
| `expiry` | `uint256` | Required | The expiry in seconds since unix epoch. |
| `makerWallet` | `Party` | Required | The maker of the order who sets price. |
| `makerParam` | `uint256` | Required | The expiry in seconds since unix epoch. |
| `makerToken` | `address` | Required | A unique identifier for the order. |
| `totalCost` | `uint256` | Required | A unique identifier for the order. |
| `expiry` | `uint256` | Required | The expiry in seconds since unix epoch. |
| `r` | `bytes32` | Required | A unique identifier for the order. |
| `s` | `bytes32` | Required | A unique identifier for the order. |
| `v` | `uint8` | Required | The expiry in seconds since unix epoch. |

### Reverts

| Reason | Scenario |
| :--- | :--- |
| `ORDER_EXPIRED` | Order has an `expiry` lower than the current block time. |
| `ORDER_UNAVAILABLE` | Order has already been taken by its `id` value. |
| `SIGNATURE_INVALID` | Order has been signed by the maker but the signature is incorrect. |
| `VALUE_INCORRECT` | Value of the transaction (ether) does not match the cost of the purchase. |

## Cancels
Provide an array of `ids`, unique by maker address, to mark one or more orders as canceled.
```Solidity
function cancel(uint256[] memory ids) public
```

## Authorizations
Peers may authorize other peers to make (sign) or take (send) orders on their behalf. This is useful for delegating authorization to a trusted third party, whether a user account or smart contract. An authorization works for both sides of a Swap, regardless of whether the delegate signing or sending on ones behalf.

### Authorize
Authorize a delegate account or contract to make or take orders on the sender's behalf. **Not** available for **Swap (Light)** or **Purchase**.
```Solidity
function authorize(address delegate, uint256 expiry) external returns (bool)
```

### Revoke
Revoke the authorization of a delegate account or contract. **Not** available for **Swap (Light)** or **Purchase**.
```Solidity
function revoke(address delegate) external returns (bool)
```

## Signatures
When producing [ECDSA](https://hackernoon.com/a-closer-look-at-ethereum-signatures-5784c14abecc) signatures, Ethereum wallets prefix signed data with byte `\x19` to stay out of range of valid RLP so that a signature cannot be executed as a transaction. [EIP-191](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-191.md) standardizes this prefixing to include existing `personal_sign` behavior and [EIP-712](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md) implements it for structured data, which makes the data more transparent for the signer. Signatures are comprised of parameters `v`, `r`, and `s`. Read more about [Ethereum Signatures]().

### Simple
For use in **Swap Light** and **Purchase**. Signature parameters are passed directly to the function. Utilizes a simpler and cheaper hashing function.

```JavaScript
const msg = web3.utils.soliditySha3(
  // Version 0x00: Data with intended validator (verifyingContract)
  { type: 'bytes1', value: '0x0' },
  { type: 'address', value: verifyingContract },
  { type: 'uint256', value: orderId },
  { type: 'address', value: makerWallet },
  { type: 'uint256', value: makerParam },
  { type: 'address', value: makerToken },
  { type: 'address', value: takerWallet },
  { type: 'uint256', value: takerParam },
  { type: 'address', value: takerToken },
  { type: 'uint256', value: expiry },
);
const orderHashHex = ethUtil.bufferToHex(msg);
const sig = await web3.eth.sign(orderHashHex, signer);
const { v, r, s } = ethUtil.fromRpcSig(sig);
```

### Typed Data
The `Signature` struct is passed to the function including a byte `version` to indicate `personal_sign` (`0x45`) or `signTypedData` (`0x01`) so that hashes can be recreated correctly in contract code.

#### Personal Sign
You can use `personal_sign` with **Full Swap** by using an EIP-712 hashing function.

```JavaScript
const ethUtil = require('ethereumjs-util')
const orderHashHex = hashes.getOrderHash(order); // See: tests/lib/hashes.js:60
const sig = await web3.eth.sign(orderHashHex, signer);
const { v, r, s } = ethUtil.fromRpcSig(sig);
return {
  version: '0x45', // Version 0x45: personal_sign
  v, r, s
}
```

#### Sign Typed Data
You can use `signTypedData` with **Full Swap** by calling it directly. Read more about [EIP-712](https://medium.com/metamask/eip712-is-coming-what-to-expect-and-how-to-use-it-bb92fd1a7a26).

```JavaScript
const ethUtil = require('ethereumjs-util')
const sigUtil = require('eth-sig-util')
const sig = sigUtil.signTypedData(privateKey, {
  data: {
    types,
    domain: {
      name: DOMAIN_NAME,
      version: DOMAIN_VERSION,
      verifyingContract,
    },
    primaryType: 'Order',
    message: order,
  },
});
const { v, r, s } = ethUtil.fromRpcSig(sig)
return {
  version: '0x01', // Version 0x01: signTypedData
  v, r, s
}
```

## Sources

| File | Location | Contents |
| :--- | :--- | :--- |
| `AtomicSwap.sol` | `contracts` | Functions `swap` `purchase` `cancel` |
| `Transferable.sol` | `contracts/lib` | Functions `send` `transferAny` `safeTransferAny` |
| `Authorizable.sol` | `contracts/lib` | Functions `authorize` `revoke` `isAuthorized` |
| `Verifiable.sol` | `contracts/lib` | Functions `isValid` `isValidSimple` |
| `Swap.js` | `tests` | All tests for `AtomicSwap.sol` |
| `assert.js` | `tests/lib` | Friendly names for common assertions |
| `constants.js` | `tests/lib` | Constant values and defaults |
| `hashes.js` | `tests/lib` | Functions for EIP-712 signature hashing |
| `helpers.js` | `tests/lib` | Helpers to check allowances and balances |
| `orders.js` | `tests/lib` | Generates order objects for use in tests |
| `signatures.js` | `tests/lib` | Generates various kinds of signatures |

## Tooling

Contracts written in [solidity 0.5.8](https://solidity.readthedocs.io/en/v0.5.8/) and tests written in [Mocha / Chai](https://truffleframework.com/docs/truffle/testing/writing-tests-in-javascript) with JavaScript.

| Command | Description |
| :--- | :--- |
| `yarn test` | Run the tests found in `/tests`. |
| `yarn coverage` | Run a test coverage report. [Forked](https://github.com/dmosites/solidity-coverage) to support `address payable` syntax. |
| `yarn solhint` | Run a syntax linter for the Solidity code. |
| `yarn eslint` | Run a syntax linter for the JavaScript code. |
