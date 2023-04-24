// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "erc721a/contracts/extensions/ERC721AQueryable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "erc721a/contracts/ERC721A.sol";
import "./ERC2981/ERC2981Royalties.sol";

contract AINFTGenerator is ERC721AQueryable, ERC2981Royalties, Pausable, Ownable {
    mapping(uint => string) private _names;
    mapping(uint => string) private _urls;

    constructor() ERC721("AINFTGenerator", "AINFT") {}

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function mint(uint24 _seed) public payable {
        uint256 tokenID = _nextTokenId();
        _mint(msg.sender, 1);
        _names[tokenId] = name;
        _urls[tokenId] = url;
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        return string(abi.encodePacked(
            '{"name": "', _names[tokenId], '", '
            '"description": "AI-generated NFTs on the zkSync Era blockchain. https://zknft.ai",',
            '"image": "', _urls[tokenId], '"}'
        ));
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize)
        internal
        whenNotPaused
        override(ERC721, ERC721A)
    {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
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
}