const { sign } = require('@aptos-labs/ts-sdk');
const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}


describe('Escrow', () => {
   

    let buyer,seller;
    let real,escrow;
    

    // deploy realestate 

     it('Saves the addresses', async() => {
        
        // assign addresses with derstructring
        
        [buyer,seller,inspector,lender]= await ethers.getSigners()
        

        const RealEstate = await ethers.getContractFactory('RealEstate')
        real = await RealEstate.deploy()

        console.log(real.address);

        // Mint function in ERC721 real  contract

     let transaction = await real.connect(seller).mint("https://ipfs.io/ipfs/QmTudSYeM7mz3PkYEWXWqPjomRPHogcMFSq7XAvsvsgAPS")
     
     await transaction.wait();

    // escrow contract deployment
     const Escrow = await ethers.getContractFactory('Escrow')
     escrow = await Escrow.deploy(
        real.address,
        seller.address,
        inspector.address,
        lender.address
     );

    
     // checking addresses is saved correctly or not
     const result = await escrow.nftaddress()
     expect(result).to.be.equal(real.address)

     const result1 = await escrow.seller()
     expect(result1).to.be.equal(seller.address)

     const result2 = await escrow.inspector()
     expect(result2).to.be.equal(inspector.address)

     const result3 = await escrow.lender()
     expect(result3).to.be.equal(lender.address)

    // approve
     transaction = await real.connect(seller).approve(escrow.address,1)  // ERC721 in-built funcion for approval
     await transaction.wait()

    // list property
    transaction = await escrow.connect(seller).list(1,tokens(10),tokens(5),buyer.address)
    await transaction.wait()

     })

     

    

    

 describe('Listing', () => {

    it("updates as listed", async() =>{
        const result = await escrow.isListed(1)
        expect(result).to.be.equal(true)

    })

    it('Returns buyer', async () => {
        const result = await escrow.buyer(1)
        expect(result).to.be.equal(buyer.address)
    })

    it('Returns purchase price', async () => {
        const result = await escrow.purchaseprice(1)
        expect(result).to.be.equal(tokens(10))
    })

    it('Returns escrow amount', async () => {
        const result = await escrow.escrowamount(1)
        expect(result).to.be.equal(tokens(5))
    })
    
    it("Updated ownership", async() =>{

        expect(await real.ownerOf(1)).to.be.equal(escrow.address)

    })
      })

    describe('Deposits',() =>{
        it("Updates contract balance", async() =>{
            const transaction = await escrow.connect(buyer).depositEarnest(1,{value:tokens(5)})
            await transaction.wait()
            const result = await escrow.getBalance()
            expect(result).to.be.equal(tokens(5))
        })
    })

    describe('Inspection',() =>{
        it('inspects the nft',async() =>{
           const transaction = await escrow.connect(inspector).updatesinspection(1,true)
           await transaction.wait()
           const result = await escrow.inspectionCheck(1)
           expect(result).to.be.equal(true)
            
        })
     
        
    })

    describe('Approval',() =>{
        it('approval for sale from lender',async()=>{
            const transaction = await escrow.connect(lender).approveSale(1)
            await transaction.wait()
            const result = await escrow.approval(1,lender.address)
            expect(result).to.be.equal(true)
        })

        it('approval for sale from inspector' , async() =>{
            const transaction = await escrow.connect(inspector).approveSale(1)
            await transaction.wait()
            const result = await escrow.approval(1,inspector.address)
            expect(result).to.be.equal(true)
        })

        it('approval for sale from seller' , async() =>{
            const transaction = await escrow.connect(seller).approveSale(1)
            await transaction.wait()
            const result = await escrow.approval(1,seller.address)
            expect(result).to.be.equal(true)
        })
    })



    describe('Finalise Sale',() =>{

       beforeEach(async() =>{
        let transaction = await escrow.connect(buyer).depositEarnest(1,{value:tokens(5)})
        await transaction.wait()

        transaction = await escrow.connect(inspector).updatesinspection(1,true)
        await transaction.wait()

        transaction = await escrow.connect(lender).approveSale(1)
        await transaction.wait()
        await lender.sendTransaction({to : escrow.address, value: tokens(5)})

        transaction = await escrow.connect(buyer).approveSale(1)
        await transaction.wait()

        transaction = await escrow.connect(seller).approveSale(1)
        await transaction.wait()

        transaction = await escrow.connect(seller).finaliseSale(1)
        await transaction.wait()
        
       })

       it('Updates Ownership', async() =>{

        expect(await real.ownerOf(1)).to.be.equal(buyer.address)
        expect(await escrow.getBalance()).to.be.equal(0)

       })

      
       
   
    })
})
