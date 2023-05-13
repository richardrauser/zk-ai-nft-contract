// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "erc721a/contracts/ERC721A.sol";
import "erc721a/contracts/extensions/ERC721AQueryable.sol";
import "./ERC2981/IERC2981Royalties.sol";
import "hardhat/console.sol";

contract AINFTGenerator is ERC721AQueryable, IERC2981Royalties, Ownable {
    mapping(uint => string) private _uris;
    uint256 private mintPrice = 0.00 ether;

    constructor() ERC721A("ZKAINFTGenerator", "AINFT") {}

    // Minting

    function getMintPrice() public view returns (uint256) {
        return mintPrice;
    }

    function setMintPrice(uint256 _mintPrice) public onlyOwner {
        mintPrice = _mintPrice;
    }

    function mint(string memory uri, uint nonce, bytes memory sig) public payable {        
        require(msg.value >= mintPrice, "Not enough ETH");
        require(isValidSig(keccak256(abi.encodePacked(uri, nonce)), sig), "Invalid signature");

        uint256 tokenId = _nextTokenId();
        _mint(msg.sender, 1);
        _uris[tokenId] = uri;
    }

    // Token URI
    
    function tokenURI(uint256 tokenId) public view virtual override(ERC721A, IERC721A) returns (string memory) {
        return _uris[tokenId];
    }

    function updateTokenURI(uint256 tokenId, string memory uri) public onlyOwner {
        _uris[tokenId] = uri;
    }

    // Payment

    function payOwner(uint256 amount) public onlyOwner {
        require(amount <= address(this).balance, "Amount too high");
        address payable owner = payable(owner());
        owner.transfer(amount);
    }

    // for OpenSea

    function contractURI() public pure returns (string memory) {
        return "https://zknft.ai/storefront-metadata.json";
    }

    // The following functions are overrides required by Solidity.

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721A, IERC721A, IERC2981Royalties)
        returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // Sig verification

    function isValidSig(bytes32 hashedMessage, bytes memory sig) public view returns(bool) {
        bytes memory prefix = "\x19Ethereum Signed Message:\n32";
        bytes32 prefixedHashedMessage = keccak256(abi.encodePacked(prefix, hashedMessage));
        console.logBytes(abi.encodePacked(prefixedHashedMessage));

        address signer = recoverSigner(prefixedHashedMessage, sig);

        return (signer == owner());
    }
    
    function recoverSigner(bytes32 message, bytes memory sig) public pure returns (address) {
        uint8 v;
        bytes32 r;
        bytes32 s;
        (r, s, v) = splitSignature(sig);
        return ecrecover(message, v, r, s);
    }

    function splitSignature(bytes memory sig) public pure returns (bytes32 r, bytes32 s, uint8 v) {
        require(sig.length == 65, "signature length must be 65");

        assembly {
            /*
            First 32 bytes stores the length of the signature

            add(sig, 32) = pointer of sig + 32
            effectively, skips first 32 bytes of signature

            mload(p) loads next 32 bytes starting at the memory address p into memory
            */

            // first 32 bytes, after the length prefix
            r := mload(add(sig, 32))
            // second 32 bytes
            s := mload(add(sig, 64))
            // final byte (first byte of the next 32 bytes)
            v := byte(0, mload(add(sig, 96)))
        }
        // implicitly return (r, s, v)
    }

    // Royalties

    function royaltyInfo(uint256, uint256 value)
        public
        view
        override
        returns (address receiver, uint256 royaltyAmount) {
        // 5% royalty
        return (owner(), (value * 500) / 10000);
    }

    // Strings

    function uintToString(uint _i) internal pure returns (string memory str) {
        unchecked {
            if (_i == 0) {
                return "0";
            }

            uint j = _i;
            uint length;
            while (j != 0) {
                length++;
                j /= 10;
            }

            bytes memory bstr = new bytes(length);
            uint k = length;
            j = _i;
            while (j != 0) {
                bstr[--k] = bytes1(uint8(48 + j % 10));
                j /= 10;
            }
            
            str = string(bstr);
        }
    }