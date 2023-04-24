// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "erc721a/contracts/extensions/ERC721AQueryable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "erc721a/contracts/ERC721A.sol";
import "./ERC2981/ERC2981Royalties.sol";
import "hardhat/console.sol";

contract AINFTGenerator is ERC721AQueryable, ERC2981Royalties, Ownable {
    mapping(uint => string) private _names;
    mapping(uint => string) private _urls;

    constructor() ERC721A("ZKAINFTGenerator", "AINFT") {}

    function mint(string calldata name, string calldata url, uint nonce, bytes memory sig) public payable {        
        bytes32 hashedMessage = keccak256(abi.encodePacked(name, url, nonce));
        require(isValidData(hashedMessage, sig), "Invalid signature");

        uint256 tokenId = _nextTokenId();
        _mint(msg.sender, 1);
        _names[tokenId] = name;
        _urls[tokenId] = url;
    }

    function tokenURI(uint256 tokenId) public view virtual override(ERC721A, IERC721A) returns (string memory) {
        return string(abi.encodePacked(
            '{"name": "', _names[tokenId], '", '
            '"description": "AI-generated NFTs on the zkSync Era blockchain. https://zknft.ai",',
            '"image": "', _urls[tokenId], '"}'
        ));
    }

    // for OpenSea
    function contractURI() public pure returns (string memory) {
        return "https://zknft.ai/storefront-metadata.json";
    }

    // The following functions are overrides required by Solidity.

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721A, IERC721A, ERC2981Royalties)
        returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // Sig verification

    function isValidData(bytes32 hashedMessage, bytes memory sig) public view returns(bool) {
        bytes memory prefix = "\x19Ethereum Signed Message:\n32";
        bytes32 prefixedHashedMessage = keccak256(abi.encodePacked(prefix, hashedMessage));
        console.log("PREFIXED HASHED MESSAGE SOLIDITY");
        console.logBytes(abi.encodePacked(prefixedHashedMessage));

        address signer = recoverSigner(prefixedHashedMessage, sig);

        console.log("RECOVERED SIGNER:");
        console.log(signer);
        console.log("OWNER");
        console.log(owner());

        return (signer == owner());

    }
    function recoverSigner(bytes32 message, bytes memory sig) public pure returns (address) {
        uint8 v;
        bytes32 r;
        bytes32 s;
        (r, s, v) = splitSignature(sig);
        return ecrecover(message, v, r, s);
    }
    // function splitSignature(bytes memory sig) public pure returns (uint8, bytes32, bytes32) {
    //     require(sig.length == 65, "signature length must be 65");
    //     bytes32 r;
    //     bytes32 s;
    //     uint8 v;
    //     assembly {
    //         // first 32 bytes, after the length prefix
    //         r := mload(add(sig, 32))
    //         // second 32 bytes
    //         s := mload(add(sig, 64))
    //         // final byte (first byte of the next 32 bytes)
    //         v := byte(0, mload(add(sig, 96)))
    //     }

    //     return (v, r, s);
    // }

    function splitSignature(
        bytes memory sig
    ) public pure returns (bytes32 r, bytes32 s, uint8 v) {
        require(sig.length == 65, "invalid signature length");

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


}