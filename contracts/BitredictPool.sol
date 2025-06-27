// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract BitredictPool is Ownable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    IERC20 public sttToken;      // Native STT token
    IERC20 public bitrToken;     // BITR token (project token)
    
    // BITR serves as both betting currency and discount token
    uint256 public poolCount;
    uint256 public creationFee = 1e18; // 1 STT
    uint256 public platformFee = 500; // 5% in basis points
    address public feeCollector;
    
    // Configuration variables
    uint256 public bettingGracePeriod = 60; // 60 seconds before event start
    uint256 public arbitrationTimeout = 24 hours; // 24 hours after event end
    uint256 public minPoolStake = 20e18; // Minimum 20 STT for pool creation
    uint256 public minBetAmount = 1e18; // Minimum 1 STT for bets
    
    // Gas limit protection
    uint256 public constant MAX_PARTICIPANTS = 500; // Maximum participants per pool
    uint256 public constant MAX_LP_PROVIDERS = 100; // Maximum LP providers per pool
    
    mapping(address => bool) public oracleSigners;
    
    // Creator reputation tracking
    struct CreatorStats {
        uint256 totalPools;
        uint256 wonPools;
        uint256 settledPools;
        uint256 totalVolume;
    }
    mapping(address => CreatorStats) public creatorStats;
    
    // Bettor stats tracking
    struct BettorStats {
        uint256 totalBets;
        uint256 wonBets;
        uint256 totalStaked;
        uint256 totalWinnings;
    }
    mapping(address => BettorStats) public bettorStats;
    
    // Global platform stats
    struct GlobalStats {
        uint256 totalPools;
        uint256 totalVolume;
        uint256 totalBets;
        uint256 activePools;
    }
    GlobalStats public globalStats;
    
    // Private pool access control
    mapping(uint256 => mapping(address => bool)) public poolWhitelist;
    mapping(bytes32 => bool) public usedSignatures; // Prevent signature replay attacks

    constructor(address _sttToken, address _bitrToken, address _feeCollector) Ownable(msg.sender) {
        sttToken = IERC20(_sttToken);
        bitrToken = IERC20(_bitrToken);
        feeCollector = _feeCollector;
    }

    struct Pool {
        address creator;
        bytes32 predictedOutcome; // What the creator thinks WON'T happen
        uint256 odds; // example: 150 = 1.50x (multiplied by 100)
        uint256 creatorStake;
        uint256 totalCreatorSideStake; // Total liquidity on creator's side (including creator + LPs)
        uint256 maxBettorStake; // Calculated based on total creator side stake
        uint256 totalBettorStake; // Total stake from people betting ON the predicted outcome
        bytes32 result;
        bool settled;
        bool creatorSideWon; // True if predicted outcome did NOT happen
        
        // New timing fields
        uint256 eventStartTime;
        uint256 eventEndTime;
        uint256 bettingEndTime; // eventStartTime - grace period
        uint256 resultTimestamp;
        uint256 arbitrationDeadline; // eventEndTime + arbitration timeout
        
        // New metadata fields
        string league;
        string category; // "football", "basketball", etc.
        string region;
        
        // New functionality fields
        bool isPrivate;
        uint256 maxBetPerUser;
        bytes32 oracleCommitment; // For commit-reveal scheme
        bool commitmentRevealed;
        bool usesBitr; // True if pool uses BITR, false if STT
    }

    mapping(uint256 => Pool) public pools;
    mapping(uint256 => address[]) public poolBettors; // People betting ON the predicted outcome
    mapping(uint256 => mapping(address => uint256)) public bettorStakes; // Stakes of people betting ON
    mapping(uint256 => address[]) public poolLiquidityProviders; // People betting AGAINST (with creator)
    mapping(uint256 => mapping(address => uint256)) public liquidityProviderStakes; // LP stakes
    mapping(uint256 => mapping(address => bool)) public claimed;

    event PoolCreated(uint256 indexed poolId, address indexed creator, uint256 eventStartTime, uint256 eventEndTime);
    event BetPlaced(uint256 indexed poolId, address indexed bettor, uint256 amount, bool isForOutcome);
    event LiquidityAdded(uint256 indexed poolId, address indexed provider, uint256 amount);
    event PoolSettled(uint256 indexed poolId, bytes32 result, bool creatorSideWon, uint256 timestamp);
    event RewardClaimed(uint256 indexed poolId, address indexed user, uint256 amount);
    event OracleCommitment(uint256 indexed poolId, bytes32 commitment, uint256 timestamp);
    event PoolRefunded(uint256 indexed poolId, string reason);
    event UserWhitelisted(uint256 indexed poolId, address indexed user);

    modifier validPool(uint256 poolId) {
        require(poolId < poolCount, "Invalid pool");
        _;
    }

    function addOracleSigner(address signer) external onlyOwner {
        oracleSigners[signer] = true;
    }


    function createPool(
        bytes32 _predictedOutcome,
        uint256 _odds,
        uint256 _creatorStake,
        uint256 _eventStartTime,
        uint256 _eventEndTime,
        string memory _league,
        string memory _category,
        string memory _region,
        bool _isPrivate,
        uint256 _maxBetPerUser,
        bool _useBitr
    ) external {
        require(_odds > 100 && _odds <= 10000, "Odds must be 1.01x to 100x");
        require(_creatorStake >= minPoolStake, "Stake below minimum");
        require(_creatorStake <= 1000000 * 1e18, "Stake too large"); // Max 1M tokens
        require(_eventStartTime > block.timestamp, "Event must be in future");
        require(_eventEndTime > _eventStartTime, "Event end must be after start");
        require(_eventStartTime > block.timestamp + bettingGracePeriod, "Event too soon");
        require(_eventStartTime < block.timestamp + 365 days, "Event too far in future");

        // Choose token based on preference
        IERC20 token = _useBitr ? bitrToken : sttToken;
        
        uint256 totalRequired = creationFee + _creatorStake;
        require(token.transferFrom(msg.sender, address(this), totalRequired), "Transfer failed");
        require(token.transfer(feeCollector, creationFee), "Fee transfer failed");

        uint256 maxStake = (_creatorStake * 100) / (_odds - 100);
        uint256 bettingEnd = _eventStartTime - bettingGracePeriod;
        uint256 arbitrationEnd = _eventEndTime + arbitrationTimeout;

        pools[poolCount] = Pool({
            creator: msg.sender,
            predictedOutcome: _predictedOutcome,
            odds: _odds,
            creatorStake: _creatorStake,
            totalCreatorSideStake: _creatorStake, // Initialize with creator's stake
            maxBettorStake: maxStake,
            totalBettorStake: 0,
            result: bytes32(0),
            settled: false,
            creatorSideWon: false,
            eventStartTime: _eventStartTime,
            eventEndTime: _eventEndTime,
            bettingEndTime: bettingEnd,
            resultTimestamp: 0,
            arbitrationDeadline: arbitrationEnd,
            league: _league,
            category: _category,
            region: _region,
            isPrivate: _isPrivate,
            maxBetPerUser: _maxBetPerUser,
            oracleCommitment: bytes32(0),
            commitmentRevealed: false,
            usesBitr: _useBitr
        });

        // Creator is the first LP
        poolLiquidityProviders[poolCount].push(msg.sender);
        liquidityProviderStakes[poolCount][msg.sender] = _creatorStake;

        // Update creator stats
        creatorStats[msg.sender].totalPools++;
        
        // Update global stats
        globalStats.totalPools++;
        globalStats.activePools++;

        emit PoolCreated(poolCount, msg.sender, _eventStartTime, _eventEndTime);
        poolCount++;
    }

    function placeBet(uint256 poolId, uint256 amount) external validPool(poolId) {
        Pool storage pool = pools[poolId];
        require(!pool.settled, "Pool settled");
        require(amount >= minBetAmount, "Bet below minimum");
        require(amount <= 100000 * 1e18, "Bet too large"); // Max 100K tokens per bet
        require(block.timestamp < pool.bettingEndTime, "Betting period ended");
        
        // ENHANCED STAKE LOGIC: Calculate current effective max based on new logic
        uint256 effectiveCreatorSideStake = pool.creatorStake;
        if (pool.totalBettorStake + amount > pool.creatorStake) {
            // Only when bets would exceed creator's initial stake, include LP stakes
            effectiveCreatorSideStake = pool.totalCreatorSideStake;
        }
        
        // MATHEMATICAL EDGE CASE: Prevent division by zero
        require(pool.odds > 100, "Invalid odds for calculation");
        uint256 currentMaxBettorStake = (effectiveCreatorSideStake * 100) / (pool.odds - 100);
        
        require(pool.totalBettorStake + amount <= currentMaxBettorStake, "Pool full");
        
        // SECURITY: Prevent overflow in total stake calculation
        require(pool.totalBettorStake <= type(uint256).max - amount, "Stake overflow");
        
        // GAS LIMIT: Prevent too many participants
        if (bettorStakes[poolId][msg.sender] == 0) {
            require(poolBettors[poolId].length < MAX_PARTICIPANTS, "Too many participants");
        }
        
        // Check private pool access
        if (pool.isPrivate) {
            require(poolWhitelist[poolId][msg.sender], "Not whitelisted for private pool");
        }
        
        // Check max bet per user
        if (pool.maxBetPerUser > 0) {
            require(bettorStakes[poolId][msg.sender] + amount <= pool.maxBetPerUser, "Exceeds max bet per user");
        }

        if (bettorStakes[poolId][msg.sender] == 0) {
            poolBettors[poolId].push(msg.sender);
            // Update bettor stats for new bettor
            bettorStats[msg.sender].totalBets++;
            globalStats.totalBets++;
        }

        bettorStakes[poolId][msg.sender] += amount;
        pool.totalBettorStake += amount;
        
        // Update pool's max bettor stake for future bets
        pool.maxBettorStake = currentMaxBettorStake;
        
        // Update bettor stats
        bettorStats[msg.sender].totalStaked += amount;

        // TOKEN CONSISTENCY: Ensure bettor uses same token as pool creator
        IERC20 token = pool.usesBitr ? bitrToken : sttToken;
        require(token.transferFrom(msg.sender, address(this), amount), "Bet transfer failed");

        emit BetPlaced(poolId, msg.sender, amount, true); // true = betting FOR the outcome
    }

    function addLiquidity(uint256 poolId, uint256 amount) external validPool(poolId) {
        Pool storage pool = pools[poolId];
        require(!pool.settled, "Pool settled");
        require(amount >= minBetAmount, "Liquidity below minimum");
        require(amount <= 500000 * 1e18, "Liquidity too large"); // Max 500K tokens
        require(block.timestamp < pool.bettingEndTime, "Betting period ended");
        
        // SECURITY: Prevent overflow in total creator side stake
        require(pool.totalCreatorSideStake <= type(uint256).max - amount, "Creator stake overflow");
        
        // GAS LIMIT: Prevent too many LP providers
        if (liquidityProviderStakes[poolId][msg.sender] == 0) {
            require(poolLiquidityProviders[poolId].length < MAX_LP_PROVIDERS, "Too many LP providers");
        }
        
        // Check private pool access
        if (pool.isPrivate) {
            require(poolWhitelist[poolId][msg.sender], "Not whitelisted for private pool");
        }

        if (liquidityProviderStakes[poolId][msg.sender] == 0) {
            poolLiquidityProviders[poolId].push(msg.sender);
        }

        liquidityProviderStakes[poolId][msg.sender] += amount;
        pool.totalCreatorSideStake += amount;

        // ENHANCED STAKE LOGIC: Recalculate max bettor stake
        // Only LP stakes beyond creator's initial stake are used for additional betting capacity
        uint256 effectiveCreatorSideStake = pool.creatorStake;
        if (pool.totalBettorStake > pool.creatorStake) {
            // Only when bets exceed creator's initial stake, include LP stakes
            effectiveCreatorSideStake = pool.totalCreatorSideStake;
        }
        
        // MATHEMATICAL EDGE CASE: Prevent division by zero
        require(pool.odds > 100, "Invalid odds for calculation");
        pool.maxBettorStake = (effectiveCreatorSideStake * 100) / (pool.odds - 100);

        // TOKEN CONSISTENCY: Use the same token as the pool
        IERC20 token = pool.usesBitr ? bitrToken : sttToken;
        require(token.transferFrom(msg.sender, address(this), amount), "Liquidity transfer failed");

        emit LiquidityAdded(poolId, msg.sender, amount);
    }

    // LP WITHDRAWAL: LPs can only withdraw after event starts when no bets placed
    function withdrawLiquidity(uint256 poolId) external validPool(poolId) {
        Pool storage pool = pools[poolId];
        require(!pool.settled, "Pool already settled");
        require(msg.sender != pool.creator, "Creator cannot use this function");
        require(liquidityProviderStakes[poolId][msg.sender] > 0, "No liquidity provided");
        require(block.timestamp >= pool.eventStartTime, "Event not started yet");
        require(pool.totalBettorStake == 0, "Pool has bets, cannot withdraw");
        
        uint256 lpStake = liquidityProviderStakes[poolId][msg.sender];
        liquidityProviderStakes[poolId][msg.sender] = 0;
        pool.totalCreatorSideStake -= lpStake;
        
        // Recalculate max bettor stake after withdrawal
        uint256 effectiveCreatorSideStake = pool.creatorStake;
        if (pool.totalBettorStake > pool.creatorStake) {
            effectiveCreatorSideStake = pool.totalCreatorSideStake;
        }
        
        // MATHEMATICAL EDGE CASE: Ensure odds are valid
        if (pool.odds > 100) {
            pool.maxBettorStake = (effectiveCreatorSideStake * 100) / (pool.odds - 100);
        }
        
        // Remove from LP array (gas intensive but necessary for clean state)
        address[] storage lps = poolLiquidityProviders[poolId];
        for (uint256 i = 0; i < lps.length; i++) {
            if (lps[i] == msg.sender) {
                lps[i] = lps[lps.length - 1];
                lps.pop();
                break;
            }
        }
        
        IERC20 token = pool.usesBitr ? bitrToken : sttToken;
        require(token.transfer(msg.sender, lpStake), "LP withdrawal failed");
        
        emit LiquidityAdded(poolId, msg.sender, 0); // 0 amount indicates withdrawal
    }

    function withdrawCreatorStake(uint256 poolId) external validPool(poolId) {
        Pool storage pool = pools[poolId];
        require(msg.sender == pool.creator, "Only creator can withdraw");
        require(!pool.settled, "Pool already settled");
        require(pool.totalBettorStake == 0, "Pool has bets, cannot withdraw");
        require(block.timestamp > pool.bettingEndTime, "Betting period not ended");
        
        // Mark pool as settled to prevent further interactions
        pool.settled = true;
        
        // Refund all liquidity providers (including creator)
        IERC20 token = pool.usesBitr ? bitrToken : sttToken;
        address[] memory lps = poolLiquidityProviders[poolId];
        for (uint256 i = 0; i < lps.length; i++) {
            address lp = lps[i];
            uint256 stake = liquidityProviderStakes[poolId][lp];
            if (stake > 0) {
                require(token.transfer(lp, stake), "LP refund failed");
            }
        }
        
        // Update global stats
        globalStats.activePools--;
        
        emit PoolRefunded(poolId, "No bets received");
    }

    // Commit-reveal oracle system
    function commitOracleResult(uint256 poolId, bytes32 commitment) external validPool(poolId) {
        Pool storage pool = pools[poolId];
        require(!pool.settled, "Already settled");
        require(block.timestamp >= pool.eventEndTime, "Event not ended yet");
        require(oracleSigners[msg.sender], "Not authorized oracle");
        require(pool.oracleCommitment == bytes32(0), "Already committed");

        pool.oracleCommitment = commitment;
        emit OracleCommitment(poolId, commitment, block.timestamp);
    }

    function revealOracleResult(
        uint256 poolId, 
        bytes32 outcome, 
        uint256 nonce,
        bytes calldata signature
    ) external validPool(poolId) {
        Pool storage pool = pools[poolId];
        require(!pool.settled, "Already settled");
        require(pool.oracleCommitment != bytes32(0), "No commitment found");
        require(!pool.commitmentRevealed, "Already revealed");
        
        // Verify commitment matches reveal
        bytes32 expectedCommitment = keccak256(abi.encodePacked(poolId, outcome, nonce));
        require(pool.oracleCommitment == expectedCommitment, "Invalid reveal");

        // Verify signature and prevent replay
        bytes32 messageHash = keccak256(abi.encodePacked(poolId, outcome));
        bytes32 signatureHash = keccak256(signature);
        require(!usedSignatures[signatureHash], "Signature already used");
        usedSignatures[signatureHash] = true;
        
        address recovered = messageHash.toEthSignedMessageHash().recover(signature);
        require(oracleSigners[recovered], "Invalid oracle signer");

        // Settle pool
        pool.result = outcome;
        pool.settled = true;
        // Creator side wins if predicted outcome DID NOT happen
        pool.creatorSideWon = (outcome != pool.predictedOutcome);
        pool.resultTimestamp = block.timestamp;
        pool.commitmentRevealed = true;

        // Update creator stats
        CreatorStats storage stats = creatorStats[pool.creator];
        stats.settledPools++;
        stats.totalVolume += pool.totalCreatorSideStake + pool.totalBettorStake;
        if (pool.creatorSideWon) {
            stats.wonPools++;
        }
        
        // Update global stats
        globalStats.totalVolume += pool.totalCreatorSideStake + pool.totalBettorStake;
        globalStats.activePools--;
        
        // Update bettor stats if bettors won - GAS LIMIT PROTECTION
        if (!pool.creatorSideWon) {
            address[] memory bettors = poolBettors[poolId];
            uint256 maxIterations = bettors.length > MAX_PARTICIPANTS ? MAX_PARTICIPANTS : bettors.length;
            for (uint256 i = 0; i < maxIterations; i++) {
                bettorStats[bettors[i]].wonBets++;
            }
        }

        emit PoolSettled(poolId, outcome, pool.creatorSideWon, block.timestamp);
    }

    // Legacy settlement function (for backward compatibility)
    function settlePoolWithSignature(uint256 poolId, bytes32 outcome, bytes calldata signature) external validPool(poolId) {
        require(!pools[poolId].settled, "Already settled");
        require(block.timestamp >= pools[poolId].eventEndTime, "Event not ended yet");
        
        bytes32 messageHash = keccak256(abi.encodePacked(poolId, outcome));
        bytes32 signatureHash = keccak256(signature);
        require(!usedSignatures[signatureHash], "Signature already used");
        usedSignatures[signatureHash] = true;
        
        address recovered = messageHash.toEthSignedMessageHash().recover(signature);
        require(oracleSigners[recovered], "Invalid oracle signer");

        Pool storage pool = pools[poolId];
        pool.result = outcome;
        pool.settled = true;
        // Creator side wins if predicted outcome DID NOT happen
        pool.creatorSideWon = (outcome != pool.predictedOutcome);
        pool.resultTimestamp = block.timestamp;

        // Update creator stats
        CreatorStats storage stats = creatorStats[pool.creator];
        stats.settledPools++;
        stats.totalVolume += pool.totalCreatorSideStake + pool.totalBettorStake;
        if (pool.creatorSideWon) {
            stats.wonPools++;
        }
        
        // Update global stats
        globalStats.totalVolume += pool.totalCreatorSideStake + pool.totalBettorStake;
        globalStats.activePools--;
        
        // Update bettor stats if bettors won - GAS LIMIT PROTECTION
        if (!pool.creatorSideWon) {
            address[] memory bettors = poolBettors[poolId];
            uint256 maxIterations = bettors.length > MAX_PARTICIPANTS ? MAX_PARTICIPANTS : bettors.length;
            for (uint256 i = 0; i < maxIterations; i++) {
                bettorStats[bettors[i]].wonBets++;
            }
        }

        emit PoolSettled(poolId, outcome, pool.creatorSideWon, block.timestamp);
    }

    function claim(uint256 poolId) external validPool(poolId) {
        Pool storage pool = pools[poolId];
        require(pool.settled, "Not settled");
        require(!claimed[poolId][msg.sender], "Already claimed");

        uint256 payout;
        uint256 fee = 0;
        
        // Set claimed flag BEFORE any external calls (reentrancy protection)
        claimed[poolId][msg.sender] = true;

        if (pool.creatorSideWon) {
            // Creator side (LPs) won - share the total pool proportionally
            uint256 lpStake = liquidityProviderStakes[poolId][msg.sender];
            require(lpStake > 0, "No liquidity provided");
            
            // MATHEMATICAL EDGE CASE: Prevent division by zero
            require(pool.totalCreatorSideStake > 0, "Invalid pool state");
            
            // Calculate LP's share of the total creator side stake
            uint256 sharePercentage = (lpStake * 10000) / pool.totalCreatorSideStake; // Basis points
            
            // MATHEMATICAL EDGE CASE: Prevent overflow in payout calculation
            require(sharePercentage <= 10000, "Invalid share percentage");
            
            // LP gets their original stake + proportional share of bettor stakes
            payout = lpStake + ((pool.totalBettorStake * sharePercentage) / 10000);
            
        } else {
            // Bettors won - creator side lost everything
            uint256 bettorStake = bettorStakes[poolId][msg.sender];
            require(bettorStake > 0, "No bet placed");
            
            // MATHEMATICAL EDGE CASE: Validate odds to prevent overflow
            require(pool.odds >= 100 && pool.odds <= 10000, "Invalid odds");
            
            // Bettor gets: stake * odds
            payout = (bettorStake * pool.odds) / 100;
            
            // MATHEMATICAL EDGE CASE: Check for underflow and overflow
            require(payout >= bettorStake, "Payout calculation error");
            require(payout <= type(uint256).max / 2, "Payout too large");
            
            uint256 profit = payout - bettorStake;
            fee = (profit * adjustedFeeRate(msg.sender)) / 10000;
            
            // MATHEMATICAL EDGE CASE: Ensure fee doesn't exceed profit
            require(fee <= profit, "Fee exceeds profit");
            payout -= fee;
            
            // Update bettor stats
            bettorStats[msg.sender].totalWinnings += payout;
            
            // Transfer fee to fee collector
            if (fee > 0) {
                IERC20 feeToken = pool.usesBitr ? bitrToken : sttToken;
                require(feeToken.transfer(feeCollector, fee), "Fee transfer failed");
            }
        }

        require(payout > 0, "Nothing to claim");
        IERC20 token = pool.usesBitr ? bitrToken : sttToken;
        require(token.transfer(msg.sender, payout), "Payout failed");

        emit RewardClaimed(poolId, msg.sender, payout);
    }

    function adjustedFeeRate(address user) public view returns (uint256) {
        uint256 bitrBalance = bitrToken.balanceOf(user);
        // BITR discount tiers (holding BITR reduces fees)
        if (bitrBalance >= 50000 * 1e18) return platformFee * 50 / 100;  // 50% discount
        if (bitrBalance >= 20000 * 1e18) return platformFee * 70 / 100;  // 30% discount
        if (bitrBalance >= 5000 * 1e18) return platformFee * 80 / 100;   // 20% discount
        if (bitrBalance >= 2000 * 1e18) return platformFee * 90 / 100;   // 10% discount
        return platformFee; // No discount
    }

    // Removed admin functions for full decentralization
    // Fee collector, creation fee, platform fee, and discount token are immutable after deployment

    // Enhanced view functions for frontend integration
    function getPool(uint256 poolId) external view validPool(poolId) returns (Pool memory) {
        return pools[poolId];
    }

    function getPoolBettors(uint256 poolId) external view validPool(poolId) returns (address[] memory) {
        return poolBettors[poolId];
    }

    function getPoolLiquidityProviders(uint256 poolId) external view validPool(poolId) returns (address[] memory) {
        return poolLiquidityProviders[poolId];
    }

    function getBettorStake(uint256 poolId, address bettor) external view validPool(poolId) returns (uint256) {
        return bettorStakes[poolId][bettor];
    }

    function getLiquidityProviderStake(uint256 poolId, address provider) external view validPool(poolId) returns (uint256) {
        return liquidityProviderStakes[poolId][provider];
    }

    function getPoolStatus(uint256 poolId) external view validPool(poolId) returns (
        bool isActive,
        bool isSettled,
        bool bettingOpen,
        bool eventStarted,
        bool eventEnded,
        uint256 remainingBettorCapacity,
        uint256 totalBettorStaked,
        uint256 totalCreatorSideStaked,
        uint256 timeUntilBettingEnds,
        uint256 timeUntilEventStarts
    ) {
        Pool memory pool = pools[poolId];
        isActive = !pool.settled;
        isSettled = pool.settled;
        bettingOpen = block.timestamp < pool.bettingEndTime && !pool.settled;
        eventStarted = block.timestamp >= pool.eventStartTime;
        eventEnded = block.timestamp >= pool.eventEndTime;
        
        // MATHEMATICAL EDGE CASE: Prevent underflow in capacity calculation
        if (pool.maxBettorStake > pool.totalBettorStake) {
            remainingBettorCapacity = pool.maxBettorStake - pool.totalBettorStake;
        } else {
            remainingBettorCapacity = 0;
        }
        
        totalBettorStaked = pool.totalBettorStake;
        totalCreatorSideStaked = pool.totalCreatorSideStake;
        
        // MATHEMATICAL EDGE CASE: Prevent underflow in time calculations
        if (block.timestamp < pool.bettingEndTime) {
            timeUntilBettingEnds = pool.bettingEndTime - block.timestamp;
        } else {
            timeUntilBettingEnds = 0;
        }
        if (block.timestamp < pool.eventStartTime) {
            timeUntilEventStarts = pool.eventStartTime - block.timestamp;
        } else {
            timeUntilEventStarts = 0;
        }
    }

    function calculatePotentialBettorPayout(uint256 poolId, uint256 stakeAmount) external view validPool(poolId) returns (uint256) {
        Pool memory pool = pools[poolId];
        require(!pool.settled, "Pool settled");
        require(pool.totalBettorStake + stakeAmount <= pool.maxBettorStake, "Exceeds max stake");
        
        // MATHEMATICAL EDGE CASE: Validate odds and prevent overflow
        require(pool.odds >= 100 && pool.odds <= 10000, "Invalid odds");
        require(stakeAmount <= type(uint256).max / pool.odds, "Stake too large for odds");
        
        return (stakeAmount * pool.odds) / 100;
    }

    function calculatePotentialLPReward(uint256 poolId, uint256 liquidityAmount) external view validPool(poolId) returns (uint256) {
        Pool memory pool = pools[poolId];
        require(!pool.settled, "Pool settled");
        
        uint256 newTotalCreatorSide = pool.totalCreatorSideStake + liquidityAmount;
        
        // MATHEMATICAL EDGE CASE: Prevent division by zero
        require(newTotalCreatorSide > 0, "Invalid liquidity calculation");
        
        uint256 sharePercentage = (liquidityAmount * 10000) / newTotalCreatorSide;
        
        // MATHEMATICAL EDGE CASE: Validate share percentage
        require(sharePercentage <= 10000, "Invalid share percentage");
        
        // LP would get: original liquidity + proportional share of current bettor stakes
        return liquidityAmount + ((pool.totalBettorStake * sharePercentage) / 10000);
    }

    function getCreatorStats(address creator) external view returns (
        uint256 totalPools,
        uint256 wonPools,
        uint256 settledPools,
        uint256 totalVolume,
        uint256 winRate,
        uint256 accuracy
    ) {
        CreatorStats memory stats = creatorStats[creator];
        totalPools = stats.totalPools;
        wonPools = stats.wonPools;
        settledPools = stats.settledPools;
        totalVolume = stats.totalVolume;
        
        if (stats.settledPools > 0) {
            winRate = (stats.wonPools * 10000) / stats.settledPools; // Basis points
            accuracy = (stats.settledPools * 10000) / stats.totalPools; // Basis points
        }
    }

    function getPoolsByCategory(string memory category, uint256 limit, uint256 offset) 
        external view returns (uint256[] memory poolIds) 
    {
        uint256[] memory tempIds = new uint256[](poolCount);
        uint256 count = 0;
        
        for (uint256 i = 0; i < poolCount; i++) {
            if (keccak256(bytes(pools[i].category)) == keccak256(bytes(category))) {
                tempIds[count] = i;
                count++;
            }
        }
        
        uint256 start = offset;
        uint256 end = start + limit;
        if (end > count) end = count;
        if (start >= count) return new uint256[](0);
        
        poolIds = new uint256[](end - start);
        for (uint256 i = start; i < end; i++) {
            poolIds[i - start] = tempIds[i];
        }
    }

    function getActivePoolsByCreator(address creator, uint256 limit) 
        external view returns (uint256[] memory poolIds) 
    {
        uint256[] memory tempIds = new uint256[](poolCount);
        uint256 count = 0;
        
        for (uint256 i = 0; i < poolCount && count < limit; i++) {
            if (pools[i].creator == creator && !pools[i].settled) {
                tempIds[count] = i;
                count++;
            }
        }
        
        poolIds = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            poolIds[i] = tempIds[i];
        }
    }

    function isWhitelisted(uint256 poolId, address user) external view validPool(poolId) returns (bool) {
        return poolWhitelist[poolId][user];
    }

    function canPlaceBet(uint256 poolId, address user, uint256 amount) 
        external view validPool(poolId) returns (bool canBet, string memory reason) 
    {
        Pool memory pool = pools[poolId];
        
        if (pool.settled) return (false, "Pool settled");
        if (block.timestamp >= pool.bettingEndTime) return (false, "Betting period ended");
        if (pool.totalBettorStake + amount > pool.maxBettorStake) return (false, "Pool full");
        if (pool.isPrivate && !poolWhitelist[poolId][user]) return (false, "Not whitelisted");
        if (pool.maxBetPerUser > 0 && bettorStakes[poolId][user] + amount > pool.maxBetPerUser) {
            return (false, "Exceeds max bet per user");
        }
        
        return (true, "");
    }

    function getBettorStats(address bettor) external view returns (
        uint256 totalBets,
        uint256 wonBets,
        uint256 totalStaked,
        uint256 totalWinnings,
        uint256 winRate,
        uint256 profitLoss
    ) {
        BettorStats memory stats = bettorStats[bettor];
        totalBets = stats.totalBets;
        wonBets = stats.wonBets;
        totalStaked = stats.totalStaked;
        totalWinnings = stats.totalWinnings;
        
        if (stats.totalBets > 0) {
            winRate = (stats.wonBets * 10000) / stats.totalBets; // Basis points
        }
        
        if (stats.totalWinnings >= stats.totalStaked) {
            profitLoss = stats.totalWinnings - stats.totalStaked; // Profit
        } else {
            profitLoss = stats.totalStaked - stats.totalWinnings; // Loss (will be negative when displayed)
        }
    }

    function getGlobalStats() external view returns (
        uint256 totalPools,
        uint256 totalVolume,
        uint256 totalBets,
        uint256 activePools
    ) {
        return (
            globalStats.totalPools,
            globalStats.totalVolume,
            globalStats.totalBets,
            globalStats.activePools
        );
    }

    // Arbitration timeout fallback
    function refundPool(uint256 poolId) external validPool(poolId) {
        Pool storage pool = pools[poolId];
        require(!pool.settled, "Already settled");
        require(block.timestamp > pool.arbitrationDeadline, "Arbitration period not expired");
        
        pool.settled = true;
        
        // Refund all liquidity providers (creator side)
        IERC20 token = pool.usesBitr ? bitrToken : sttToken;
        address[] memory lps = poolLiquidityProviders[poolId];
        for (uint256 i = 0; i < lps.length; i++) {
            address lp = lps[i];
            uint256 stake = liquidityProviderStakes[poolId][lp];
            if (stake > 0) {
                require(token.transfer(lp, stake), "LP refund failed");
            }
        }
        
        // Refund all bettors
        address[] memory bettors = poolBettors[poolId];
        for (uint256 i = 0; i < bettors.length; i++) {
            address bettor = bettors[i];
            uint256 stake = bettorStakes[poolId][bettor];
            if (stake > 0) {
                require(token.transfer(bettor, stake), "Bettor refund failed");
            }
        }
        
        emit PoolRefunded(poolId, "Arbitration timeout");
    }

    // Private pool management
    function addToWhitelist(uint256 poolId, address[] calldata users) external validPool(poolId) {
        Pool storage pool = pools[poolId];
        require(msg.sender == pool.creator, "Only creator can whitelist");
        require(pool.isPrivate, "Pool is not private");
        
        for (uint256 i = 0; i < users.length; i++) {
            poolWhitelist[poolId][users[i]] = true;
            emit UserWhitelisted(poolId, users[i]);
        }
    }

    function removeFromWhitelist(uint256 poolId, address[] calldata users) external validPool(poolId) {
        Pool storage pool = pools[poolId];
        require(msg.sender == pool.creator, "Only creator can remove from whitelist");
        require(pool.isPrivate, "Pool is not private");
        
        for (uint256 i = 0; i < users.length; i++) {
            poolWhitelist[poolId][users[i]] = false;
        }
    }

    // All configuration parameters are immutable after deployment for full decentralization
    // No emergency functions - fully trustless operation
}
