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
  generateId() {
    return Math.round(Math.random() * 10000)
  },
  generateExpiry() {
    return Math.round((new Date().getTime() + 60000) / 1000)
  },
  async getOrder({
    expiry = this.generateExpiry(),
    id = this.generateId(),
    signer = NULL_ADDRESS,
    maker = defaults.Party,
    taker = defaults.Party,
    affiliate = defaults.Party,
  }) {
    const order = {
      expiry,
      id,
      signer,
      maker: { ...defaults.Party, ...maker },
      taker: { ...defaults.Party, ...taker },
      affiliate: { ...defaults.Party, ...affiliate },
    }
    const wallet = signer !== NULL_ADDRESS ? signer : order.maker.wallet
    if (this._knownAccounts.indexOf(wallet) !== -1) {
      return {
        order,
        signature: await signatures.getWeb3Signature(
          order,
          wallet,
          this._verifyingContract,
        ),
      }
    }
    return { order }
  },
}
