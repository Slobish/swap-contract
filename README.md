# Swap Protocol
This is the repository for the Swap Protocol.

## Quick Start

```bash
$ git clone git:github.com/airswap/swap-protocol.git
$ cd swap-protocol
$ yarn
$ yarn coverage
```
## Commands

- **yarn compile** to compile the source files in `contracts`
- **yarn test** to compile and run the JavaScript tests in `tests`
- **yarn coverage** to compile and test to determine test coverage
- **yarn migrate** to deploy contracts to a specific network

## Source

#### Structure

#### Syntax

#### Files

- `Swap.sol` — 
- `lib` `/`
  - `Events.sol` — 
  - `Transfers.sol` —
  - `Verifier.sol` —
  - `interfaces.sol` — 

## Protocol

##### The path of a trade

[ Protocol Spec ]

##### The Atomic Swap

[ Swap Spec ]

### Filling an Order

The `Swap` contract has a public function `fill(order, signature)` to perform an atomic swap.

#### Order Properties

##### Makers

[ Maker Spec ]

##### Takers

[ Taker Spec ]

##### Partners

[ Fee Spec ]

##### Senders

[ Sender Spec ]

##### Expiration

[ Expiration Spec ]

##### Nonces

[ Nonce Spec ]

##### Example

```
Order {
  nonce: 0,
  expiration: 0,
  sender: 0,
  maker: {
    wallet: '0x...',
    token: '0x...',
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

#### Signature Properties

##### Hashing an Order

##### Elliptic Curve Digital Signatures

##### Prefixes

##### Example

```
Signature {
  r: '0x...',
  s: '0x...',
  v: '0x...',
  prefixed: false
}
```

## Kinds of Tokens

[ ERC-20, ERC-721 Spec ]

## Failure Messages
[ Failure Spec ]

- **ALREADY_FILLED**
- **ORDER_EXPIRED**
- **INVALID_SIGNATURE**
- **INCORRECT_SENDER**
- **TAKER_MUST_BE_SENDER**
- **VALUE_MUST_BE_SENT**
- **VALUE_MUST_BE_ZERO**
- **INSUFFICIENT_ALLOWANCE**
- **INSUFFICIENT_BALANCE**

## Toolchain

- **solidity-coverage**
- **Solidity 0.5.0**
- **JavaScript ES7**
- **solhint**
- **eslint**
