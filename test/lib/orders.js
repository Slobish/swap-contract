const { defaults, NULL_ADDRESS } = require('./constants')

const signatures = require('./signatures')

function generateNonce() {
  return Math.round(Math.random() * 10000)
}

function generateExpiration() {
  return Math.round((new Date().getTime() + 60000) / 1000)
}

module.exports = {
  async getOrder({
    expiration = generateExpiration(),
    nonce = generateNonce(),
    signerAddress = NULL_ADDRESS,
    senderAddress = NULL_ADDRESS,
    maker = defaults.Party,
    taker = defaults.Party,
    partner = defaults.Party,
  }, signer, verifyingContract) {
    let signature
    const order = {
      expiration,
      nonce,
      signerAddress,
      senderAddress,
      maker: { ...defaults.Party, ...maker },
      taker: { ...defaults.Party, ...taker },
      partner: { ...defaults.Party, ...partner },
    }
    if (signer) {
      signature = await signatures.getWeb3Signature(order, signer, verifyingContract)
    }
    return { order, signature }
  },
}
