//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IERC721 {
    function transferFrom(address _from, address _to, uint256 _id) external;
}

contract Escrow {
    address public lender;
    address public inspector;
    address payable public seller;
    address public nftaddress;

    modifier onlyseller(){
        require(msg.sender == seller, "only seller can call the function");
        _;
    }

    modifier onlyBuyer(uint256 nftid){
        require(msg.sender == buyer[nftid],"Only buyer can do this");
        _;
    }

    modifier onlyInspector(){
        require(msg.sender == inspector,"Only Inspector can call this function");
        _;
    }

    mapping(uint256 => bool) public isListed;          // mapped with id of NFT and listing
    mapping(uint256 => uint256) public purchaseprice;  // mapped with id of NFT and purchase price
    mapping(uint256 => uint256) public escrowamount;   // mapped with id of NFT and ecrow price
    mapping(uint256 => address) public buyer;          // mapped with id of NFT and address of buyer
    mapping(uint256 => bool) public inspectionCheck;  // inspection check for NFT
    mapping(uint256 => mapping(address => bool)) public approval;
    constructor(
        address _nftaddress,
        address payable _seller,
        address _inspector,
        address _lender
    ) {
        lender = _lender;
        inspector = _inspector;
        nftaddress = _nftaddress;
        seller = _seller;
    }


    function list(uint256 nftid, uint256 purchasep, uint256 escrowa, address _buyer) public payable onlyseller {
       IERC721(nftaddress).transferFrom(msg.sender, address(this), nftid);

       isListed[nftid] = true;
       purchaseprice[nftid] = purchasep;
       escrowamount[nftid] = escrowa;
       buyer[nftid] = _buyer;
    }

    function depositEarnest(uint256 nftid) public payable onlyBuyer(nftid){
        require(msg.value >= escrowamount[nftid],"Value should be greater than escrow amount");

    }
    

    function updatesinspection(uint nftid,  bool status) public  onlyInspector {
        inspectionCheck[nftid] = status;

    }

    receive() external payable{
        
    }

    function getBalance() public view returns(uint256){
        return address(this).balance;
    }

    function approveSale(uint256 nftid) public {
        approval[nftid][msg.sender] = true;
    }

        // For Sale
        // rquire inspection status
        // require sale to be authorised
        // require funds to be correct amount
        // Transfer NFT to buyer
        // Transfer funds to seller

    function finaliseSale(uint256 nftid) public {
        
        require(inspectionCheck[nftid]=true,"Property must be inspected for Sale");
        require(approval[nftid][buyer[nftid]]);
        require(approval[nftid][seller]);
        require(approval[nftid][lender]);
        require(address(this).balance >= purchaseprice[nftid]);
         isListed[nftid] = false;
        (bool success, ) = payable(seller).call{value: address(this).balance}(
            ""
        );
       require(success);

       IERC721(nftaddress).transferFrom(address(this), buyer[nftid],nftid);

    }


}
