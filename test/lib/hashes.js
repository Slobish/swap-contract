const ethUtil = require('ethereumjs-util')
const abi = require('ethereumjs-abi')
const types = require('./types')

function stringify(type) {
  let str = `${type}(`
  const keys = Object.keys(types[type])
  for (let i = 0; i < keys.length; i++) {
    str += `${types[type][i].type} ${types[type][i].name}`
    if (i !== keys.length - 1) {
      str += ','
    }
  }
  return `${str})`
}

const EIP712_DOMAIN_TYPEHASH = web3.utils.soliditySha3(stringify('EIP712Domain'))
const ORDER_TYPEHASH = web3.utils.soliditySha3(stringify('Order') + stringify('Party'))
const PARTY_TYPEHASH = web3.utils.soliditySha3(stringify('Party'))

function hashParty(party) {
  return ethUtil.keccak256(abi.rawEncode(
    ['bytes32', 'address', 'address', 'uint256'],
    [PARTY_TYPEHASH, party.wallet, party.token, party.param],
  ))
}

module.exports = {
  getOrderHash(order, verifyingContract) {
    const DOMAIN_SEPARATOR = ethUtil.keccak256(abi.rawEncode(
      ['bytes32', 'bytes32', 'bytes32', 'address'],
      [
        EIP712_DOMAIN_TYPEHASH,
        ethUtil.keccak256('AIRSWAP'),
        ethUtil.keccak256('2'),
        verifyingContract,
      ],
    ))

    const ORDER_HASH = ethUtil.keccak256(abi.rawEncode(
      ['bytes32', 'uint256', 'uint256', 'address', 'bytes32', 'bytes32', 'bytes32'],
      [
        ORDER_TYPEHASH,
        order.expiration,
        order.nonce,
        order.sender,
        hashParty(order.maker),
        hashParty(order.taker),
        hashParty(order.partner),
      ],
    ))

    return ethUtil.keccak256(
      Buffer.concat([
        Buffer.from('1901', 'hex'),
        Buffer.from(DOMAIN_SEPARATOR, 'hex'),
        ORDER_HASH,
      ]),
    )
  },
}
