module.exports = {
  async getLatestTimestamp() {
    return (await web3.eth.getBlock('latest')).timestamp
  },

  async allowances(account, withdrawer, allowances) {
    let index = allowances.length
    while (index--) {
      if ((await allowances[index][0].allowance(account, withdrawer)).toNumber() !== allowances[index][1]) {
        return false
      }
    }
    return true
  },

  async balances(account, balances) {
    let index = balances.length
    while (index--) {
      if ((await balances[index][0].balanceOf(account)).toNumber() !== balances[index][1]) {
        return false
      }
    }
    return true
  },
}
