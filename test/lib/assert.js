const truffleAssert = require('truffle-assertions')

module.exports = {
  none: truffleAssert.eventNotEmitted,
  emitted: truffleAssert.eventEmitted,
  reverted: truffleAssert.reverts,
  equal: assert.equal,
  ok: assert.ok
}
