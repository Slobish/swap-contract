# Swap Contract

The [Swap Protocol](https://swap.tech/whitepaper/) is a peer-to-peer protocol for trading Ethereum tokens. This repository contains source code and tests for the Atomic Swap used by the Swap Protocol.

## Contents

* [Quick Start](#quick-start)
* [Highlights](#highlights)
* [Definitions](#definitions)
* [Swap](#swap)
  * [Arguments](#arguments)
  * [Reverts](#reverts)
* [Swap (Simple)](#swap-simple)
  * [Arguments](#arguments-1)
  * [Reverts](#reverts-1)
* [Cancels](#cancels)
* [Authorizations](#authorizations)
  * [Authorize](#authorize)
  * [Revoke](#revoke)
* [Events](#events)
  * [Swap](#swap-1)
  * [Cancel](#cancel)
* [Signatures](#signatures)
  * [Simple](#simple)
  * [Typed Data](#typed-data)
* [Sources](#sources)
* [TypeScript](#typescript)
* [Commands](#commands)
* [License](#license)

## Quick Start

```bash
$ git clone git:github.com/airswap/swap-contract.git
$ cd swap-contract
$ yarn
$ yarn ganache-cli
```
In another session...
```bash
$ cd swap-contract
$ yarn test
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
Compensate those who facilitate trades.

### Batch Cancels
Cancel multiple orders in a single transaction.

## Definitions

| Term | Definition |
| :--- | :--- |
| Swap | A transaction of multiple Token transfers that succeeds for all parties or fails. |
| Token | A fungible (ERC-20) or non-fungible (ERC-721) Ethereum asset to be transferred. |
| Maker | A party that sets and signs the parameters and price of an Order. |
| Taker | A party that accepts the parameters of an Order and settles it on Ethereum. |
| Affiliate | An *optional* party compensated by the Maker for facilitating a Swap. |
| Delegate | An *optional* party authorized to make or take Orders on behalf of another party. |
| Order | A specification of the tokens, amounts, and parties to a Swap. |
| Signature | An asymmetric cryptographic signature of an Order. |
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
| `order` | `Order` | Required | Order struct as specified below. |
| `signature` | `Signature` | Required | Signature struct as specified below. |

```Solidity
struct Order {
  uint256 id;      // A unique identifier for the Order
  uint256 expiry;  // The expiry in seconds since unix epoch
  Party maker;     // The Maker of the Order who sets price
  Party taker;     // The Taker of the Order who accepts price
  Party affiliate; // Optional affiliate to be paid by the Maker
}
```

```Solidity
struct Party {
  address wallet;  // The Ethereum account of the party
  address token;   // The address of the token the party sends or receives
  uint256 param;   // The amount of ERC-20 or the identifier of an ERC-721
}
```

```Solidity
struct Signature {
  address signer;  // The address of the signer Ethereum account
  bytes32 r;       // The `r` value of an ECDSA signature
  bytes32 s;       // The `s` value of an ECDSA signature
  uint8 v;         // The `v` value of an ECDSA signature
  bytes1 version;  // Indicates the signing method used
}
```

### Reverts

| Reason | Scenario |
| :--- | :--- |
| `SIGNER_UNAUTHORIZED` | Order has been signed by an account that has not been authorized to sign it. |
| `SIGNATURE_INVALID` | Signature provided does not match the Order provided. |
| `ORDER_ALREADY_TAKEN` | Order has already been taken by its `id` value. |
| `ORDER_ALREADY_CANCELED` | Order has already been canceled by its `id` value. |
| `ORDER_EXPIRED` | Order has an `expiry` lower than the current block time. |
| `SENDER_UNAUTHORIZED` | Order has been sent by an account that has not been authorized to send it. |
| `VALUE_MUST_BE_SENT` | Order indicates an ether Swap but insufficient ether was sent. |
| `VALUE_MUST_BE_ZERO` | Order indicates a token Swap but ether was sent. |
| `MAKER_INSUFFICIENT_ALLOWANCE` | Maker has not approved the Swap contract to transfer the balance. |
| `MAKER_INSUFFICIENT_BALANCE` | Maker has an insufficient balance. |
| `TAKER_INSUFFICIENT_ALLOWANCE` | Taker has not approved the Swap contract to transfer the balance. |
| `TAKER_INSUFFICIENT_BALANCE` | Taker has an insufficient balance. |
| `INVALID_AUTH_DELEGATE` | Delegate address is the same as the sender address. |
| `INVALID_AUTH_EXPIRY` | Authorization expiry time is in the past. |

## Swap (Simple)
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
| `id` | `uint256` | Required | A unique identifier for the Order. |
| `expiry` | `uint256` | Required | The expiry in seconds since unix epoch. |
| `makerWallet` | `address` | Required | The Maker of the Order who sets price. |
| `makerParam` | `uint256` | Required | The amount or identifier of the token the Maker sends. |
| `makerToken` | `address` | Required | The address of the token the Maker sends. |
| `takerParam` | `uint256` | Required | The amount or identifier of the token the Taker sends. |
| `expiry` | `uint256` | Required | The expiry in seconds since unix epoch. |
| `r` | `bytes32` | Required | The `r` value of an ECDSA signature. |
| `s` | `bytes32` | Required | The `s` value of an ECDSA signature. |
| `v` | `uint8` | Required | The `v` value of an ECDSA signature. |

### Reverts

| Reason | Scenario |
| :--- | :--- |
| `ORDER_EXPIRED` | Order has an `expiry` lower than the current block time. |
| `ORDER_UNAVAILABLE` | Order has already been taken or canceled. |
| `SIGNATURE_INVALID` | Signature provided does not match the Order provided. |

## Cancels
Provide an array of `ids`, unique by Maker address, to mark one or more Orders as canceled.
```Solidity
function cancel(uint256[] memory ids) external
```

## Authorizations
Peers may authorize other peers to make (sign) or take (send) Orders on their behalf. This is useful for delegating authorization to a trusted third party, whether a user account or smart contract. An authorization works for both sides of a Swap, regardless of whether the delegate signing or sending on ones behalf.

### Authorize
Authorize a delegate account or contract to make (sign) or take (send) Orders on the sender's behalf. Only sender authorization, for example delegation to another smart contract to take orders, is supported for **Swap (Simple)**.
```Solidity
function authorize(address delegate, uint256 expiry) external returns (bool)
```

### Revoke
Revoke the authorization of a delegate account or contract.
```Solidity
function revoke(address delegate) external returns (bool)
```

## Events
Ethereum transactions often emit events to indicate state changes or other provide useful information. The `indexed` keyword indicates that a filter may be set on the property. Learn more about events and filters in the [official documentation](https://solidity.readthedocs.io/en/v0.5.8/contracts.html#events).

### Swap
Emitted with a successful Swap.

```Solidity
event Swap(
  uint256 indexed id,
  address indexed makerAddress,
  uint256 makerParam,
  address makerToken,
  address takerAddress,
  uint256 takerParam,
  address takerToken,
  address affiliateAddress,
  uint256 affiliateParam,
  address affiliateToken
);
```

### Cancel
Emitted with a successful Cancel.

```Solidity
event Cancel(
  uint256 indexed id,
  address indexed makerAddress
);
```

## Signatures
When producing [ECDSA](https://hackernoon.com/a-closer-look-at-ethereum-signatures-5784c14abecc) signatures, Ethereum wallets prefix signed data with byte `\x19` to stay out of range of valid RLP so that a signature cannot be executed as a transaction. [EIP-191](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-191.md) standardizes this prefixing to include existing `personal_sign` behavior and [EIP-712](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md) implements it for structured data, which makes the data more transparent for the signer. Signatures are comprised of parameters `v`, `r`, and `s`. Read more about [Ethereum Signatures]().

### Typed Data
For use in **Swap**. The `Signature` struct is passed to the function including a byte `version` to indicate `personal_sign` (`0x45`) or `signTypedData` (`0x01`) so that hashes can be recreated correctly in contract code.

#### Personal Sign
You can use `personal_sign` with **Full Swap** by using an EIP-712 hashing function.

```JavaScript
const ethUtil = require('ethereumjs-util')
const orderHashHex = hashes.getOrderHash(order); // See: test/lib/hashes.js:60
const sig = await web3.eth.sign(orderHashHex, signer);
const { r, s, v } = ethUtil.fromRpcSig(sig);
return {
  version: '0x45', // Version 0x45: personal_sign
  r, s, v
}
```

#### Sign Typed Data
You can use `signTypedData` with **Full Swap** by calling it directly. Read more about [EIP-712](https://medium.com/metamask/eip712-is-coming-what-to-expect-and-how-to-use-it-bb92fd1a7a26).

```JavaScript
const ethUtil = require('ethereumjs-util')
const sigUtil = require('eth-sig-util')
const DOMAIN_NAME = 'SWAP'
const DOMAIN_VERSION = '2'
const verifyingContract = '0x0...' // Address of the Swap Contract
const sig = sigUtil.signTypedData(privateKey, {
  data: {
    types, // See: test/lib/constants.js:5
    domain: {
      name: DOMAIN_NAME,
      version: DOMAIN_VERSION,
      verifyingContract,
    },
    primaryType: 'Order',
    message: order, // See: test/lib/orders.js:28
  },
});
const { r, s, v } = ethUtil.fromRpcSig(sig)
return {
  version: '0x01', // Version 0x01: signTypedData
  r, s, v
}
```

### Simple
For use in **Swap (Simple)**. Signature parameters are passed directly to the function.

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
const { r, s, v } = ethUtil.fromRpcSig(sig);
```

## Sources

| File | Location | Contents |
| :--- | :--- | :--- |
| `Swap.sol` | `contracts` | Functions `swap` `cancel` |
| `Transferable.sol` | `contracts/lib` | Functions `send` `transferAny` `safeTransferAny` |
| `Authorizable.sol` | `contracts/lib` | Functions `authorize` `revoke` `isAuthorized` |
| `Verifiable.sol` | `contracts/lib` | Functions `isValid` `isValidSimple` |
| `Swap.js` | `test` | All tests for `Swap.sol` |
| `assert.js` | `test/lib` | Friendly names for common assertions |
| `constants.js` | `test/lib` | Constant values and defaults |
| `hashes.js` | `test/lib` | Functions for EIP-712 signature hashing |
| `helpers.js` | `test/lib` | Helpers to check allowances and balances |
| `orders.js` | `test/lib` | Generates Order objects for use in tests |
| `signatures.js` | `test/lib` | Generates various kinds of signatures |

## TypeScript
To interact with Swap using [TypeScript](https://www.typescriptlang.org/) you'll find a `swap.ts` module in the [wrappers](wrappers/) folder.

## Commands

Contracts written in [solidity 0.5.8](https://solidity.readthedocs.io/en/v0.5.8/) and tests written in [Mocha / Chai](https://truffleframework.com/docs/truffle/testing/writing-tests-in-javascript) with JavaScript.

| Command | Description |
| :--- | :--- |
| `yarn compile` | Build the contracts to `build` |
| `yarn ts` | Build the TypeScript module to `wrappers` |
| `yarn test` | Run the tests found in `test` |
| `yarn hint` | Run a syntax linter for the Solidity code |
| `yarn lint` | Run a syntax linter for the JavaScript code |

## License

Copyright 2019 Swap Holdings Ltd.

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
