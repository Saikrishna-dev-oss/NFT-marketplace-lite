// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";

/**
 * @title NFTMarketplace
 * @dev A production-ready NFT marketplace supporting ETH, USDC, and USDT payments
 * @author Your Name
 * @notice This contract allows users to mint, list, buy, and resell NFTs with multiple payment options
 */
contract NFTMarketplace is 
    ERC721URIStorage, 
    ReentrancyGuard, 
    Pausable, 
    Ownable,
    IERC2981 
{
    using SafeERC20 for IERC20;
    using Address for address payable;

    // State variables for counters (replacing Counters library)
    uint256 private _tokenIds;
    uint256 private _itemsSold;

    // Constants
    uint256 public constant MAX_ROYALTY_PERCENTAGE = 1000; // 10%
    uint256 public constant PERCENTAGE_BASE = 10000; // 100%
    uint256 public constant MAX_LISTING_PRICE = 1 ether;

    uint256 public listingPrice = 0.001 ether;
    uint256 public platformFeePercentage = 250; // 2.5%
    
    // Supported payment tokens
    IERC20 public immutable USDC;
    IERC20 public immutable USDT;
    
    // Token addresses for validation
    address public immutable usdcAddress;
    address public immutable usdtAddress;

    // Fee collection
    address public feeRecipient;
    
    // Emergency controls
    bool public emergencyWithdrawEnabled = false;
    uint256 public constant EMERGENCY_WITHDRAW_DELAY = 7 days;
    uint256 public emergencyWithdrawTimestamp;

    enum PaymentToken {
        ETH,
        USDC,
        USDT
    }

    struct MarketItem {
        uint256 tokenId;
        address payable seller;
        address payable owner;
        uint256 ethPrice;
        uint256 usdcPrice;
        uint256 usdtPrice;
        bool sold;
        uint256 listedAt;
        uint256 royaltyPercentage; // in basis points (10000 = 100%)
        address royaltyRecipient;
    }

    struct TokenPrices {
        uint256 ethPrice;
        uint256 usdcPrice;
        uint256 usdtPrice;
    }

    // Mappings
    mapping(uint256 => MarketItem) private idToMarketItem;
    mapping(address => bool) public blacklistedUsers;
    mapping(uint256 => bool) public blacklistedTokens;
    
    // Fee structure for different tokens (in basis points)
    mapping(PaymentToken => uint256) public tokenListingFees;

    // Events
    event MarketItemCreated(
        uint256 indexed tokenId,
        address indexed seller,
        address indexed owner,
        uint256 ethPrice,
        uint256 usdcPrice,
        uint256 usdtPrice,
        uint256 royaltyPercentage,
        address royaltyRecipient,
        uint256 timestamp
    );

    event MarketItemSold(
        uint256 indexed tokenId,
        address indexed seller,
        address indexed buyer,
        uint256 price,
        PaymentToken paymentToken,
        uint256 platformFee,
        uint256 royaltyFee,
        uint256 timestamp
    );

    event ListingPriceUpdated(uint256 oldPrice, uint256 newPrice);
    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    event FeeRecipientUpdated(address oldRecipient, address newRecipient);
    event UserBlacklisted(address indexed user, bool blacklisted);
    event TokenBlacklisted(uint256 indexed tokenId, bool blacklisted);
    event PricesUpdated(uint256 indexed tokenId, uint256 ethPrice, uint256 usdcPrice, uint256 usdtPrice);
    event EmergencyWithdrawInitiated(uint256 timestamp);
    event EmergencyWithdrawExecuted(address token, uint256 amount);

    // Custom errors
    error InvalidPrice();
    error InvalidListingPrice();
    error InvalidPlatformFee();
    error InvalidRoyaltyPercentage();
    error InsufficientPayment();
    error TokenNotForSale();
    error NotTokenOwner();
    error NotItemOwner();
    error BlacklistedUser();
    error BlacklistedToken();
    error InvalidPaymentToken();
    error TokenTransferFailed();
    error EmergencyWithdrawNotReady();
    error InvalidAddress();
    error ContractPaused();

    // Modifiers
    modifier validTokenId(uint256 tokenId) {
        require(tokenId > 0 && tokenId <= _tokenIds, "Token does not exist");
        _;
    }

    modifier notBlacklisted() {
        if (blacklistedUsers[msg.sender]) revert BlacklistedUser();
        _;
    }

    modifier tokenNotBlacklisted(uint256 tokenId) {
        if (blacklistedTokens[tokenId]) revert BlacklistedToken();
        _;
    }

    modifier validAddress(address addr) {
        if (addr == address(0)) revert InvalidAddress();
        _;
    }

    constructor(
        address _usdcAddress,
        address _usdtAddress,
        address _feeRecipient,
        string memory _name,
        string memory _symbol
    ) ERC721(_name, _symbol) Ownable(msg.sender) {
        if (_usdcAddress == address(0) || _usdtAddress == address(0)) revert InvalidAddress();
        if (_feeRecipient == address(0)) revert InvalidAddress();

        usdcAddress = _usdcAddress;
        usdtAddress = _usdtAddress;
        USDC = IERC20(_usdcAddress);
        USDT = IERC20(_usdtAddress);
        feeRecipient = _feeRecipient;

        // Set default listing fees (in wei/token units)
        tokenListingFees[PaymentToken.ETH] = 0.001 ether;
        tokenListingFees[PaymentToken.USDC] = 1 * 10**6; // 1 USDC
        tokenListingFees[PaymentToken.USDT] = 1 * 10**6; // 1 USDT
    }

    // Admin functions
    function updateListingPrice(uint256 _listingPrice) 
        external 
        onlyOwner 
    {
        if (_listingPrice > MAX_LISTING_PRICE) revert InvalidListingPrice();
        uint256 oldPrice = listingPrice;
        listingPrice = _listingPrice;
        emit ListingPriceUpdated(oldPrice, _listingPrice);
    }

    function updatePlatformFee(uint256 _platformFeePercentage) 
        external 
        onlyOwner 
    {
        if (_platformFeePercentage > 1000) revert InvalidPlatformFee(); // Max 10%
        uint256 oldFee = platformFeePercentage;
        platformFeePercentage = _platformFeePercentage;
        emit PlatformFeeUpdated(oldFee, _platformFeePercentage);
    }

    function updateFeeRecipient(address _feeRecipient) 
        external 
        onlyOwner 
        validAddress(_feeRecipient)
    {
        address oldRecipient = feeRecipient;
        feeRecipient = _feeRecipient;
        emit FeeRecipientUpdated(oldRecipient, _feeRecipient);
    }

    function updateTokenListingFee(PaymentToken token, uint256 fee) 
        external 
        onlyOwner 
    {
        tokenListingFees[token] = fee;
    }

    function setUserBlacklisted(address user, bool blacklisted) 
        external 
        onlyOwner 
        validAddress(user)
    {
        blacklistedUsers[user] = blacklisted;
        emit UserBlacklisted(user, blacklisted);
    }

    function setTokenBlacklisted(uint256 tokenId, bool blacklisted) 
        external 
        onlyOwner 
        validTokenId(tokenId)
    {
        blacklistedTokens[tokenId] = blacklisted;
        emit TokenBlacklisted(tokenId, blacklisted);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function initiateEmergencyWithdraw() external onlyOwner {
        emergencyWithdrawTimestamp = block.timestamp + EMERGENCY_WITHDRAW_DELAY;
        emergencyWithdrawEnabled = true;
        emit EmergencyWithdrawInitiated(emergencyWithdrawTimestamp);
    }

    function cancelEmergencyWithdraw() external onlyOwner {
        emergencyWithdrawEnabled = false;
        emergencyWithdrawTimestamp = 0;
    }

    // View functions
    function getListingPrice() external view returns (uint256) {
        return listingPrice;
    }

    function getTokenListingFee(PaymentToken token) external view returns (uint256) {
        return tokenListingFees[token];
    }

    function getMarketItem(uint256 tokenId) 
        external 
        view 
        validTokenId(tokenId)
        returns (MarketItem memory) 
    {
        return idToMarketItem[tokenId];
    }

    function getTotalTokens() external view returns (uint256) {
        return _tokenIds;
    }

    function getTotalItemsSold() external view returns (uint256) {
        return _itemsSold;
    }

    // Main marketplace functions
    function createToken(
        string memory tokenURI,
        TokenPrices memory prices,
        uint256 royaltyPercentage,
        address royaltyRecipient
    ) 
        external 
        payable 
        nonReentrant 
        whenNotPaused
        notBlacklisted
        returns (uint256) 
    {
        if (msg.value != listingPrice) revert InvalidListingPrice();
        if (prices.ethPrice == 0 && prices.usdcPrice == 0 && prices.usdtPrice == 0) {
            revert InvalidPrice();
        }
        if (royaltyPercentage > MAX_ROYALTY_PERCENTAGE) revert InvalidRoyaltyPercentage();
        if (royaltyRecipient == address(0)) royaltyRecipient = msg.sender;

        _tokenIds++;
        uint256 newTokenId = _tokenIds;

        _mint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        _createMarketItem(newTokenId, prices, royaltyPercentage, royaltyRecipient);
        
        return newTokenId;
    }

    function _createMarketItem(
        uint256 tokenId,
        TokenPrices memory prices,
        uint256 royaltyPercentage,
        address royaltyRecipient
    ) private {
        idToMarketItem[tokenId] = MarketItem({
            tokenId: tokenId,
            seller: payable(msg.sender),
            owner: payable(address(this)),
            ethPrice: prices.ethPrice,
            usdcPrice: prices.usdcPrice,
            usdtPrice: prices.usdtPrice,
            sold: false,
            listedAt: block.timestamp,
            royaltyPercentage: royaltyPercentage,
            royaltyRecipient: royaltyRecipient
        });

        _transfer(msg.sender, address(this), tokenId);
        
        emit MarketItemCreated(
            tokenId,
            msg.sender,
            address(this),
            prices.ethPrice,
            prices.usdcPrice,
            prices.usdtPrice,
            royaltyPercentage,
            royaltyRecipient,
            block.timestamp
        );
    }

    function updateItemPrices(
        uint256 tokenId,
        TokenPrices memory prices
    )
        external
        nonReentrant
        whenNotPaused
        notBlacklisted
        validTokenId(tokenId)
        tokenNotBlacklisted(tokenId)
    {
        MarketItem storage item = idToMarketItem[tokenId];
        if (item.seller != msg.sender) revert NotItemOwner();
        if (item.sold) revert TokenNotForSale();
        if (prices.ethPrice == 0 && prices.usdcPrice == 0 && prices.usdtPrice == 0) {
            revert InvalidPrice();
        }

        item.ethPrice = prices.ethPrice;
        item.usdcPrice = prices.usdcPrice;
        item.usdtPrice = prices.usdtPrice;

        emit PricesUpdated(tokenId, prices.ethPrice, prices.usdcPrice, prices.usdtPrice);
    }

    function resellToken(
        uint256 tokenId,
        TokenPrices memory prices
    ) 
        external 
        payable 
        nonReentrant 
        whenNotPaused
        notBlacklisted
        validTokenId(tokenId)
        tokenNotBlacklisted(tokenId)
    {
        if (ownerOf(tokenId) != msg.sender) revert NotTokenOwner();
        if (msg.value != listingPrice) revert InvalidListingPrice();
        if (prices.ethPrice == 0 && prices.usdcPrice == 0 && prices.usdtPrice == 0) {
            revert InvalidPrice();
        }

        MarketItem storage item = idToMarketItem[tokenId];
        item.sold = false;
        item.ethPrice = prices.ethPrice;
        item.usdcPrice = prices.usdcPrice;
        item.usdtPrice = prices.usdtPrice;
        item.seller = payable(msg.sender);
        item.owner = payable(address(this));
        item.listedAt = block.timestamp;
        
        _itemsSold--;
        _transfer(msg.sender, address(this), tokenId);

        emit PricesUpdated(tokenId, prices.ethPrice, prices.usdcPrice, prices.usdtPrice);
    }

    function createMarketSaleETH(uint256 tokenId) 
        external 
        payable 
        nonReentrant 
        whenNotPaused
        notBlacklisted
        validTokenId(tokenId)
        tokenNotBlacklisted(tokenId)
    {
        MarketItem storage item = idToMarketItem[tokenId];
        uint256 price = item.ethPrice;
        
        if (price == 0) revert TokenNotForSale();
        if (msg.value != price) revert InsufficientPayment();
        
        _executeSale(tokenId, price, PaymentToken.ETH);
    }

    function createMarketSaleUSDC(uint256 tokenId) 
        external 
        nonReentrant 
        whenNotPaused
        notBlacklisted
        validTokenId(tokenId)
        tokenNotBlacklisted(tokenId)
    {
        MarketItem storage item = idToMarketItem[tokenId];
        uint256 price = item.usdcPrice;
        
        if (price == 0) revert TokenNotForSale();
        
        _executeSaleERC20(tokenId, price, PaymentToken.USDC, USDC);
    }

    function createMarketSaleUSDT(uint256 tokenId) 
        external 
        nonReentrant 
        whenNotPaused
        notBlacklisted
        validTokenId(tokenId)
        tokenNotBlacklisted(tokenId)
    {
        MarketItem storage item = idToMarketItem[tokenId];
        uint256 price = item.usdtPrice;
        
        if (price == 0) revert TokenNotForSale();
        
        _executeSaleERC20(tokenId, price, PaymentToken.USDT, USDT);
    }

    function _executeSale(uint256 tokenId, uint256 price, PaymentToken paymentToken) private {
        MarketItem storage item = idToMarketItem[tokenId];
        address seller = item.seller;
        
        // Calculate fees
        uint256 platformFee = (price * platformFeePercentage) / PERCENTAGE_BASE;
        uint256 royaltyFee = (price * item.royaltyPercentage) / PERCENTAGE_BASE;
        uint256 sellerAmount = price - platformFee - royaltyFee;
        
        // Update item state
        item.owner = payable(msg.sender);
        item.sold = true;
        item.seller = payable(address(0));
        _itemsSold++;
        
        // Transfer NFT
        _transfer(address(this), msg.sender, tokenId);
        
        // Transfer payments
        if (platformFee > 0) {
            payable(feeRecipient).sendValue(platformFee);
        }
        if (royaltyFee > 0) {
            payable(item.royaltyRecipient).sendValue(royaltyFee);
        }
        if (sellerAmount > 0) {
            payable(seller).sendValue(sellerAmount);
        }
        
        emit MarketItemSold(
            tokenId,
            seller,
            msg.sender,
            price,
            paymentToken,
            platformFee,
            royaltyFee,
            block.timestamp
        );
    }

    function _executeSaleERC20(
        uint256 tokenId, 
        uint256 price, 
        PaymentToken paymentToken, 
        IERC20 token
    ) private {
        MarketItem storage item = idToMarketItem[tokenId];
        address seller = item.seller;
        
        // Calculate fees
        uint256 platformFee = (price * platformFeePercentage) / PERCENTAGE_BASE;
        uint256 royaltyFee = (price * item.royaltyPercentage) / PERCENTAGE_BASE;
        uint256 sellerAmount = price - platformFee - royaltyFee;
        
        // Update item state
        item.owner = payable(msg.sender);
        item.sold = true;
        item.seller = payable(address(0));
        _itemsSold++;
        
        // Transfer NFT
        _transfer(address(this), msg.sender, tokenId);
        
        // Transfer payments
        if (platformFee > 0) {
            token.safeTransferFrom(msg.sender, feeRecipient, platformFee);
        }
        if (royaltyFee > 0) {
            token.safeTransferFrom(msg.sender, item.royaltyRecipient, royaltyFee);
        }
        if (sellerAmount > 0) {
            token.safeTransferFrom(msg.sender, seller, sellerAmount);
        }
        
        emit MarketItemSold(
            tokenId,
            seller,
            msg.sender,
            price,
            paymentToken,
            platformFee,
            royaltyFee,
            block.timestamp
        );
    }

    // Query functions
    function fetchMarketItems() external view returns (MarketItem[] memory) {
        uint256 itemCount = _tokenIds;
        uint256 unsoldItemCount = _tokenIds - _itemsSold;
        uint256 currentIndex = 0;

        MarketItem[] memory items = new MarketItem[](unsoldItemCount);
        for (uint256 i = 1; i <= itemCount; i++) {
            if (idToMarketItem[i].owner == address(this) && !blacklistedTokens[i]) {
                MarketItem storage currentItem = idToMarketItem[i];
                items[currentIndex] = currentItem;
                currentIndex++;
            }
        }
        return items;
    }

    function fetchMyNFTs() external view returns (MarketItem[] memory) {
        uint256 totalItemCount = _tokenIds;
        uint256 itemCount = 0;
        uint256 currentIndex = 0;

        for (uint256 i = 1; i <= totalItemCount; i++) {
            if (idToMarketItem[i].owner == msg.sender || ownerOf(i) == msg.sender) {
                itemCount++;
            }
        }

        MarketItem[] memory items = new MarketItem[](itemCount);
        for (uint256 i = 1; i <= totalItemCount; i++) {
            if (idToMarketItem[i].owner == msg.sender || ownerOf(i) == msg.sender) {
                MarketItem storage currentItem = idToMarketItem[i];
                items[currentIndex] = currentItem;
                currentIndex++;
            }
        }
        return items;
    }

    function fetchItemsListed() external view returns (MarketItem[] memory) {
        uint256 totalItemCount = _tokenIds;
        uint256 itemCount = 0;
        uint256 currentIndex = 0;

        for (uint256 i = 1; i <= totalItemCount; i++) {
            if (idToMarketItem[i].seller == msg.sender) {
                itemCount++;
            }
        }

        MarketItem[] memory items = new MarketItem[](itemCount);
        for (uint256 i = 1; i <= totalItemCount; i++) {
            if (idToMarketItem[i].seller == msg.sender) {
                MarketItem storage currentItem = idToMarketItem[i];
                items[currentIndex] = currentItem;
                currentIndex++;
            }
        }
        return items;
    }

    // Royalty support (EIP-2981)
    function royaltyInfo(uint256 tokenId, uint256 salePrice)
        external
        view
        override
        returns (address receiver, uint256 royaltyAmount)
    {
        MarketItem memory item = idToMarketItem[tokenId];
        receiver = item.royaltyRecipient;
        royaltyAmount = (salePrice * item.royaltyPercentage) / PERCENTAGE_BASE;
    }

    // Emergency functions
    function emergencyWithdrawETH() external onlyOwner {
        if (!emergencyWithdrawEnabled) revert EmergencyWithdrawNotReady();
        if (block.timestamp < emergencyWithdrawTimestamp) revert EmergencyWithdrawNotReady();
        
        uint256 balance = address(this).balance;
        payable(owner()).sendValue(balance);
        emit EmergencyWithdrawExecuted(address(0), balance);
    }

    function emergencyWithdrawToken(IERC20 token) external onlyOwner {
        if (!emergencyWithdrawEnabled) revert EmergencyWithdrawNotReady();
        if (block.timestamp < emergencyWithdrawTimestamp) revert EmergencyWithdrawNotReady();
        
        uint256 balance = token.balanceOf(address(this));
        token.safeTransfer(owner(), balance);
        emit EmergencyWithdrawExecuted(address(token), balance);
    }

    // Override required functions
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage, IERC165)
        returns (bool)
    {
        return interfaceId == type(IERC2981).interfaceId || super.supportsInterface(interfaceId);
    }

    // Fallback functions
    receive() external payable {
        // Allow contract to receive ETH
    }
}