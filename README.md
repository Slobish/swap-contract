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
Transact directly peer-to-peer.

### Fungible and Non-Fungible
Swap between any two digital assets.

### Typed Data Signatures
Sign informative messages to improve usability.

### Delegate Authorization
Authorize peers to act on behalf of others.

### Affiliate Fees
Compensate those who connect peers.

### Batch Cancels
Cancel multiple orders in a single transaction.

## Definitions

| Term | Definition |
| :--- | :--- |
| Atomic Swap | A two-way token transfer that either succeeds for both sides or fails. |
| Order | A set of parameters that specify the parties and tokens of an atomic swap. |
| Maker | A party that sets and signs the parameters of an Order. |
| Taker | A party that submits an Order as an Ethereum transaction for execution. |
| Affiliate | An *optional* party compensated by the Maker for facilitating a trade. |
| Delegate | An *optional* party authorized to make or take orders on behalf of another party. |
| Token | A fungible (ERC-20) or non-fungible (ERC-721) Ethereum asset to be traded. |

## Purchase

Light weight purchase of a token for ether.
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

| Argument | Type | Optionality | Description |
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

### Errors
| Reason | Scenario |
| :--- | :--- |
| `ORDER_EXPIRED` | Order has an `expiry` lower than the current block time. |
| `ORDER_UNAVAILABLE` | Order has already been taken by its `id` value. |
| `SIGNATURE_INVALID` | Order has been signed by the maker but the signature is incorrect. |
| `VALUE_INCORRECT` | Value of the transaction (ether) does not match the cost of the purchase. |

## Light Swap
Swap between tokens (ERC-20 or ERC-721) using legacy signatures.

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

| Argument | Type | Optionality | Description |
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

| Error Reason | Scenario |
| :--- | :--- |
| `ORDER_EXPIRED` | Order has an `expiry` lower than the current block time. |
| `ORDER_UNAVAILABLE` | Order has already been taken by its `id` value. |
| `SIGNATURE_INVALID` | Order has been signed by the maker but the signature is incorrect. |

## Full Swap
Swap between tokens (ERC-20 or ERC-721) or ether, full features, using typed data signatures.

```Solidity
function swap(
  Order calldata order,
  Signature calldata signature,
  address signer
) external payable
```

| Argument | Type | Optionality | Description |
| :--- | :--- | :--- | :--- |
| `order` | `Order` | Required | A unique identifier for the order. |
| `signature` | `Signature` | Required | The expiry in seconds since unix epoch. |
| `signer` | `address` | Required | A unique identifier for the order. |

| Error Reason | Scenario |
| :--- | :--- |
| `SIGNER_UNAUTHORIZED` | Order has been signed by an account that has not been authorized to make it. |
| `SIGNATURE_INVALID` | Order has indicated a third-party signer but the signature is incorrect. |
| `ORDER_ALREADY_TAKEN` | Order has already been taken by its `id` value. |
| `ORDER_ALREADY_CANCELED` | Order has already been canceled by its `id` value. |
| `ORDER_EXPIRED` | Order has an `expiry` lower than the current block time. |
| `SENDER_UNAUTHORIZED` | Order has been sent by an account that has not been authorized to take it. |
| `VALUE_MUST_BE_SENT` | Order has a null `taker.token` to indicate an ether trade, but insufficient ether was sent. |
| `VALUE_MUST_BE_ZERO` | Order has a valid `taker.token` but an amount of ether was sent with the transaction. |
| `INSUFFICIENT_ALLOWANCE` | Transfer was attempted but the sender has not approved the Swap contract to move the balance. |
| `INSUFFICIENT_BALANCE` | Transfer was attempted but the sender has an insufficient balance. |
| `INVALID_AUTH_DELEGATE` | Delegate authorization was attempted but the expiry has already passed. |
| `INVALID_AUTH_EXPIRY` | Delegate authorization was attempted but the expiry has already passed. |

#### Order
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

#### Party
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


#### Signature

```Solidity
struct Signature {
  uint8 v;
  bytes32 r;
  bytes32 s;
  bytes1 version;
}
```

Ethereum wallets prefix signed data with byte `\x19` to stay out of range of valid transaction encoding. [EIP-191](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-191.md) standardizes this prefixing to include existing `personal_sign` behavior and [EIP-712](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md) implements it for structured data, which can be interpreted by the signer. In addition to the standard parameters of an elliptic curve signature `v`, `r`, and `s` we include a byte `version` to indicate `personal_sign` (`0x45`) or `signTypedData` (`0x01`) so that hashes can be recreated correctly in contract code.

| Property | Type | Optionality | Description |
| :--- | :--- | :--- | :--- |
| `v` | `address` | Required | The wallet address of a party. |
| `r` | `address` | Required | The address of the token the party will send or receive. |
| `s` | `uint256` | Required | Either an amount of ERC-20 or identifier of an ERC-721. |
| `version` | `uint256` | Required | Either an amount of ERC-20 or identifier of an ERC-721. |

### Authorize
For use in the **Full Swap** protocol. Authorize a delegate account or contract to make or take orders on the sender's behalf.
```Solidity
function authorize(address delegate, uint256 expiry) external returns (bool)
```

### Revoke
For use in the **Full Swap** protocol. Revoke the authorization of a delegate account or contract.
```Solidity
function revoke(address delegate) external returns (bool)
```

### Cancel

For use in the **Purchase**, **Light Swap**, or **Full Swap** protocol. Provide an array of `ids`, unique by maker address, to mark one or more orders as canceled.
```Solidity
function cancel(uint256[] memory ids) public
```

## Structure

| File | Functions |
| :--- | :--- |
| `contracts` / `AtomicSwap.sol` | `swap` `purchase` `cancel` |
| `contracts` / `lib` / `Transferable.sol` | `send` `transferAny` `safeTransferAny` |
| `contracts` / `lib` / `Authorizable.sol` | `authorize` `revoke` `isAuthorized` |
| `contracts` / `lib` / `Verifiable.sol` | `isValid` `isValidSimple` |

## Tooling

Contracts written in [solidity 0.5.8](https://solidity.readthedocs.io/en/v0.5.7/) and tests written in [Mocha / Chai](https://truffleframework.com/docs/truffle/testing/writing-tests-in-javascript) with JavaScript.

| Command | Description |
| :--- | :--- |
| `yarn test` | Run the tests found in `/test`. |
| `yarn coverage` | Run a test coverage report. [Forked](https://github.com/dmosites/solidity-coverage) to support `address payable` syntax. |
| `yarn solhint` | Run a syntax linter for the Solidity code. |
| `yarn eslint` | Run a syntax linter for the JavaScript code. |
