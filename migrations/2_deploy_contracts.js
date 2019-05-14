const AtomicSwap = artifacts.require('./AtomicSwap.sol')
const FungibleA = artifacts.require('./test/FungibleA.sol')
const FungibleB = artifacts.require('./test/FungibleB.sol')
const NonFungibleA = artifacts.require('./test/NonFungibleA.sol')
const NonFungibleB = artifacts.require('./test/NonFungibleB.sol')

module.exports = (deployer) => {
  deployer.deploy(AtomicSwap)
  deployer.deploy(FungibleA)
  deployer.deploy(FungibleB)
  deployer.deploy(NonFungibleA)
  deployer.deploy(NonFungibleB)
}
