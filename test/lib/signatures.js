const ethUtil = require('ethereumjs-util')
const sigUtil = require('eth-sig-util')
const { DOMAIN_NAME, DOMAIN_VERSION, types } = require('./constants')
const hashes = require('./hashes')

module.exports = {
  async getWeb3Signature(order, signer, verifyingContract) {
    const orderHash = hashes.getOrderHash(order, verifyingContract)
    const orderHashHex = ethUtil.bufferToHex(orderHash)
    const sig = await web3.eth.sign(orderHashHex, signer)
    const { v, r, s } = ethUtil.fromRpcSig(sig)
    return {
      version: '0x45', // Version 0x45: personal_sign
      v,
      r,
      s,
    }
  },
  getPrivateKeySignature(order, privateKey, verifyingContract) {
    const orderHash = hashes.getOrderHash(order, verifyingContract)
    const orderHashBuff = ethUtil.toBuffer(orderHash)
    const { r, s, v } = ethUtil.ecsign(orderHashBuff, privateKey)
    return {
      version: '0x01', // Version 0x01: signTypedData
      v,
      r,
      s,
    }
  },
  getTypedDataSignature(order, privateKey, verifyingContract) {
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
    })
    const { v, r, s } = ethUtil.fromRpcSig(sig)
    return {
      version: '0x01', // Version 0x01: signTypedData
      v,
      r,
      s,
    }
  },
  async getLegacySignature(order, signer, verifyingContract) {
    const msg = web3.utils.soliditySha3(
      // Version 0x00: Data with intended validator (verifyingContract)
      { type: 'bytes1', value: '0x0' },
      { type: 'address', value: verifyingContract },
      { type: 'address', value: order.maker.wallet },
      { type: 'uint256', value: order.maker.param },
      { type: 'address', value: order.maker.token },
      { type: 'address', value: order.taker.wallet },
      { type: 'uint256', value: order.taker.param },
      { type: 'address', value: order.taker.token },
      { type: 'uint256', value: order.expiry },
      { type: 'uint256', value: order.id },
    )
    const sig = await web3.eth.sign(ethUtil.bufferToHex(msg), signer)
    return ethUtil.fromRpcSig(sig)
  },
}
