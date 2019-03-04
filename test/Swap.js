const Swap = artifacts.require('Swap')
const AST = artifacts.require('FungibleA')
const DAI = artifacts.require('FungibleB')
const ConcertTicket = artifacts.require('NonFungibleA')
const Collectible = artifacts.require('NonFungibleB')

const {
  emitted,
  reverted,
  none,
  equal,
  ok,
} = require('./lib/assert.js')
const {
  allowances,
  balances,
  getLatestTimestamp,
} = require('./lib/helpers.js')
const orders = require('./lib/orders.js')
const signatures = require('./lib/signatures.js')

const defaultAuthExpiry = orders.generateExpiry()

contract('Swap', ([
  aliceAddress,
  bobAddress,
  carolAddress,
  davidAddress,
]) => {
  let swapContract
  let swapAddress
  let tokenAST
  let tokenDAI
  let tokenTicket
  let tokenKitty

  orders.setKnownAccounts([aliceAddress, bobAddress, carolAddress, davidAddress])

  describe('Deploying...', () => {
    it('Deployed Swap contract', async () => {
      swapContract = await Swap.deployed()
      swapAddress = swapContract.address
      orders.setVerifyingContract(swapAddress)
    })

    it('Deployed test contract "AST"', async () => {
      tokenAST = await AST.deployed()
    })

    it('Deployed test contract "DAI"', async () => {
      tokenDAI = await DAI.deployed()
    })
  })

  describe('Minting...', () => {
    it('Mints 1000 AST for Alice', async () => {
      emitted(await tokenAST.mint(aliceAddress, 1000), 'Transfer')
      ok(balances(aliceAddress, [[tokenAST, 1000], [tokenDAI, 0]]), 'Alice balances are incorrect')
    })

    it('Mints 1000 DAI for Bob', async () => {
      emitted(await tokenDAI.mint(bobAddress, 1000), 'Transfer')
      ok(balances(bobAddress, [[tokenAST, 0], [tokenDAI, 1000]]), 'Bob balances are incorrect')
    })
  })

  describe('Approving...', () => {
    it('Alice approves Swap to spend 200 AST', async () => {
      emitted(await tokenAST.approve(swapAddress, 200, { from: aliceAddress }), 'Approval')
    })

    it('Bob approves Swap to spend 9999 DAI', async () => {
      emitted(await tokenDAI.approve(swapAddress, 9999, { from: bobAddress }), 'Approval')
    })

    it('Checks approvals (Alice 250 AST and 0 DAI, Bob 0 AST and 500 DAI)', async () => {
      ok(allowances(aliceAddress, swapAddress, [[tokenAST, 200], [tokenDAI, 0]]))
      ok(allowances(bobAddress, swapAddress, [[tokenAST, 0], [tokenDAI, 500]]))
    })
  })

  describe('Fills (Fungible)', () => {
    let _order
    let _signature

    before('Alice creates an order for Bob (200 AST for 50 DAI)', async () => {
      const { order, signature } = await orders.getOrder({
        maker: {
          wallet: aliceAddress,
          token: tokenAST.address,
          param: 200,
        },
        taker: {
          wallet: bobAddress,
          token: tokenDAI.address,
          param: 50,
        },
      })
      _order = order
      _signature = signature
    })

    it('Checks that Bob can fill an order from Alice (200 AST for 50 DAI)', async () => {
      emitted(await swapContract.fill(_order, _signature, { from: bobAddress }), 'Fill')
    })

    it('Checks balances...', async () => {
      ok(balances(aliceAddress, [[tokenAST, 800], [tokenDAI, 50]]), 'Alice balances are incorrect')
      ok(balances(bobAddress, [[tokenAST, 200], [tokenDAI, 950]]), 'Bob balances are incorrect')
    })

    it('Checks that Bob cannot fill the same order again (200 AST for 50 DAI)', async () => {
      await reverted(swapContract.fill(_order, _signature, { from: bobAddress }), 'ORDER_ALREADY_FILLED')
    })

    it('Checks that Alice cannot trade more than approved (200 AST)', async () => {
      const { order, signature } = await orders.getOrder({
        maker: {
          wallet: aliceAddress,
          token: tokenAST.address,
          param: 200,
        },
        taker: {
          wallet: bobAddress,
        },
      })
      await reverted(swapContract.fill(order, signature, { from: bobAddress }), 'INSUFFICIENT_ALLOWANCE')
    })

    it('Checks that Bob cannot fill an expired order', async () => {
      const { order, signature } = await orders.getOrder({
        maker: {
          wallet: aliceAddress,
        },
        taker: {
          wallet: bobAddress,
        },
        expiry: 0,
      })
      await reverted(swapContract.fill(order, signature, { from: bobAddress }), 'ORDER_EXPIRED')
    })

    it('Checks that sending ether with a token trade will revert', async () => {
      const { order, signature } = await orders.getOrder({
        maker: {
          wallet: aliceAddress,
        },
        taker: {
          wallet: bobAddress,
          token: tokenAST.address,
        },
      })
      await reverted(swapContract.fill(order, signature, { from: bobAddress, value: 1 }), 'VALUE_MUST_BE_ZERO')
    })

    it('Checks that Bob can not trade more than he holds', async () => {
      const { order, signature } = await orders.getOrder({
        maker: {
          wallet: bobAddress,
          token: tokenDAI.address,
          param: 1000,
        },
        taker: {
          wallet: aliceAddress,
        },
      }, bobAddress, swapAddress)
      await reverted(swapContract.fill(order, signature, { from: aliceAddress }), 'INSUFFICIENT_BALANCE')
    })

    it('Checks existing balances (Alice 800 AST and 50 DAI, Bob 200 AST and 950 DAI)', async () => {
      ok(balances(aliceAddress, [[tokenAST, 800], [tokenDAI, 50]]), 'Alice balances are incorrect')
      ok(balances(bobAddress, [[tokenAST, 200], [tokenDAI, 950]]), 'Bob balances are incorrect')
    })
  })

  describe('Signer Delegation (Maker-side)', () => {
    let _order
    let _signature

    before('Alice creates an order for Bob (200 AST for 50 DAI)', async () => {
      const { order, signature } = await orders.getOrder({
        signer: davidAddress,
        maker: {
          wallet: aliceAddress,
          token: tokenAST.address,
          param: 50,
        },
        taker: {
          wallet: bobAddress,
          token: tokenDAI.address,
          param: 10,
        },
      })
      _order = order
      _signature = signature
    })

    it('Checks that David cannot make an order on behalf of Alice', async () => {
      await reverted(swapContract.fill(_order, _signature, { from: bobAddress }), 'SIGNER_NOT_AUTHORIZED')
    })

    it('Alice attempts to authorize David to make orders on her behalf with an invalid expiry', async () => {
      const authExpiry = await getLatestTimestamp()
      await reverted(swapContract.authorize(davidAddress, authExpiry, { from: aliceAddress }), 'INVALID_EXPIRY')
    })

    it('Alice authorizes David to make orders on her behalf', async () => {
      emitted(await swapContract.authorize(davidAddress, defaultAuthExpiry, { from: aliceAddress }), 'Authorization')
    })

    it('Alice approves Swap to spend the rest of her AST', async () => {
      emitted(await tokenAST.approve(swapAddress, 800, { from: aliceAddress }), 'Approval')
    })

    it('Checks that David can make an order on behalf of Alice', async () => {
      emitted(await swapContract.fill(_order, _signature, { from: bobAddress }), 'Fill')
    })

    it('Alice revokes authorization from David', async () => {
      emitted(await swapContract.revoke(davidAddress, { from: aliceAddress }), 'Revocation')
    })

    it('Checks that David can no longer make orders on behalf of Alice', async () => {
      const { order, signature } = await orders.getOrder({
        signer: davidAddress,
        maker: {
          wallet: aliceAddress,
        },
        taker: {
          wallet: bobAddress,
        },
      }, davidAddress, swapAddress)
      await reverted(swapContract.fill(order, signature, { from: bobAddress }), 'SIGNER_NOT_AUTHORIZED')
    })
  })

  describe('Sender Delegation (Taker-side)', () => {
    let _order
    let _signature

    before('Alice creates an order for Bob (200 AST for 50 DAI)', async () => {
      const { order, signature } = await orders.getOrder({
        maker: {
          wallet: aliceAddress,
          token: tokenAST.address,
          param: 50,
        },
        taker: {
          wallet: bobAddress,
          token: tokenDAI.address,
          param: 10,
        },
      })
      _order = order
      _signature = signature
    })

    it('Checks that Carol can not take an order on behalf of Bob', async () => {
      await reverted(swapContract.fill(_order, _signature, { from: carolAddress }), 'SENDER_NOT_AUTHORIZED')
    })

    it('Bob authorizes Carol to take orders on his behalf', async () => {
      emitted(await swapContract.authorize(carolAddress, defaultAuthExpiry, { from: bobAddress }), 'Authorization')
    })

    it('Checks that Carol can take an order on behalf of Bob', async () => {
      emitted(await swapContract.fill(_order, _signature, { from: carolAddress }), 'Fill')
    })

    it('Bob revokes sender authorization from Carol', async () => {
      emitted(await swapContract.revoke(carolAddress, { from: bobAddress }), 'Revocation')
    })

    it('Checks that Carol can no longer take orders on behalf of Bob', async () => {
      const { order, signature } = await orders.getOrder({
        maker: {
          wallet: aliceAddress,
        },
        taker: {
          wallet: bobAddress,
        },
      })
      await reverted(swapContract.fill(order, signature, { from: carolAddress }), 'SENDER_NOT_AUTHORIZED')
    })
  })

  describe('Signer and Sender Delegation (Combined)', () => {
    it('Alice approves David to make orders on her behalf', async () => {
      emitted(await swapContract.authorize(davidAddress, defaultAuthExpiry, { from: aliceAddress }), 'Authorization')
    })

    it('Bob approves Carol to take orders on his behalf', async () => {
      emitted(await swapContract.authorize(carolAddress, defaultAuthExpiry, { from: bobAddress }), 'Authorization')
    })

    it('David makes an order for Alice, Carol takes the order for Bob', async () => {
      const { order, signature } = await orders.getOrder({
        signer: davidAddress,
        maker: {
          wallet: aliceAddress,
          token: tokenAST.address,
          param: 50,
        },
        taker: {
          wallet: bobAddress,
          token: tokenDAI.address,
          param: 10,
        },
      }, davidAddress, swapAddress)
      emitted(await swapContract.fill(order, signature, { from: carolAddress }), 'Fill')
    })
  })

  describe('Cancels', () => {
    let _order
    let _signature

    before('Alice creates an order for nonce "12345"', async () => {
      const { order, signature } = await orders.getOrder({
        maker: {
          wallet: aliceAddress,
        },
        nonce: 12345,
      })
      _order = order
      _signature = signature
    })

    it('Checks that Alice is able to cancel order with nonce "12345"', async () => {
      emitted(await swapContract.cancel([_order.nonce], { from: aliceAddress }), 'Cancel')
    })

    it('Checks that Alice is unable to cancel the same order twice', async () => {
      none(await swapContract.cancel([_order.nonce], { from: aliceAddress }), 'Cancel')
    })

    it('Checks that Bob is unable to fill the order with nonce "12345"', async () => {
      await reverted(swapContract.fill(_order, _signature, { from: bobAddress }), 'ORDER_ALREADY_CANCELED')
    })

    it('Checks existing balances (Alice 800 AST and 50 DAI, Bob 200 AST and 950 DAI)', async () => {
      ok(balances(aliceAddress, [[tokenAST, 700], [tokenDAI, 60]]), 'Alice balances are incorrect')
      ok(balances(bobAddress, [[tokenAST, 250], [tokenDAI, 940]]), 'Bob balances are incorrect')
    })
  })

  describe('Fills with Ether', () => {
    const value = 1

    it('Checks allowance (Alice 200 AST)', async () => {
      ok(allowances(aliceAddress, [[tokenAST, 200]]), 'Alice has not approved 200 AST')
    })

    it('Checks that Bob cannot fill an order for ETH without sending ether', async () => {
      const { order, signature } = await orders.getOrder({
        maker: {
          wallet: aliceAddress,
        },
        taker: {
          wallet: bobAddress,
          param: value,
        },
      })
      await reverted(swapContract.fill(order, signature, { from: bobAddress }), 'VALUE_MUST_BE_SENT')
    })

    it('Checks that Bob can fill an order for ETH from Alice (200 AST for 1 ETH)', async () => {
      const { order, signature } = await orders.getOrder({
        maker: {
          wallet: aliceAddress,
          token: tokenAST.address,
          param: 200,
        },
        taker: {
          wallet: bobAddress,
          param: value,
        },
      })
      emitted(await swapContract.fill(order, signature, { from: bobAddress, value }), 'Fill')
    })

    it('Ensures that Swap has not kept any of the ether', async () => {
      equal(await web3.eth.getBalance(swapAddress), 0, 'Swap contract took ether from the trade')
    })

    it('Checks that Bob can not accidentally send ether with a fill', async () => {
      const { order, signature } = await orders.getOrder({
        maker: {
          wallet: aliceAddress,
        },
        taker: {
          wallet: bobAddress,
          token: tokenAST.address,
        },
      })
      await reverted(swapContract.fill(order, signature, { from: bobAddress, value }), 'VALUE_MUST_BE_ZERO')
    })

    it('Checks balances...', async () => {
      ok(await balances(aliceAddress, [[tokenAST, 450], [tokenDAI, 80]]), 'Alice balances are incorrect')
      ok(await balances(bobAddress, [[tokenAST, 550], [tokenDAI, 920]]), 'Bob balances are incorrect')
    })
  })

  describe('Fills with Fees', () => {
    it('Checks that Carol gets paid 50 AST for facilitating a trade between Alice and Bob', async () => {
      const { order, signature } = await orders.getOrder({
        maker: {
          wallet: aliceAddress,
          token: tokenAST.address,
          param: 200,
        },
        taker: {
          wallet: bobAddress,
          token: tokenDAI.address,
          param: 50,
        },
        affiliate: {
          wallet: carolAddress,
          token: tokenAST.address,
          param: 50,
        },
      })
      emitted(await swapContract.fill(order, signature, { from: bobAddress }), 'Fill')
    })

    it('Checks balances...', async () => {
      ok(await balances(aliceAddress, [[tokenAST, 200], [tokenDAI, 130]]), 'Alice balances are incorrect')
      ok(await balances(bobAddress, [[tokenAST, 750], [tokenDAI, 870]]), 'Bob balances are incorrect')
      ok(await balances(carolAddress, [[tokenAST, 50], [tokenDAI, 0]]), 'Carol balances are incorrect')
    })
  })

  describe('Deploying...', () => {
    it('Deployed test contract "ConcertTicket"', async () => {
      tokenTicket = await ConcertTicket.deployed()
    })

    it('Deployed test contract "Collectible"', async () => {
      tokenKitty = await Collectible.deployed()
    })
  })

  describe('Minting...', () => {
    it('Mints a concert ticket (#12345) for Alice', async () => {
      emitted(await tokenTicket.mint(aliceAddress, 12345), 'Transfer')
      ok(balances(aliceAddress, [[tokenTicket, 1]]), 'Alice balances are incorrect')
    })

    it('Mints a kitty collectible (#54321) for Bob', async () => {
      emitted(await tokenKitty.mint(bobAddress, 54321), 'Transfer')
      ok(balances(bobAddress, [[tokenKitty, 1]]), 'Bob balances are incorrect')
    })
  })

  describe('Fills (Non-Fungible)', () => {
    it('Alice approves Swap to transfer her concert ticket', async () => {
      emitted(await tokenTicket.approve(swapAddress, 12345, { from: aliceAddress }), 'Approval')
    })

    it('Bob buys Ticket #12345 from Alice for 1 DAI', async () => {
      const { order, signature } = await orders.getOrder({
        maker: {
          wallet: aliceAddress,
          token: tokenTicket.address,
          param: 12345,
        },
        taker: {
          wallet: bobAddress,
          token: tokenDAI.address,
          param: 100,
        },
      })
      emitted(await swapContract.fill(order, signature, { from: bobAddress }), 'Fill')
    })

    it('Bob approves Swap to transfer his kitty collectible', async () => {
      emitted(await tokenKitty.approve(swapAddress, 54321, { from: bobAddress }), 'Approval')
    })

    it('Alice buys Kitty #54321 from Bob for 100 AST', async () => {
      const { order, signature } = await orders.getOrder({
        maker: {
          wallet: aliceAddress,
          token: tokenAST.address,
          param: 100,
        },
        taker: {
          wallet: bobAddress,
          token: tokenKitty.address,
          param: 54321,
        },
      })
      emitted(await swapContract.fill(order, signature, { from: bobAddress }), 'Fill')
    })

    it('Alice approves Swap to transfer her kitty collectible', async () => {
      emitted(await tokenKitty.approve(swapAddress, 54321, { from: aliceAddress }), 'Approval')
    })

    it('Checks that Carol gets paid Kitty #54321 for facilitating a trade between Alice and Bob', async () => {
      const { order, signature } = await orders.getOrder({
        maker: {
          wallet: aliceAddress,
          token: tokenAST.address,
          param: 100,
        },
        taker: {
          wallet: bobAddress,
          token: tokenDAI.address,
          param: 50,
        },
        affiliate: {
          wallet: carolAddress,
          token: tokenKitty.address,
          param: 54321,
        },
      })
      emitted(await swapContract.fill(order, signature, { from: bobAddress }), 'Fill')
    })

    it('Checks balances...', async () => {
      ok(await balances(aliceAddress, [[tokenTicket, 0], [tokenKitty, 0], [tokenDAI, 280]]), 'Alice balances are incorrect')
      ok(await balances(bobAddress, [[tokenTicket, 1], [tokenKitty, 0], [tokenDAI, 720]]), 'Bob balances are incorrect')
      ok(await balances(carolAddress, [[tokenKitty, 1]]), 'Carol balances are incorrect')
    })
  })

  describe('Signatures', () => {
    const eveAddress = '0x9d2fB0BCC90C6F3Fa3a98D2C760623a4F6Ee59b4'
    const evePrivKey = Buffer.from('4934d4ff925f39f91e3729fbce52ef12f25fdf93e014e291350f7d314c1a096b', 'hex')

    it('Checks that an invalid maker signature will revert', async () => {
      const { order } = await orders.getOrder({
        maker: {
          wallet: aliceAddress,
        },
        taker: {
          wallet: bobAddress,
        },
      })
      const signature = signatures.getPrivateKeySignature(order, evePrivKey, swapAddress)
      await reverted(swapContract.fill(order, signature, { from: bobAddress }), 'INVALID_MAKER_SIGNATURE')
    })

    it('Alice authorizes Eve to make orders on her behalf', async () => {
      emitted(await swapContract.authorize(eveAddress, defaultAuthExpiry, { from: aliceAddress }), 'Authorization')
    })

    it('Checks that an invalid delegate signature will revert', async () => {
      const { order: orderOne } = await orders.getOrder({
        signer: eveAddress,
        maker: {
          wallet: aliceAddress,
        },
        taker: {
          wallet: bobAddress,
        },
      })
      const { order: orderTwo } = await orders.getOrder({
        maker: {
          wallet: aliceAddress,
        },
        taker: {
          wallet: bobAddress,
        },
      })
      const signatureTwo = signatures.getPrivateKeySignature(orderTwo, evePrivKey, swapAddress)
      await reverted(swapContract.fill(orderOne, signatureTwo, { from: bobAddress }), 'INVALID_DELEGATE_SIGNATURE')
    })
    it('Checks that an invalid signature version will revert', async () => {
      const { order } = await orders.getOrder({
        maker: {
          wallet: aliceAddress,
        },
        taker: {
          wallet: bobAddress,
        },
      })
      const signature = signatures.getPrivateKeySignature(order, evePrivKey, swapAddress)
      signature.version = Buffer.from('00', 'hex')
      await reverted(swapContract.fill(order, signature, { from: bobAddress }), 'INVALID_SIGNATURE_VERSION')
    })
    it('Checks that a private key signature is valid', async () => {
      const { order } = await orders.getOrder({
        maker: {
          wallet: eveAddress,
          token: tokenAST.address,
          param: 0,
        },
        taker: {
          wallet: aliceAddress,
          token: tokenDAI.address,
          param: 0,
        },
      })
      const signature = signatures.getPrivateKeySignature(order, evePrivKey, swapAddress)
      emitted(await swapContract.fill(order, signature, { from: aliceAddress }), 'Fill')
    })
    it('Checks that a typed data (EIP712) signature is valid', async () => {
      const { order } = await orders.getOrder({
        maker: {
          wallet: eveAddress,
          token: tokenAST.address,
          param: 0,
        },
        taker: {
          wallet: aliceAddress,
          token: tokenDAI.address,
          param: 0,
        },
      })
      const signature = signatures.getTypedDataSignature(order, evePrivKey, swapAddress)
      emitted(await swapContract.fill(order, signature, { from: aliceAddress }), 'Fill')
    })
  })

  describe('Reduce entry points for Swap with Transferable', () => {

    it('Alice approves Swap to spend the AST', async () => {
      emitted(await tokenDAI.approve(swapAddress, 10, { from: aliceAddress }), 'Approval')
    })

    it('Checks balances...', async () => {
      ok(balances(aliceAddress, [[tokenAST, 800], [tokenDAI, 50]]), 'Alice balances are incorrect')
      ok(balances(bobAddress, [[tokenAST, 200], [tokenDAI, 950]]), 'Bob balances are incorrect')
    })

    it('Bob approves Swap to spend his AST', async () => {
      emitted(await tokenAST.approve(swapAddress, 10, { from: bobAddress }), 'Approval')
    })

    it('Checks that Bob is unable to call swap with Alice through Transferable', async () => {
      none(await swapContract.swap(bobAddress, 10, tokenAST.address, aliceAddress, 10, tokenDAI.address, { from: bobAddress }), 'Transfer')
    })

    it('Checks that balances do not change post calling swap', async () => {
      ok(balances(aliceAddress, [[tokenAST, 80], [tokenDAI, 50]]), 'Alice balances are incorrect')
      ok(balances(bobAddress, [[tokenAST, 200], [tokenDAI, 950]]), 'Bob balances are incorrect')
    })
  })
})
