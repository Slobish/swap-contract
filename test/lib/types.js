module.exports = {
  EIP712Domain: [
    { name: 'name', type: 'string' },
    { name: 'version', type: 'string' },
    { name: 'verifyingContract', type: 'address' },
  ],
  Order: [
    { name: 'expiration', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'sender', type: 'address' },
    { name: 'maker', type: 'Party' },
    { name: 'taker', type: 'Party' },
    { name: 'partner', type: 'Party' },
  ],
  Party: [
    { name: 'wallet', type: 'address' },
    { name: 'token', type: 'address' },
    { name: 'param', type: 'uint256' },
  ],
}
