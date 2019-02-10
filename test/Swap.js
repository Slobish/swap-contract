const Swap = artifacts.require('Swap')
const AST = artifacts.require('FungibleA')
const DAI = artifacts.require('FungibleB')
const ConcertTicket = artifacts.require('NonFungibleA')
const Collectible = artifacts.require('NonFungibleB')

const truffleAssert = require('truffle-assertions')

const { NULL_ADDRESS } = require('./lib/constants.js')
const orders = require('./lib/orders.js')
const signatures = require('./lib/signatures.js')
const helpers = require('./lib/helpers.js')

contract('Swap', (accounts) => {
  const aliceAddress = accounts[0]
  const bobAddress = accounts[1]
  const carolAddress = accounts[2]

  let swapContract
  let swapAddress
  let tokenAST
  let tokenDAI
  let tokenTicket
  let tokenKitty

  describe('Deploying...', () => {
    it('Deployed Swap contract', async () => {
      swapContract = await Swap.deployed()
      swapAddress = swapContract.address
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
      truffleAssert.eventEmitted(await tokenAST.mint(aliceAddress, 1000), 'Transfer')
      assert.ok(helpers.balances(aliceAddress, [[tokenAST, 1000], [tokenDAI, 0]]), 'Alice balances are incorrect')
    })

    it('Mints 1000 DAI for Bob', async () => {
      truffleAssert.eventEmitted(await tokenDAI.mint(bobAddress, 1000), 'Transfer')
      assert.ok(helpers.balances(bobAddress, [[tokenAST, 0], [tokenDAI, 1000]]), 'Bob balances are incorrect')
    })
  })

  describe('Approving...', () => {
    it('Alice approves Swap to spend 200 AST', async () => {
      truffleAssert.eventEmitted(await tokenAST.approve(swapAddress, 200, { from: aliceAddress }), 'Approval')
    })

    it('Bob approves Swap to spend 9999 DAI', async () => {
      truffleAssert.eventEmitted(await tokenDAI.approve(swapAddress, 9999, { from: bobAddress }), 'Approval')
    })

    it('Checks approvals (Alice 250 AST and 0 DAI, Bob 0 AST and 500 DAI)', async () => {
      assert.ok(helpers.allowances(aliceAddress, swapAddress, [[tokenAST, 200], [tokenDAI, 0]]))
      assert.ok(helpers.allowances(bobAddress, swapAddress, [[tokenAST, 0], [tokenDAI, 500]]))
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
      }, aliceAddress, swapAddress)
      _order = order
      _signature = signature
    })

    it('Checks that Bob can fill an order from Alice (200 AST for 50 DAI)', async () => {
      const result = await swapContract.fill(_order, _signature, { from: bobAddress })
      truffleAssert.eventEmitted(result, 'Fill')
    })

    it('Checks new balances (Alice 800 AST and 50 DAI, Bob 200 AST and 950 DAI)', async () => {
      assert.ok(helpers.balances(aliceAddress, [[tokenAST, 800], [tokenDAI, 50]]), 'Alice balances are incorrect')
      assert.ok(helpers.balances(bobAddress, [[tokenAST, 200], [tokenDAI, 950]]), 'Bob balances are incorrect')
    })

    it('Checks that Bob cannot fill the same order again (200 AST for 50 DAI)', async () => {
      await truffleAssert.reverts(swapContract.fill(_order, _signature, { from: bobAddress }), 'ALREADY_FILLED')
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
      }, aliceAddress, swapAddress)
      await truffleAssert.reverts(swapContract.fill(order, signature, { from: bobAddress }), 'INSUFFICIENT_ALLOWANCE')
    })

    it('Checks that Bob cannot fill an expired order', async () => {
      const { order, signature } = await orders.getOrder({
        maker: {
          wallet: aliceAddress,
        },
        taker: {
          wallet: bobAddress,
        },
        expiration: 0,
      }, aliceAddress, swapAddress)
      await truffleAssert.reverts(swapContract.fill(order, signature, { from: bobAddress }), 'ORDER_EXPIRED')
    })

    it('Checks that an incorrect signature will revert', async () => {
      const { order, signature } = await orders.getOrder({
        maker: {
          wallet: aliceAddress,
        },
        taker: {
          wallet: bobAddress,
        },
      }, aliceAddress, NULL_ADDRESS)
      await truffleAssert.reverts(swapContract.fill(order, signature, { from: bobAddress }), 'INVALID_SIGNATURE')
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
      }, aliceAddress, swapAddress)
      await truffleAssert.reverts(swapContract.fill(order, signature, { from: bobAddress, value: 1 }), 'VALUE_MUST_BE_ZERO')
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
      await truffleAssert.reverts(swapContract.fill(order, signature, { from: aliceAddress }), 'INSUFFICIENT_BALANCE')
    })

    it('Checks existing balances (Alice 800 AST and 50 DAI, Bob 200 AST and 950 DAI)', async () => {
      assert.ok(helpers.balances(aliceAddress, [[tokenAST, 800], [tokenDAI, 50]]), 'Alice balances are incorrect')
      assert.ok(helpers.balances(bobAddress, [[tokenAST, 200], [tokenDAI, 950]]), 'Bob balances are incorrect')
    })

    it('Checks that Carol cannot send an order where Bob is the sender', async () => {
      const { order, signature } = await orders.getOrder({
        senderAddress: bobAddress,
        maker: {
          wallet: aliceAddress,
        },
      }, aliceAddress, swapAddress)
      await truffleAssert.reverts(swapContract.fill(order, signature, { from: carolAddress }), 'SENDER_NOT_AUTHORIZED')
    })

    it('Checks that Carol cannot send an order where Bob is the sender', async () => {
      const { order, signature } = await orders.getOrder({
        maker: {
          wallet: aliceAddress,
        },
      }, aliceAddress, swapAddress)
      await truffleAssert.reverts(swapContract.fill(order, signature, { from: carolAddress }), 'TAKER_MUST_BE_SENDER')
    })

    it('Alice approves Swap to spend another 50 AST', async () => {
      truffleAssert.eventEmitted(await tokenAST.approve(swapAddress, 50, { from: aliceAddress }), 'Approval')
    })
  })

  describe('Signer Delegation (Maker)', () => {
    it('Alice authorizes Carol to sign orders on her behalf', async () => {
      const expiration = Math.round((new Date().getTime() + 60000) / 1000)
      truffleAssert.eventEmitted(await swapContract.authorize(carolAddress, expiration, { from: aliceAddress }), 'Authorization')
    })

    it('Alice approves Swap to spend another 50 AST', async () => {
      truffleAssert.eventEmitted(await tokenAST.approve(swapAddress, 50, { from: aliceAddress }), 'Approval')
    })

    it('Checks that Carol can sign orders on behalf of Alice', async () => {
      const { order, signature } = await orders.getOrder({
        signerAddress: carolAddress,
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
      }, carolAddress, swapAddress)
      truffleAssert.eventEmitted(await swapContract.fill(order, signature, { from: bobAddress }), 'Fill')
    })

    it('Alice revokes signing authorization from Carol', async () => {
      truffleAssert.eventEmitted(await swapContract.revoke(carolAddress, { from: aliceAddress }), 'Revocation')
    })

    it('Checks that Carol can no longer sign orders on behalf of Alice', async () => {
      const { order, signature } = await orders.getOrder({
        signerAddress: carolAddress,
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
      }, carolAddress, swapAddress)
      await truffleAssert.reverts(swapContract.fill(order, signature, { from: bobAddress }), 'SIGNER_NOT_AUTHORIZED')
    })
  })

  describe('Sender Delegation (Taker)', () => {
    it('Bob approves Carol to take orders on his behalf', async () => {
      const expiration = Math.round((new Date().getTime() + 60000) / 1000)
      truffleAssert.eventEmitted(await swapContract.authorize(carolAddress, expiration, { from: bobAddress }), 'Authorization')
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
      }, aliceAddress, swapAddress)
      _order = order
      _signature = signature
    })

    it('Checks that Alice is able to cancel order with nonce "12345"', async () => {
      truffleAssert.eventEmitted(await swapContract.cancel([_order.nonce], { from: aliceAddress }), 'Cancel')
    })

    it('Checks that Alice is unable to cancel the same order twice', async () => {
      truffleAssert.eventNotEmitted(await swapContract.cancel([_order.nonce], { from: aliceAddress }), 'Cancel')
    })

    it('Checks that Bob is unable to fill the order with nonce "12345"', async () => {
      await truffleAssert.reverts(swapContract.fill(_order, _signature, { from: bobAddress }), 'ALREADY_FILLED')
    })

    it('Checks existing balances (Alice 800 AST and 50 DAI, Bob 200 AST and 950 DAI)', async () => {
      assert.ok(helpers.balances(aliceAddress, [[tokenAST, 800], [tokenDAI, 50]]), 'Alice balances are incorrect')
      assert.ok(helpers.balances(bobAddress, [[tokenAST, 200], [tokenDAI, 950]]), 'Bob balances are incorrect')
    })
  })

  describe('Fills with Ether', () => {
    const value = 1

    it('Alice approves Swap to spend another 200 AST', async () => {
      truffleAssert.eventEmitted(await tokenAST.approve(swapAddress, 200, { from: aliceAddress }), 'Approval')
    })

    it('Checks allowance (Alice 200 AST)', async () => {
      assert.equal((await tokenAST.allowance(aliceAddress, swapAddress)).toNumber(), 200, 'Alice has not approved 200 AST')
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
      }, aliceAddress, swapAddress)
      await truffleAssert.reverts(swapContract.fill(order, signature, { from: bobAddress }), 'VALUE_MUST_BE_SENT')
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
      }, aliceAddress, swapAddress)
      truffleAssert.eventEmitted(await swapContract.fill(order, signature, { from: bobAddress, value }), 'Fill')
    })

    it('Ensures that Swap has not kept any of the ether', async () => {
      assert.equal(await web3.eth.getBalance(swapAddress), 0, 'Swap contract took ether from the trade')
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
      }, aliceAddress, swapAddress)
      await truffleAssert.reverts(swapContract.fill(order, signature, { from: bobAddress, value }), 'VALUE_MUST_BE_ZERO')
    })

    it('Checks new balances (Alice 550 AST and 60 DAI, Bob 450 AST and 940 DAI)', async () => {
      assert.ok(await helpers.balances(aliceAddress, [[tokenAST, 550], [tokenDAI, 60]]), 'Alice balances are incorrect')
      assert.ok(await helpers.balances(bobAddress, [[tokenAST, 450], [tokenDAI, 940]]), 'Bob balances are incorrect')
    })
  })

  describe('Fills with Fees', () => {
    it('Alice approves Swap to spend another 250 AST', async () => {
      truffleAssert.eventEmitted(await tokenAST.approve(swapAddress, 250, { from: aliceAddress }), 'Approval')
    })

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
        partner: {
          wallet: carolAddress,
          token: tokenAST.address,
          param: 50,
        },
      }, aliceAddress, swapAddress)
      truffleAssert.eventEmitted(await swapContract.fill(order, signature, { from: bobAddress }), 'Fill')
    })

    it('Checks new balances (Alice 350 AST and 100 DAI, Bob 600 AST and 900 DAI)', async () => {
      assert.ok(await helpers.balances(aliceAddress, [[tokenAST, 300], [tokenDAI, 110]]), 'Alice balances are incorrect')
      assert.ok(await helpers.balances(bobAddress, [[tokenAST, 650], [tokenDAI, 890]]), 'Bob balances are incorrect')
      assert.ok(await helpers.balances(carolAddress, [[tokenAST, 50], [tokenDAI, 0]]), 'Carol balances are incorrect')
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
      truffleAssert.eventEmitted(await tokenTicket.mint(aliceAddress, 12345), 'Transfer')
      assert.ok(helpers.balances(aliceAddress, [[tokenTicket, 1]]), 'Alice balances are incorrect')
    })

    it('Mints a kitty collectible (#54321) for Bob', async () => {
      truffleAssert.eventEmitted(await tokenKitty.mint(bobAddress, 54321), 'Transfer')
      assert.ok(helpers.balances(bobAddress, [[tokenKitty, 1]]), 'Bob balances are incorrect')
    })
  })

  describe('Fills (Non-Fungible)', () => {
    it('Alice approves Swap to transfer her concert ticket', async () => {
      truffleAssert.eventEmitted(await tokenTicket.approve(swapAddress, 12345, { from: aliceAddress }), 'Approval')
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
      }, aliceAddress, swapAddress)
      truffleAssert.eventEmitted(await swapContract.fill(order, signature, { from: bobAddress }), 'Fill')
    })

    it('Bob approves Swap to transfer his kitty collectible', async () => {
      truffleAssert.eventEmitted(await tokenKitty.approve(swapAddress, 54321, { from: bobAddress }), 'Approval')
    })

    it('Alice approves Swap to spend another 100 AST', async () => {
      truffleAssert.eventEmitted(await tokenAST.approve(swapAddress, 100, { from: aliceAddress }), 'Approval')
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
      }, aliceAddress, swapAddress)
      truffleAssert.eventEmitted(await swapContract.fill(order, signature, { from: bobAddress }), 'Fill')
    })

    it('Checks new balances (Alice 0 ticket, 1 kitty, 200 DAI; Bob 1 ticket, 0 kitty, 790 DAI)', async () => {
      assert.ok(await helpers.balances(aliceAddress, [[tokenTicket, 0], [tokenKitty, 1], [tokenDAI, 210]]), 'Alice balances are incorrect')
      assert.ok(await helpers.balances(bobAddress, [[tokenTicket, 1], [tokenKitty, 0], [tokenDAI, 790]]), 'Bob balances are incorrect')
      assert.ok(await helpers.balances(carolAddress, [[tokenKitty, 0]]), 'Carol balances are incorrect')
    })

    it('Alice approves Swap to transfer her kitty collectible', async () => {
      truffleAssert.eventEmitted(await tokenKitty.approve(swapAddress, 54321, { from: aliceAddress }), 'Approval')
    })

    it('Alice approves Swap to spend another 100 AST', async () => {
      truffleAssert.eventEmitted(await tokenAST.approve(swapAddress, 100, { from: aliceAddress }), 'Approval')
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
        partner: {
          wallet: carolAddress,
          token: tokenKitty.address,
          param: 54321,
        },
      }, aliceAddress, swapAddress)
      truffleAssert.eventEmitted(await swapContract.fill(order, signature, { from: bobAddress }), 'Fill')
    })
  })

  describe('Signatures', () => {
    const davidAddress = '0x9d2fB0BCC90C6F3Fa3a98D2C760623a4F6Ee59b4'
    const davidPrivKey = Buffer.from('4934d4ff925f39f91e3729fbce52ef12f25fdf93e014e291350f7d314c1a096b', 'hex')

    it('Checks that a private key signature is valid', async () => {
      const { order } = await orders.getOrder(
        {
          maker: {
            wallet: davidAddress,
            token: tokenAST.address,
            param: 0,
          },
          taker: {
            wallet: aliceAddress,
            token: tokenDAI.address,
            param: 0,
          },
        },
      )
      const signature = signatures.getPrivateKeySignature(order, davidPrivKey, swapAddress)
      truffleAssert.eventEmitted(await swapContract.fill(order, signature, { from: aliceAddress }), 'Fill')
    })
    it('Checks that a typed data (EIP712) signature is valid', async () => {
      const { order } = await orders.getOrder(
        {
          maker: {
            wallet: davidAddress,
            token: tokenAST.address,
            param: 0,
          },
          taker: {
            wallet: aliceAddress,
            token: tokenDAI.address,
            param: 0,
          },
        },
      )
      const signature = signatures.getTypedDataSignature(order, davidPrivKey, swapAddress)
      truffleAssert.eventEmitted(await swapContract.fill(order, signature, { from: aliceAddress }), 'Fill')
    })
  })
})
