const Swap = artifacts.require('./Swap.sol')
const FungibleA = artifacts.require('./tests/FungibleA.sol')
const FungibleB = artifacts.require('./tests/FungibleB.sol')
const NonFungibleA = artifacts.require('./tests/NonFungibleA.sol')
const NonFungibleB = artifacts.require('./tests/NonFungibleB.sol')

module.exports = (deployer) => {
  deployer.deploy(Swap)
  deployer.deploy(FungibleA)
  deployer.deploy(FungibleB)
  deployer.deploy(NonFungibleA)
  deployer.deploy(NonFungibleB)
}
