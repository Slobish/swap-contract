const NULL_ADDRESS = '0x0000000000000000000000000000000000000000'

const Party = {
  wallet: NULL_ADDRESS,
  token: NULL_ADDRESS,
  param: 0,
}

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
    maker = Party,
    taker = Party,
    partner = Party,
  }) {
    return {
      expiration,
      nonce,
      sender,
      maker: { ...Party, ...maker },
      taker: { ...Party, ...taker },
      partner: { ...Party, ...partner },
    }
  },
}
