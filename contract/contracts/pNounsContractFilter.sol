// SPDX-License-Identifier: MIT

/*
 * Created by Eiba (@eiba8884)
 */

pragma solidity ^0.8.6;

import "./libs/ProviderToken3.sol";
import "contract-allow-list/contracts/proxy/interface/IContractAllowListProxy.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";

contract pNounsContractFilter is ProviderToken3, AccessControlEnumerable {

    bytes32 public constant CONTRACT_ADMIN = keccak256("CONTRACT_ADMIN");
    // address public admin; // コントラクト管理者。オーナーか管理者がset系メソッドを実行可能

    IContractAllowListProxy public cal;
    uint256 public calLevel = 1;

    uint256 constant unixtime_20230101 = 1672498800;

    constructor(
        IAssetProvider _assetProvider,
        string memory _title,
        string memory _shortTitle,
        address[] memory _administrators
    ) ProviderToken3(_assetProvider, _title, _shortTitle) {
        _setRoleAdmin(CONTRACT_ADMIN, CONTRACT_ADMIN);

        for (uint256 i = 0; i < _administrators.length; i++) {
            _setupRole(CONTRACT_ADMIN, _administrators[i]);
        }
    }

    ////////// modifiers //////////
    modifier onlyAdminOrOwner() {
        require(
            owner() == _msgSender() || hasRole(CONTRACT_ADMIN, _msgSender()),
            "caller is not the admin"
        );
        _;
    }

    ////////// internal functions start //////////
    function hasAdminOrOwner() internal view returns (bool) {
        return owner() == _msgSender() || hasRole(CONTRACT_ADMIN, _msgSender());
    }

    ////////// onlyOwner functions start //////////
    function setAdminRole(address[] memory _administrators) external onlyOwner {
        for (uint256 i = 0; i < _administrators.length; i++) {
            _setupRole(CONTRACT_ADMIN, _administrators[i]);
        }
    }

    function revokeAdminRole(address[] memory _administrators)
        external
        onlyOwner
    {
        for (uint256 i = 0; i < _administrators.length; i++) {
            _revokeRole(CONTRACT_ADMIN, _administrators[i]);
        }
    }

    ////////////// CAL 関連 ////////////////
    function setCalContract(IContractAllowListProxy _cal)
        external
        onlyAdminOrOwner
    {
        cal = _cal;
    }

    function setCalLevel(uint256 _value) external onlyAdminOrOwner {
        calLevel = _value;
    }

    // overrides
    function setApprovalForAll(address operator, bool approved)
        public
        virtual
        override(ERC721WithOperatorFilter, IERC721A)
    {
        // 2023-01-01 までは販売を制限
        require(
            block.timestamp > unixtime_20230101,
            "cant sale on markets until 2023/1/1."
        );

        if (address(cal) != address(0)) {
            require(
                cal.isAllowed(operator, calLevel) == true,
                "address no list"
            );
        }
        ERC721WithOperatorFilter.setApprovalForAll(operator, approved);
    }

    function approve(address to, uint256 tokenId)
        public
        payable
        virtual
        override(ERC721WithOperatorFilter, IERC721A)
    {
        // 2023-01-01 までは販売を制限
        require(
            block.timestamp > unixtime_20230101,
            "cant sale on markets until 2023/1/1."
        );

        if (address(cal) != address(0)) {
            require(cal.isAllowed(to, calLevel) == true, "address no list");
        }
        ERC721WithOperatorFilter.approve(to, tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(AccessControlEnumerable, ERC721A, IERC721A)
        returns (bool)
    {
        return
            interfaceId == type(AccessControlEnumerable).interfaceId ||
            interfaceId == type(IERC721A).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
