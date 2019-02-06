const { defaults, NULL_ADDRESS } = require('./constants')

function generateNonce() {
  return Math.round(Math.random() * 10000)
}

function generateExpiration() {
  return Math.round((new Date().getTime() + 60000) / 1000)
}

module.exports = {
  getOrder({
    expiration = generateExpiration(),
    nonce = generateNonce(),
    sender = NULL_ADDRESS,
    maker = defaults.Party,
    taker = defaults.Party,
    partner = defaults.Party,
  }) {
    return {
      expiration,
      nonce,
      sender,
      maker: { ...defaults.Party, ...maker },
      taker: { ...defaults.Party, ...taker },
      partner: { ...defaults.Party, ...partner },
    }
  },
}
