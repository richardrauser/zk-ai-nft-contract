// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract ChatGPTGenerator is ERC721Enumerable {
    using Strings for uint256;
    string private _baseTokenURI;
    mapping(uint => string) private _names;
    mapping(uint => string) private _urls;

    constructor(string memory baseTokenURI_) ERC721("ChatGPTGenerator", "AINFT") {
        _baseTokenURI = baseTokenURI_;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");

        string memory baseURI = _baseURI();
        return bytes(baseURI).length > 0 ? string(abi.encodePacked(baseURI, tokenId.toString())) : '';
    }

    function mint(string memory name, string memory url) public {
        uint256 newItemId = totalSupply() + 1;
        _mint(msg.sender, newItemId);
        _setTokenName(newItemId, name);
        _setTokenUrl(newItemId, url);
    }

    function _setTokenName(uint256 tokenId, string memory name) internal {
        _names[tokenId] = name;
    }

    function _getTokenName(uint256 tokenId) internal view returns (string memory) {
        return _names[tokenId];
    }

    function _setTokenUrl(uint256 tokenId, string memory url) internal {
        _urls[tokenId] = url;
    }

    function _getTokenUrl(uint256 tokenId) internal view returns (string memory) {
        return _urls[tokenId];
    }
}
