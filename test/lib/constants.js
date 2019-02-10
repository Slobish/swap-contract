module.exports = {
  NULL_ADDRESS: '0x0000000000000000000000000000000000000000',
  DOMAIN_NAME: 'AIRSWAP',
  DOMAIN_VERSION: '2',
  types: {
    EIP712Domain: [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'verifyingContract', type: 'address' },
    ],
    Order: [
      { name: 'expiration', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'signerAddress', type: 'address' },
      { name: 'senderAddress', type: 'address' },
      { name: 'maker', type: 'Party' },
      { name: 'taker', type: 'Party' },
      { name: 'partner', type: 'Party' },
    ],
    Party: [
      { name: 'wallet', type: 'address' },
      { name: 'token', type: 'address' },
      { name: 'param', type: 'uint256' },
    ],
  },
  defaults: {
    Party: {
      wallet: '0x0000000000000000000000000000000000000000',
      token: '0x0000000000000000000000000000000000000000',
      param: 0,
    },
  },
}
