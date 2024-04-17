// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

async function main() {

   // assign addresses with derstructring
        
   [buyer,seller,inspector,lender]= await ethers.getSigners()

   // Deply RealEstate
   const RealEstate = await ethers.getContractFactory('RealEstate')  // it take contract from Contracts folder with name 'RealEstate'
   const real = await RealEstate.deploy()
   await real.deployed()

   console.log(`Deployed realestate contract address ${real.address}`)
   console.log("Minting NFTS \n")

   for(i=0;i<3;i++){
    const transaction = await real.connect(seller).mint(`https://ipfs.io/ipfs/QmQVcpsjrA6cr1iJjZAodYwmPekYgbnXGo4DFubJiLc2EB/${i + 1}.json`)
    await transaction.wait()
   }

   // escrow contract deployment
   const Escrow = await ethers.getContractFactory('Escrow') // it take contract from Contracts folder with name 'Escrow'
   escrow = await Escrow.deploy(
      real.address,
      seller.address,
      inspector.address,
      lender.address
   );

   await escrow.deployed()
   console.log(`Deployed Escrow contract address ${escrow.address}`)
 

   // approving the properties
   for(let i=0;i<3;i++){
    transaction = await real.connect(seller).approve(escrow.address,i+1)
    await transaction.wait()
   }

   transaction = await escrow.connect(seller).list(1,tokens(10),tokens(5),buyer.address)
    await transaction.wait()

   transaction = await escrow.connect(seller).list(2,tokens(20),tokens(5),buyer.address)
    await transaction.wait()

   transaction = await escrow.connect(seller).list(3,tokens(30),tokens(5),buyer.address)
    await transaction.wait()

    console.log('Finished')
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
