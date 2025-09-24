// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "./ReputationSystem.sol";

interface IBitredictBoostSystem {
    function getPoolBoost(uint256 poolId) external view returns (uint8 tier, uint256 expiry);
    function isPoolBoosted(uint256 poolId) external view returns (bool);
}
interface IBitredictStaking {
    function addRevenue(uint256 bitrAmount, uint256 sttAmount) external;
}
interface IReputationSystem {
    function getUserReputation(address user) external view returns (uint256);
    function canCreateGuidedPool(address user) external view returns (bool);
    function canCreateOpenPool(address user) external view returns (bool);
}
interface IGuidedOracle {
    function getOutcome(bytes32 marketId) external view returns (bool isSet, bytes memory resultData);
}
interface IOptimisticOracle {
    function getOutcome(bytes32 marketId) external view returns (bool isSettled, bytes memory outcome);
}

enum OracleType {
    GUIDED,
    OPEN
}

enum MarketType {
    MONEYLINE,
    OVER_UNDER,
    BOTH_TEAMS_SCORE,
    HALF_TIME,
    DOUBLE_CHANCE,
    CORRECT_SCORE,
    FIRST_GOAL,
    CUSTOM
}


contract BitredictPoolCore is Ownable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    IERC20 public bitrToken;
    uint256 public poolCount;
    uint256 public constant creationFeeSTT = 1e18;
    uint256 public constant creationFeeBITR = 50e18;
    uint256 public constant platformFee = 500;
    uint256 public constant bettingGracePeriod = 60;
    uint256 public constant arbitrationTimeout = 24 hours;
    uint256 public constant minPoolStakeSTT = 5e18;
    uint256 public constant minPoolStakeBITR = 1000e18;
    uint256 public constant minBetAmount = 1e18;
    uint256 public constant HIGH_ODDS_THRESHOLD = 500;
    uint256 public constant MAX_PARTICIPANTS = 500;
    uint256 public constant MAX_LP_PROVIDERS = 100;
    address public immutable feeCollector;
    address public immutable guidedOracle;
    address public immutable optimisticOracle;
    IReputationSystem public reputationSystem;
    IBitredictBoostSystem public boostSystem;
    uint256 public totalCollectedSTT;
    uint256 public totalCollectedBITR;

    struct PoolAnalytics {
        uint256 totalVolume;
        uint256 participantCount;
        uint256 averageBetSize;
        uint256 creatorReputation;
        uint256 liquidityRatio;
        uint256 timeToFill;
        bool isHotPool;
        uint256 fillPercentage;
        uint256 lastActivityTime;
    }

    struct CreatorStats {
        uint256 totalPoolsCreated;
        uint256 successfulPools;
        uint256 totalVolumeGenerated;
        uint256 averagePoolSize;
        uint256 reputationScore;
        uint256 winRate;
        uint256 totalEarnings;
        uint256 activePoolsCount;
    }

    struct CategoryStats {
        uint256 totalPools;
        uint256 totalVolume;
        uint256 averageOdds;
        uint256 lastActivityTime;
    }
    struct GlobalStats {
        uint256 totalPools;
        uint256 totalVolume;
        uint256 totalUsers;
        uint256 totalBets;
        uint256 averagePoolSize;
        uint256 lastUpdated;
    }

    struct Pool {
        address creator;
        uint16 odds;
        uint8 flags;
        OracleType oracleType;

        uint256 creatorStake;
        uint256 totalCreatorSideStake;
        uint256 maxBettorStake;
        uint256 totalBettorStake;
        bytes32 predictedOutcome;
        bytes32 result;
        bytes32 marketId;
        
        uint256 eventStartTime;
        uint256 eventEndTime;
        uint256 bettingEndTime;
        uint256 resultTimestamp;
        uint256 arbitrationDeadline;
        
        string league;
        string category;
        string region;
        string homeTeam;
        string awayTeam;
        string title;
        
        uint256 maxBetPerUser;
    }

    // Storage mappings
    mapping(uint256 => Pool) public pools;
    mapping(uint256 => address[]) public poolBettors;
    mapping(uint256 => mapping(address => uint256)) public bettorStakes;
    mapping(uint256 => address[]) public poolLPs;
    mapping(uint256 => mapping(address => uint256)) public lpStakes;
    mapping(uint256 => mapping(address => bool)) public claimed;
    mapping(uint256 => mapping(address => bool)) public poolWhitelist;

    // Analytics mappings
    mapping(address => CreatorStats) public creatorStats;
    mapping(string => CategoryStats) public categoryStats;
    mapping(uint256 => PoolAnalytics) public poolAnalytics;
    GlobalStats public globalStats;
    
    mapping(address => uint256) public predictionStreaks;
    mapping(address => uint256) public longestStreak;
    mapping(address => uint256) public streakMultiplier;

    // Indexing for efficient lookups
    mapping(bytes32 => uint256[]) public categoryPools;
    mapping(address => uint256[]) public creatorActivePools;
    mapping(uint256 => uint256) public poolIdToCreatorIndex;

    // Events
    event PoolCreated(uint256 indexed poolId, address indexed creator, uint256 eventStartTime, uint256 eventEndTime, OracleType oracleType, bytes32 marketId, MarketType marketType, string league, string category);
    event BetPlaced(uint256 indexed poolId, address indexed bettor, uint256 amount, bool isForOutcome);
    event LiquidityAdded(uint256 indexed poolId, address indexed provider, uint256 amount);
    event PoolSettled(uint256 indexed poolId, bytes32 result, bool creatorSideWon, uint256 timestamp);
    event RewardClaimed(uint256 indexed poolId, address indexed user, uint256 amount);
    event PoolRefunded(uint256 indexed poolId, string reason);
    event UserWhitelisted(uint256 indexed poolId, address indexed user);
    event ReputationActionOccurred(address indexed user, ReputationSystem.ReputationAction action, uint256 value, bytes32 indexed poolId, uint256 timestamp);
    event AnalyticsUpdated(uint256 indexed poolId, uint256 totalVolume, uint256 participantCount);

    constructor(
        address _bitrToken,
        address _feeCollector,
        address _guidedOracle,
        address _optimisticOracle
    ) Ownable(msg.sender) {
        bitrToken = IERC20(_bitrToken);
        feeCollector = _feeCollector;
        guidedOracle = _guidedOracle;
        optimisticOracle = _optimisticOracle;
        
        // Initialize global stats
        globalStats.lastUpdated = block.timestamp;
    }

    // --- Setter Functions ---
    
    function setReputationSystem(address _reputationSystem) external onlyOwner {
        reputationSystem = IReputationSystem(_reputationSystem);
    }

    function setBoostSystem(address _boostSystem) external onlyOwner {
        boostSystem = IBitredictBoostSystem(_boostSystem);
    }

    // --- Modifier ---
    
    modifier validPool(uint256 poolId) {
        require(poolId < poolCount, "Invalid pool");
        _;
    }

    modifier onlyOracle() {
        require(msg.sender == guidedOracle || msg.sender == optimisticOracle, "Not oracle");
        _;
    }

    // --- Pool Creation ---

    function createPool(
        bytes32 _predictedOutcome,
        uint256 _odds,
        uint256 _creatorStake,
        uint256 _eventStartTime,
        uint256 _eventEndTime,
        string memory _league,
        string memory _category,
        string memory _region,
        string memory _homeTeam,
        string memory _awayTeam,
        string memory _title,
        bool _isPrivate,
        uint256 _maxBetPerUser,
        bool _useBitr,
        OracleType _oracleType,
        bytes32 _marketId,
        MarketType _marketType
    ) external payable returns (uint256) {
        require(_odds > 100 && _odds <= 10000, "Invalid odds: must be between 1.01 and 100.00");
        
        // Check reputation requirements
        if (address(reputationSystem) != address(0)) {
            if (_oracleType == OracleType.OPEN) {
                require(reputationSystem.canCreateOpenPool(msg.sender), "Insufficient reputation for OPEN pools");
            } else {
                require(reputationSystem.canCreateGuidedPool(msg.sender), "Insufficient reputation for GUIDED pools");
            }
        }
        
        // Check minimum stake
        if (_useBitr) {
            require(_creatorStake >= minPoolStakeBITR, "BITR stake below minimum");
        } else {
            require(_creatorStake >= minPoolStakeSTT, "STT stake below minimum");
        }
        
        require(_creatorStake <= 1000000 * 1e18, "Stake too large");
        require(_eventStartTime > block.timestamp, "Event must be in future");
        require(_eventEndTime > _eventStartTime, "Event end must be after start");
        require(_eventStartTime > block.timestamp + bettingGracePeriod, "Event too soon");

        // Handle payments
        uint256 creationFee = _useBitr ? creationFeeBITR : creationFeeSTT;
        uint256 totalRequired = creationFee + _creatorStake;
        
        if (_useBitr) {
            require(bitrToken.transferFrom(msg.sender, address(this), totalRequired), "BITR transfer failed");
            totalCollectedBITR += creationFee;
        } else {
            require(msg.value == totalRequired, "Incorrect STT amount");
            totalCollectedSTT += creationFee;
        }

        // Calculate pool parameters
        uint256 denominator = _odds - 100;
        require(denominator > 0, "Invalid odds");
        uint256 maxStake = (_creatorStake * 100) / denominator;
        uint256 bettingEnd = _eventStartTime - bettingGracePeriod;
        uint256 arbitrationEnd = _eventEndTime + arbitrationTimeout;

        // Pack flags for gas efficiency
        uint8 flags = 0;
        if (_isPrivate) flags |= 4;      // bit 2
        if (_useBitr) flags |= 8;        // bit 3

        pools[poolCount] = Pool({
            creator: msg.sender,
            odds: uint16(_odds),
            flags: flags,
            oracleType: _oracleType,
            creatorStake: _creatorStake,
            totalCreatorSideStake: _creatorStake,
            maxBettorStake: maxStake,
            totalBettorStake: 0,
            predictedOutcome: _predictedOutcome,
            result: bytes32(0),
            marketId: _marketId,
            eventStartTime: _eventStartTime,
            eventEndTime: _eventEndTime,
            bettingEndTime: bettingEnd,
            resultTimestamp: 0,
            arbitrationDeadline: arbitrationEnd,
            league: _league,
            category: _category,
            region: _region,
            homeTeam: _homeTeam,
            awayTeam: _awayTeam,
            title: _title,
            maxBetPerUser: _maxBetPerUser
        });

        // Initialize analytics
        poolAnalytics[poolCount] = PoolAnalytics({
            totalVolume: _creatorStake,
            participantCount: 1,
            averageBetSize: _creatorStake,
            creatorReputation: address(reputationSystem) != address(0) ? reputationSystem.getUserReputation(msg.sender) : 0,
            liquidityRatio: 100,
            timeToFill: 0,
            isHotPool: false,
            fillPercentage: 0,
            lastActivityTime: block.timestamp
        });

        // Creator is the first LP
        poolLPs[poolCount].push(msg.sender);
        lpStakes[poolCount][msg.sender] = _creatorStake;

        // Update indexing
        bytes32 categoryHash = keccak256(bytes(_category));
        categoryPools[categoryHash].push(poolCount);
        creatorActivePools[msg.sender].push(poolCount);
        poolIdToCreatorIndex[poolCount] = creatorActivePools[msg.sender].length - 1;

        // Update stats
        _updateCreatorStats(msg.sender, _creatorStake, true);
        _updateCategoryStats(_category, _creatorStake);
        _updateGlobalStats(_creatorStake, true);

        emit PoolCreated(poolCount, msg.sender, _eventStartTime, _eventEndTime, _oracleType, _marketId, _marketType, _league, _category);
        emit ReputationActionOccurred(msg.sender, ReputationSystem.ReputationAction.POOL_CREATED, _creatorStake, bytes32(poolCount), block.timestamp);
        
        uint256 currentPoolId = poolCount;
        poolCount++;
        return currentPoolId;
    }

    // --- Pool Interactions ---

    function placeBet(uint256 poolId, uint256 amount) external payable validPool(poolId) {
        Pool storage poolPtr = pools[poolId];
        Pool memory pool = poolPtr;

        require(!_isPoolSettled(poolId), "Pool settled");
        require(amount >= minBetAmount, "Bet below minimum");
        require(amount <= 100000 * 1e18, "Bet too large");
        require(block.timestamp < pool.bettingEndTime, "Betting period ended");
        
        // Check pool capacity
        uint256 effectiveCreatorSideStake = pool.totalBettorStake == 0 || pool.totalBettorStake + amount > pool.creatorStake ? 
            pool.totalCreatorSideStake : pool.creatorStake;
        
        uint256 poolOdds = uint256(pool.odds);
        uint256 currentMaxBettorStake = (effectiveCreatorSideStake * 100) / (poolOdds - 100);
        
        require(pool.totalBettorStake + amount <= currentMaxBettorStake, "Pool full");
        
        // Check participant limits
        uint256 currentBettorStake = bettorStakes[poolId][msg.sender];
        if (currentBettorStake == 0) {
            require(poolBettors[poolId].length < MAX_PARTICIPANTS, "Too many participants");
        }
        
        // Check private pool access
        if (_isPoolPrivate(poolId)) {
            require(poolWhitelist[poolId][msg.sender], "Not whitelisted");
        }
        
        // Check max bet per user
        if (pool.maxBetPerUser > 0) {
            require(currentBettorStake + amount <= pool.maxBetPerUser, "Exceeds max bet per user");
        }

        // Add to bettors list if first bet
        if (currentBettorStake == 0) {
            poolBettors[poolId].push(msg.sender);
        }

        // Update stakes
        bettorStakes[poolId][msg.sender] = currentBettorStake + amount;
        poolPtr.totalBettorStake = pool.totalBettorStake + amount;
        poolPtr.maxBettorStake = currentMaxBettorStake;

        // Check if pool filled above 60%
        if (!_isPoolFilledAbove60(poolId) && (poolPtr.totalBettorStake * 100) / currentMaxBettorStake >= 60) {
            poolPtr.flags |= 16; // Set bit 4
            emit ReputationActionOccurred(pool.creator, ReputationSystem.ReputationAction.POOL_FILLED_ABOVE_60, poolPtr.totalBettorStake, bytes32(poolId), block.timestamp);
        }

        // Handle payment
        if (_poolUsesBitr(poolId)) {
            require(bitrToken.transferFrom(msg.sender, address(this), amount), "BITR transfer failed");
        } else {
            require(msg.value == amount, "Incorrect STT amount");
        }

        // Update analytics
        _updatePoolAnalytics(poolId, amount, 1);

        emit BetPlaced(poolId, msg.sender, amount, true);
    }

    function addLiquidity(uint256 poolId, uint256 amount) external payable validPool(poolId) {
        Pool storage pool = pools[poolId];
        require(!_isPoolSettled(poolId), "Pool settled");
        require(amount >= minBetAmount, "Liquidity below minimum");
        require(amount <= 500000 * 1e18, "Liquidity too large");
        require(block.timestamp < pool.bettingEndTime, "Betting period ended");
        
        // Check limits
        require(pool.totalCreatorSideStake <= type(uint256).max - amount, "Creator stake overflow");
        
        if (lpStakes[poolId][msg.sender] == 0) {
            require(poolLPs[poolId].length < MAX_LP_PROVIDERS, "Too many LP providers");
        }
        
        // Check private pool access
        if (_isPoolPrivate(poolId)) {
            require(poolWhitelist[poolId][msg.sender], "Not whitelisted");
        }

        // Add to LP list if first liquidity
        if (lpStakes[poolId][msg.sender] == 0) {
            poolLPs[poolId].push(msg.sender);
        }

        // Update liquidity
        lpStakes[poolId][msg.sender] += amount;
        pool.totalCreatorSideStake += amount;

        // Recalculate max bettor stake
        uint256 effectiveCreatorSideStake = pool.totalBettorStake == 0 || pool.totalBettorStake > pool.creatorStake ? 
            pool.totalCreatorSideStake : pool.creatorStake;
        
        uint256 denominator = uint256(pool.odds) - 100;
        pool.maxBettorStake = (effectiveCreatorSideStake * 100) / denominator;

        // Handle payment
        if (_poolUsesBitr(poolId)) {
            require(bitrToken.transferFrom(msg.sender, address(this), amount), "BITR transfer failed");
        } else {
            require(msg.value == amount, "Incorrect STT amount");
        }

        // Update analytics
        _updatePoolAnalytics(poolId, amount, 0);

        emit LiquidityAdded(poolId, msg.sender, amount);
    }

    // --- Pool Settlement ---

    function settlePool(uint256 poolId, bytes32 outcome) external validPool(poolId) {
        Pool storage pool = pools[poolId];
        require(!_isPoolSettled(poolId), "Already settled");
        require(block.timestamp >= pool.eventEndTime, "Event not ended yet");

        // Verify oracle permissions
        if (pool.oracleType == OracleType.GUIDED) {
            require(msg.sender == guidedOracle, "Only guided oracle");
        } else if (pool.oracleType == OracleType.OPEN) {
            require(msg.sender == optimisticOracle, "Only optimistic oracle");
        }

        pool.result = outcome;
        pool.flags |= 1; // Set settled bit
        bool creatorSideWon = (outcome != pool.predictedOutcome);
        if (creatorSideWon) {
            pool.flags |= 2; // Set creatorSideWon bit
        }
        pool.resultTimestamp = block.timestamp;

        _removePoolFromCreatorActiveList(poolId);
        
        emit PoolSettled(poolId, outcome, creatorSideWon, block.timestamp);
    }

    function settlePoolAutomatically(uint256 poolId) external validPool(poolId) {
        Pool storage pool = pools[poolId];
        require(!_isPoolSettled(poolId), "Already settled");
        require(block.timestamp >= pool.eventEndTime, "Event not ended yet");

        bytes32 outcome;
        bool isReady = false;

        if (pool.oracleType == OracleType.GUIDED) {
            (bool isSet, bytes memory resultData) = IGuidedOracle(guidedOracle).getOutcome(pool.marketId);
            require(isSet, "Guided outcome not available");
            outcome = bytes32(resultData);
            isReady = true;
        } else if (pool.oracleType == OracleType.OPEN) {
            (bool isSettled, bytes memory resultData) = IOptimisticOracle(optimisticOracle).getOutcome(pool.marketId);
            require(isSettled, "Optimistic outcome not finalized");
            outcome = bytes32(resultData);
            isReady = true;
        }

        require(isReady, "Outcome not ready");

        pool.result = outcome;
        pool.flags |= 1; // Set settled bit
        bool creatorSideWon = (outcome != pool.predictedOutcome);
        if (creatorSideWon) {
            pool.flags |= 2; // Set creatorSideWon bit
        }
        pool.resultTimestamp = block.timestamp;

        _removePoolFromCreatorActiveList(poolId);
        
        emit PoolSettled(poolId, outcome, creatorSideWon, block.timestamp);
    }

    // --- Claims ---

    function claim(uint256 poolId) external validPool(poolId) {
        Pool memory pool = pools[poolId];
        require(_isPoolSettled(poolId), "Not settled");
        require(!claimed[poolId][msg.sender], "Already claimed");

        claimed[poolId][msg.sender] = true;

        uint256 payout = 0;
        uint256 stake = 0;

        if (_poolCreatorSideWon(poolId)) {
            // LP wins
            stake = lpStakes[poolId][msg.sender];
            if (stake > 0) {
                uint256 sharePercentage = (stake * 10000) / pool.totalCreatorSideStake;
                payout = stake + ((pool.totalBettorStake * sharePercentage) / 10000);
            }
        } else {
            // Bettor wins
            stake = bettorStakes[poolId][msg.sender];
            if (stake > 0) {
                uint256 poolOdds = uint256(pool.odds);
                payout = (stake * poolOdds) / 100;
                uint256 profit = payout - stake;
                uint256 fee = (profit * adjustedFeeRate(msg.sender)) / 10000;
                payout -= fee;

                // Track fees
                if (fee > 0) {
                    if (_poolUsesBitr(poolId)) {
                        totalCollectedBITR += fee;
                    } else {
                        totalCollectedSTT += fee;
                    }
                }

                // Reputation for high-value bets
                uint256 minValueSTT = 10 * 1e18;
                uint256 minValueBITR = 2000 * 1e18;
                bool qualifiesForReputation = _poolUsesBitr(poolId) ? 
                    (stake >= minValueBITR) : (stake >= minValueSTT);
                
                if (qualifiesForReputation) {
                    emit ReputationActionOccurred(msg.sender, ReputationSystem.ReputationAction.BET_WON_HIGH_VALUE, stake, bytes32(poolId), block.timestamp);
                }
            }
        }

        if (payout > 0) {
            if (_poolUsesBitr(poolId)) {
                require(bitrToken.transfer(msg.sender, payout), "BITR payout failed");
            } else {
                (bool success, ) = payable(msg.sender).call{value: payout}("");
                require(success, "STT payout failed");
            }
            emit RewardClaimed(poolId, msg.sender, payout);
        }
    }

    // --- Fee Management ---

    function adjustedFeeRate(address user) public view returns (uint256) {
        uint256 bitrBalance = bitrToken.balanceOf(user);
        if (bitrBalance >= 50000 * 1e18) return platformFee * 50 / 100;  // 50% discount
        if (bitrBalance >= 20000 * 1e18) return platformFee * 70 / 100;  // 30% discount
        if (bitrBalance >= 5000 * 1e18) return platformFee * 80 / 100;   // 20% discount
        if (bitrBalance >= 2000 * 1e18) return platformFee * 90 / 100;   // 10% discount
        return platformFee;
    }

    function distributeFees(address stakingContract) external {
        require(msg.sender == feeCollector, "Only fee collector");
        uint256 _stt = totalCollectedSTT;
        uint256 _bitr = totalCollectedBITR;

        if (_stt > 0) {
            uint256 sttStakers = (_stt * 30) / 100;
            totalCollectedSTT = 0;
            (bool success1, ) = payable(feeCollector).call{value: _stt - sttStakers}("");
            require(success1, "STT fee collector transfer failed");
            (bool success2, ) = payable(stakingContract).call{value: sttStakers}("");
            require(success2, "STT staking transfer failed");
        }
        
        if (_bitr > 0) {
            uint256 bitrStakers = (_bitr * 30) / 100;
            totalCollectedBITR = 0;
            bitrToken.transfer(feeCollector, _bitr - bitrStakers);
            bitrToken.transfer(stakingContract, bitrStakers);
        }

        if (_stt > 0 || _bitr > 0) {
            IBitredictStaking(stakingContract).addRevenue((_bitr * 30) / 100, (_stt * 30) / 100);
        }
    }

    // --- Pool Management ---

    function addToWhitelist(uint256 poolId, address user) external validPool(poolId) {
        require(msg.sender == pools[poolId].creator, "Not creator");
        poolWhitelist[poolId][user] = true;
        emit UserWhitelisted(poolId, user);
    }

    function removeFromWhitelist(uint256 poolId, address user) external validPool(poolId) {
        require(msg.sender == pools[poolId].creator, "Not creator");
        poolWhitelist[poolId][user] = false;
    }

    function refundPool(uint256 poolId) external validPool(poolId) {
        Pool storage pool = pools[poolId];
        require(!_isPoolSettled(poolId), "Already settled");
        require(block.timestamp > pool.arbitrationDeadline, "Arbitration period not expired");
        
        pool.flags |= 1; // Set settled bit
        
        // Refund LPs
        address[] memory lps = poolLPs[poolId];
        for (uint256 i = 0; i < lps.length; i++) {
            address lp = lps[i];
            uint256 stake = lpStakes[poolId][lp];
            if (stake > 0) {
                if (_poolUsesBitr(poolId)) {
                    require(bitrToken.transfer(lp, stake), "BITR LP refund failed");
                } else {
                    (bool success, ) = payable(lp).call{value: stake}("");
                    require(success, "STT LP refund failed");
                }
            }
        }
        
        // Refund bettors
        address[] memory bettors = poolBettors[poolId];
        for (uint256 i = 0; i < bettors.length; i++) {
            address bettor = bettors[i];
            uint256 stake = bettorStakes[poolId][bettor];
            if (stake > 0) {
                if (_poolUsesBitr(poolId)) {
                    require(bitrToken.transfer(bettor, stake), "BITR bettor refund failed");
                } else {
                    (bool success, ) = payable(bettor).call{value: stake}("");
                    require(success, "STT bettor refund failed");
                }
            }
        }
        
        _removePoolFromCreatorActiveList(poolId);
        emit PoolRefunded(poolId, "Arbitration timeout");
    }

    // --- View Functions for Direct Contract Queries ---

    function getPool(uint256 poolId) external view validPool(poolId) returns (Pool memory) {
        return pools[poolId];
    }

    function getActivePools() external view returns (uint256[] memory) {
        uint256[] memory activePools = new uint256[](poolCount);
        uint256 count = 0;
        
        for (uint256 i = 0; i < poolCount; i++) {
            if (!_isPoolSettled(i) && block.timestamp < pools[i].bettingEndTime) {
                activePools[count] = i;
                count++;
            }
        }
        
        // Resize array
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = activePools[i];
        }
        
        return result;
    }

    function getPoolsByCreator(address creator) external view returns (uint256[] memory) {
        return creatorActivePools[creator];
    }

    function getPoolsByCategory(bytes32 categoryHash) external view returns (uint256[] memory) {
        return categoryPools[categoryHash];
    }

    function poolExists(uint256 poolId) external view returns (bool) {
        return poolId < poolCount;
    }

    // --- Analytics View Functions ---

    function getPoolAnalytics(uint256 poolId) external view validPool(poolId) returns (PoolAnalytics memory) {
        return poolAnalytics[poolId];
    }

    function getCreatorStats(address creator) external view returns (CreatorStats memory) {
        return creatorStats[creator];
    }

    function getCategoryStats(string memory category) external view returns (CategoryStats memory) {
        return categoryStats[category];
    }

    function getGlobalStats() external view returns (GlobalStats memory) {
        return globalStats;
    }

    function getTopCreators(uint256 limit) external view returns (address[] memory creators, uint256[] memory volumes) {
        // Simple implementation - in production, this could be optimized with sorting
        creators = new address[](limit);
        volumes = new uint256[](limit);
        
        // This is a simplified version - would need more sophisticated sorting in production
        uint256 count = 0;
        // Implementation would iterate through all creators and sort by volume
        // For now, returning empty arrays as placeholder
        
        return (creators, volumes);
    }





    function updateStreak(address user, bool won) external {
        require(msg.sender == address(this) || msg.sender == owner(), "Unauthorized");
        
        if (won) {
            predictionStreaks[user]++;
            if (predictionStreaks[user] > longestStreak[user]) {
                longestStreak[user] = predictionStreaks[user];
            }
            // Streak bonuses: 2x, 3x, 5x rewards for long streaks
            streakMultiplier[user] = calculateStreakMultiplier(predictionStreaks[user]);
        } else {
            predictionStreaks[user] = 0;
            streakMultiplier[user] = 1;
        }
    }

    function calculateStreakMultiplier(uint256 streak) internal pure returns (uint256) {
        if (streak >= 20) return 5;
        if (streak >= 10) return 3;
        if (streak >= 5) return 2;
        return 1;
    }


    // --- Internal Helper Functions ---

    function _isPoolSettled(uint256 poolId) internal view returns (bool) {
        return (pools[poolId].flags & 1) != 0;
    }

    function _poolCreatorSideWon(uint256 poolId) internal view returns (bool) {
        return (pools[poolId].flags & 2) != 0;
    }

    function _isPoolPrivate(uint256 poolId) internal view returns (bool) {
        return (pools[poolId].flags & 4) != 0;
    }

    function _poolUsesBitr(uint256 poolId) internal view returns (bool) {
        return (pools[poolId].flags & 8) != 0;
    }

    function _isPoolFilledAbove60(uint256 poolId) internal view returns (bool) {
        return (pools[poolId].flags & 16) != 0;
    }

    function _removePoolFromCreatorActiveList(uint256 poolId) internal {
        address creator = pools[poolId].creator;
        uint256[] storage activePools = creatorActivePools[creator];
        uint256 index = poolIdToCreatorIndex[poolId];
        
        if (index < activePools.length && activePools[index] == poolId) {
            uint256 lastIndex = activePools.length - 1;
            if (index != lastIndex) {
                uint256 lastPoolId = activePools[lastIndex];
                activePools[index] = lastPoolId;
                poolIdToCreatorIndex[lastPoolId] = index;
            }
            activePools.pop();
            delete poolIdToCreatorIndex[poolId];
        }
    }

    function _updatePoolAnalytics(uint256 poolId, uint256 amount, uint256 newParticipants) internal {
        PoolAnalytics storage analytics = poolAnalytics[poolId];
        
        analytics.totalVolume += amount;
        analytics.participantCount += newParticipants;
        analytics.lastActivityTime = block.timestamp;
        
        if (analytics.participantCount > 0) {
            analytics.averageBetSize = analytics.totalVolume / analytics.participantCount;
        }
        
        Pool memory pool = pools[poolId];
        if (pool.maxBettorStake > 0) {
            analytics.fillPercentage = (pool.totalBettorStake * 100) / pool.maxBettorStake;
        }
        
        analytics.liquidityRatio = pool.totalCreatorSideStake > 0 ? 
            (pool.totalBettorStake * 100) / pool.totalCreatorSideStake : 100;
        
        // Mark as hot pool if high activity
        analytics.isHotPool = analytics.participantCount >= 10 && 
            block.timestamp - analytics.lastActivityTime < 1 hours;
        
        emit AnalyticsUpdated(poolId, analytics.totalVolume, analytics.participantCount);
    }

    function _updateCreatorStats(address creator, uint256 amount, bool isNewPool) internal {
        CreatorStats storage stats = creatorStats[creator];
        
        if (isNewPool) {
            stats.totalPoolsCreated++;
            stats.activePoolsCount++;
        }
        
        stats.totalVolumeGenerated += amount;
        
        if (stats.totalPoolsCreated > 0) {
            stats.averagePoolSize = stats.totalVolumeGenerated / stats.totalPoolsCreated;
        }
        
        if (address(reputationSystem) != address(0)) {
            stats.reputationScore = reputationSystem.getUserReputation(creator);
        }
    }

    function _updateCategoryStats(string memory category, uint256 amount) internal {
        CategoryStats storage stats = categoryStats[category];
        
        stats.totalPools++;
        stats.totalVolume += amount;
        stats.lastActivityTime = block.timestamp;
        
        if (stats.totalPools > 0) {
            stats.averageOdds = stats.totalVolume / stats.totalPools; // Simplified calculation
        }
    }

    function _updateGlobalStats(uint256 amount, bool isNewPool) internal {
        if (isNewPool) {
            globalStats.totalPools++;
        }
        
        globalStats.totalVolume += amount;
        globalStats.lastUpdated = block.timestamp;
        
        if (globalStats.totalPools > 0) {
            globalStats.averagePoolSize = globalStats.totalVolume / globalStats.totalPools;
        }
    }
}
