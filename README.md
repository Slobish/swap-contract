# Swap Protocol
The [Swap Protocol](https://swap.tech/whitepaper/) is a peer-to-peer protocol for trading Ethereum tokens.

## Quick Start

```bash
$ git clone git:github.com/airswap/swap-protocol.git
$ cd swap-protocol
$ yarn
$ yarn coverage
```

## Tools

Contracts written in [Solidity 0.5.0](https://solidity.readthedocs.io/en/v0.5.0/) and tests written in [Mocha / Chai](https://truffleframework.com/docs/truffle/testing/writing-tests-in-javascript) with JavaScript.

| Command | Description
| ---
| `yarn test` | Run the tests found in `/test`.
| `yarn coverage` | Run a test coverage report. [Forked](https://github.com/dmosites/solidity-coverage) to support `address payable` syntax.
| `yarn solhint` | Run a syntax linter for the Solidity code.
| `yarn eslint` | Run a syntax linter for the JavaScript code.

## Definitions

| Term | Type | Description |
| --- |
| Swap | `contract` | A smart contract that interprets trade terms and executes an atomic swap.
| Order | `struct` | An agreement on trade terms signed by the Maker.
| Maker | `account` | A party that sets and signs the trade terms into an Order.
| Taker | `account` | A party that accepts and submits the Order to the Swap contract.
| Affiliate | `account` | An *optional* party compensated by the Maker for facilitating a trade.
| Delegate | `account` | An *optional* party authorized to make or take orders on behalf of another party.
| Token | `contract` | A fungible or non-fungible Ethereum asset to be traded.

## Sources

| File | Functions
| --- |
| `Swap.sol` | `fill` `cancel`
| `lib` / `Transferable.sol` | `transfer` `swap` `send`
| `lib` / `Authorizable.sol` | `authorize` `revoke` `isAuthorized`
| `lib` / `Verifiable.sol` | `isValid`

## Functions

### Fill an Order

Execute and settle a signed order to perform an atomic swap and mark the order filled.
```solidity
fill(Order order, Signature signature)
```

### Cancel Orders

Provide an array of nonces, unique by maker address, to mark one or more orders as filled.
```solidity
cancel(uint256[] nonces)
```

### Authorize a Delegate

Authorize a delegate account or contract to make or take orders on the sender's behalf.
```solidity
authorize(address delegate, uint256 expiry)
```

### Revoke a Delegate

Revoke the authorization of a delegate account or contract.
```solidity
revoke(address delegate)
```

## Order

| Type | Property | Necessity | Description
|---
| `uint256` | **expiry** | Required | The expiration time in seconds.
| `uint256` | **nonce** | Required | A unique identifier for the order.
| `address` | **signer** | Optional | A third-party signing on behalf of the maker.
| `Party` | **maker** | Required | The maker of the order who sets price.
| `Party` | **taker** | Required | The taker of the order who accepts price.
| `Party` | **partner** | Optional | The facilitator who is paid by the maker.

```solidity
struct Order {
  uint256 expiry;
  uint256 nonce;
  address signer;
  Party maker;
  Party taker;
  Party partner;
}
```

### Party

| Type | Property | Description
|---
| `address` | **wallet** | Required | The expiration time in seconds.
| `address` | **token** | Required | A unique identifier for the order.
| `uint256` | **param** | Required | Either the amount of ERC20 or identifier of an ERC721.

```solidity
struct Party {
  address wallet;
  address token;
  uint256 param;
}
```

JSON of an order with a partner and signed by a delegate.

```JavaScript
{
  expiry: 1507630210000,
  nonce: 123,
  signer: '0x0...',
  maker: {
    wallet: '0x0...',
    token: '0x0...',
    param: 100
  },
  taker: {
    wallet: '0x...',
    token: '0x...',
    param: 500
  },
  partner: {
    wallet: '0x...',
    token: '0x...',
    param: 10
  }
}
```

## Signature
Ethereum wallets prefix signed data with byte `\x19` to stay out of range of valid transaction encoding. [EIP-191](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-191.md) standardizes this prefixing to include existing `personal_sign` behavior and [EIP-712](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md) implements it for structured data, which can be interpreted by the signer. In addition to the standard parameters of an elliptic curve signature `v`, `r`, and `s` we provide a byte `version` to indicate `personal_sign` (`0x45`) and `signTypedData` (`0x01`) so that hashes can be recreated correctly in contract code.

```solidity
struct Signature {
  uint8 v;
  bytes32 r;
  bytes32 s;
  bytes1 version;
}
```
JSON indicating that `personal_sign` was used.

```JavaScript
{ v: 27, r: '0x...', s: '0x...', version: '0x45' }
```

## Failure Messages

The following messages are provided when a fill transaction fails and reverts.

| Reason | Scenario
| ---
| `ALREADY_FILLED` | Order has already been filled or canceled by its `nonce` value.
| `ORDER_EXPIRED` | Order has an `expiry` lower than the current block time.
| `SENDER_NOT_AUTHORIZED` | Order has been sent by an account that has not been authorized to take it.
| `SIGNER_NOT_AUTHORIZED` | Order has been signed by an account that has not been authorized to make it.
| `INVALID_DELEGATE_SIGNATURE` | Order has indicated a third-party signer but the signature is incorrect.
| `INVALID_MAKER_SIGNATURE` | Order has been signed by the maker but the signature is incorrect.
| `VALUE_MUST_BE_SENT` | Order has a null `taker.token` to indicate an ether trade, but insufficient ether was sent.
| `VALUE_MUST_BE_ZERO` | Order has a valid `taker.token` but an amount of ether was sent with the transaction.
| `INSUFFICIENT_ALLOWANCE` | Transfer was attempted but the sender has not approved the Swap contract to move the balance.
| `INSUFFICIENT_BALANCE` | Transfer was attempted but the sender has an insufficient balance.
| `INVALID_EXPIRY` | Delegate authorization was attempted but the expiry has already passed.
