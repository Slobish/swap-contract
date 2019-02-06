const ethUtil = require('ethereumjs-util')
const sigUtil = require('eth-sig-util')
const types = require('./types')
const hashes = require('./hashes')

module.exports = {
  getPrivateKeySignature(order, privateKey, verifyingContract) {
    const orderHash = hashes.getOrderHash(order, verifyingContract)
    const orderHashBuff = ethUtil.toBuffer(orderHash)
    const { r, s, v } = ethUtil.ecsign(orderHashBuff, privateKey)
    return {
      r, s, v, prefixed: false,
    }
  },
  async getWeb3Signature(order, verifyingContract) {
    const orderHash = hashes.getOrderHash(order, verifyingContract)
    const orderHashHex = ethUtil.bufferToHex(orderHash)
    const sig = await web3.eth.sign(orderHashHex, order.maker.wallet)
    const { v, r, s } = ethUtil.fromRpcSig(sig)
    return {
      r, s, v, prefixed: true,
    }
  },
  getTypedDataSignature(order, privateKey, verifyingContract) {
    const sig = sigUtil.signTypedData(privateKey, {
      data: {
        types,
        domain: {
          name: 'AIRSWAP',
          version: '2',
          verifyingContract,
        },
        primaryType: 'Order',
        message: order,
      },
    }).substring(2)
    return {
      r: `0x${sig.substring(0, 64)}`,
      s: `0x${sig.substring(64, 128)}`,
      v: parseInt(sig.substring(128, 130), 16),
      prefixed: false,
    }
  },
}
