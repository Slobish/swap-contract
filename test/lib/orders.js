const { defaults, NULL_ADDRESS } = require('./constants')

const signatures = require('./signatures')

module.exports = {
  _knownAccounts: [],
  _verifyingContract: NULL_ADDRESS,
  setKnownAccounts(knownAccounts) {
    this._knownAccounts = knownAccounts
  },
  setVerifyingContract(verifyingContract) {
    this._verifyingContract = verifyingContract
  },
  generateNonce() {
    return Math.round(Math.random() * 10000)
  },
  generateExpiry() {
    return Math.round((new Date().getTime() + 60000) / 1000)
  },
  async getOrder({
    expiry = this.generateExpiry(),
    nonce = this.generateNonce(),
    signer = NULL_ADDRESS,
    maker = defaults.Party,
    taker = defaults.Party,
    partner = defaults.Party,
  }) {
    let signature
    const order = {
      expiry,
      nonce,
      signer,
      maker: { ...defaults.Party, ...maker },
      taker: { ...defaults.Party, ...taker },
      partner: { ...defaults.Party, ...partner },
    }
    if (signer === NULL_ADDRESS) {
      signer = order.maker.wallet
    }
    if (this._knownAccounts.indexOf(signer) !== -1) {
      signature = await signatures.getWeb3Signature(order, signer, this._verifyingContract)
    }
    return { order, signature }
  },
}
