// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// Enhanced Reputation System interface
interface IEnhancedReputationSystem {
    enum ReputationAction {
        POOL_CREATED,
        BET_PLACED,
        BET_WON,
        BET_WON_HIGH_VALUE,
        BET_WON_MASSIVE,
        POOL_FILLED_ABOVE_60,
        POOL_SPAMMED,
        OUTCOME_PROPOSED_CORRECTLY,
        OUTCOME_PROPOSED_INCORRECTLY,
        CHALLENGE_SUCCESSFUL,
        CHALLENGE_FAILED,
        ODDYSSEY_ACTION,
        POOL_BOOSTED,
        COMBO_POOL_CREATED,
        COMBO_BET_WON,
        STREAK_BONUS,
        SOCIAL_ENGAGEMENT,
        INFLUENCE_GAINED,
        VERIFICATION_ACHIEVED,
        PREMIUM_ACTION
    }
    
    function processReputationAction(
        address user,
        ReputationAction action,
        string calldata details
    ) external;
}

contract Oddyssey is Ownable, ReentrancyGuard {
    uint256 public constant DAILY_LEADERBOARD_SIZE = 5;
    uint256 public constant MATCH_COUNT = 10;
    uint256 public constant ODDS_SCALING_FACTOR = 1000;
    uint256 public constant MIN_CORRECT_PREDICTIONS = 7;
    uint256 public constant MAX_CYCLES_TO_RESOLVE = 50;
    uint256 public immutable DEV_FEE_PERCENTAGE;
    uint256 public immutable PRIZE_ROLLOVER_FEE_PERCENTAGE;

    enum BetType { MONEYLINE, OVER_UNDER }
    enum MoneylineResult { NotSet, HomeWin, Draw, AwayWin }
    enum OverUnderResult { NotSet, Over, Under }
    enum CycleState { NotStarted, Active, Ended, Resolved }

    struct Result {
        MoneylineResult moneyline;
        OverUnderResult overUnder;
    }

    struct Match {
        uint64 id;
        uint64 startTime;
        uint32 oddsHome;
        uint32 oddsDraw;
        uint32 oddsAway;
        uint32 oddsOver;
        uint32 oddsUnder;
        string homeTeam;
        string awayTeam;
        string leagueName;
        Result result;
    }

    struct UserPrediction {
        uint64 matchId;
        BetType betType;
        string selection; // Changed from bytes32 to string for frontend compatibility
        uint32 selectedOdd;
        string homeTeam; // Store team names for frontend display
        string awayTeam;
        string leagueName;
    }

    struct Slip {
        address player;
        uint256 cycleId;
        uint256 placedAt;
        UserPrediction[MATCH_COUNT] predictions;
        uint256 finalScore;
        uint8 correctCount;
        bool isEvaluated;
    }

    struct LeaderboardEntry {
        address player;
        uint256 slipId;
        uint256 finalScore;
        uint8 correctCount;
    }

    struct GlobalStats {
        uint256 totalVolume;
        uint32 totalSlips;
        uint256 highestOdd;
    }

    struct DailyStats {
        uint256 slipCount;
        uint256 userCount;
        uint256 volume;
        uint256 correctPredictions;
        uint256 evaluatedSlips;
        uint256 averageScore;
        uint256 maxScore;
        uint256 minScore;
        uint256 winnersCount;
    }

    struct CycleStats {
        uint256 volume;
        uint32 slips;
        uint32 evaluatedSlips;
    }

    struct CycleInfo {
        uint256 startTime;
        uint256 endTime;
        uint256 prizePool;
        uint32 slipCount;
        uint32 evaluatedSlips;
        CycleState state;
        bool hasWinner;
    }



    struct UserStats {
        uint256 totalSlips;
        uint256 totalWins;
        uint256 bestScore;
        uint256 averageScore;
        uint256 winRate;
        uint256 currentStreak;
        uint256 bestStreak;
        uint256 lastActiveCycle;
    }

    address public oracle;
    address public immutable devWallet;
    uint256 public entryFee;
    uint256 public dailyCycleId;
    uint256 public slipCount;
    
    IEnhancedReputationSystem public enhancedReputationSystem;

    mapping(address => UserStats) public userStats;
    
    mapping(address => uint256) public userOddysseyReputation;
    mapping(address => uint256) public userOddysseyCorrectPredictions;

    mapping(uint256 => Match[MATCH_COUNT]) public dailyMatches;
    mapping(uint256 => uint256) public dailyCycleEndTimes;
    mapping(uint256 => uint256) public claimableStartTimes;
    mapping(uint256 => uint256) public dailyPrizePools;
    mapping(uint256 => CycleStats) public cycleStats;
    mapping(uint256 => CycleInfo) public cycleInfo;

    mapping(uint256 => Slip) public slips;
    mapping(uint256 => mapping(address => uint256[])) private s_userSlipsPerCycle;
    mapping(address => uint256[]) private s_userSlips;
    mapping(uint256 => LeaderboardEntry[DAILY_LEADERBOARD_SIZE]) public dailyLeaderboards;
    mapping(uint256 => bool) public isCycleResolved;
    mapping(uint256 => mapping(uint8 => bool)) public prizeClaimed;

    // Daily Statistics
    mapping(uint256 => uint256) public dailySlipCount;
    mapping(uint256 => uint256) public dailyUserCount;
    mapping(uint256 => uint256) public dailyVolume;
    mapping(uint256 => uint256) public dailyCorrectPredictions;
    mapping(uint256 => uint256) public dailyEvaluatedSlips;
    mapping(uint256 => uint256) public dailyAverageScore;
    mapping(uint256 => uint256) public dailyMaxScore;
    mapping(uint256 => uint256) public dailyMinScore;
    mapping(uint256 => uint256) public dailyWinnersCount;

    GlobalStats public stats;

    event OracleSet(address indexed newOracle);
    event EntryFeeSet(uint256 indexed newFee);
    event CycleStarted(uint256 indexed cycleId, uint256 endTime);
    event SlipPlaced(uint256 indexed cycleId, address indexed player, uint256 indexed slipId);
    event SlipEvaluated(uint256 indexed slipId, address indexed player, uint256 indexed cycleId, uint8 correctCount, uint256 finalScore);
    event CycleEnded(uint256 indexed cycleId, uint256 endTime, uint32 totalSlips);
    event CycleResolved(uint256 indexed cycleId, uint256 prizePool);
    event LeaderboardUpdated(uint256 indexed cycleId, address indexed player, uint256 indexed slipId, uint8 rank, uint256 finalScore);
    event AnalyticsUpdated(uint256 indexed cycleId, uint256 totalVolume, uint32 totalSlips, uint256 averageScore);
    event PrizeClaimed(uint256 indexed cycleId, address indexed player, uint256 rank, uint256 amount);
    event PrizeRollover(uint256 indexed fromCycleId, uint256 indexed toCycleId, uint256 amount);
    event UserStatsUpdated(address indexed user, uint256 totalSlips, uint256 totalWins, uint256 bestScore, uint256 winRate);
    event OddysseyReputationUpdated(address indexed user, uint256 pointsEarned, uint256 correctPredictions, uint256 totalReputation);
    error Unauthorized();
    error InvalidInput();
    error InvalidState();
    error InsufficientFunds();
    error InvalidTiming();
    error DataNotFound();
    error TransferFailed();

    modifier onlyOracle() {
        if (msg.sender != oracle) revert Unauthorized();
        _;
    }
    
    modifier validCycleId(uint256 _cycleId) {
        if (_cycleId == 0 || _cycleId > dailyCycleId) revert DataNotFound();
        _;
    }
    
    modifier cycleExists(uint256 _cycleId) {
        if (cycleInfo[_cycleId].startTime == 0) revert DataNotFound();
        _;
    }
    
    modifier cycleActive(uint256 _cycleId) {
        if (cycleInfo[_cycleId].state != CycleState.Active) revert InvalidState();
        _;
    }
    
    modifier cycleResolved(uint256 _cycleId) {
        if (cycleInfo[_cycleId].state != CycleState.Resolved) revert InvalidState();
        _;
    }
    
    modifier bettingOpen(uint256 _cycleId) {
        CycleInfo storage cycle = cycleInfo[_cycleId];
        if (cycle.state != CycleState.Active) revert InvalidState();
        if (block.timestamp >= cycle.endTime) revert InvalidTiming();
        _;
    }
    
    modifier validPayment() {
        if (msg.value != entryFee) revert InsufficientFunds();
        _;
    }
    
    modifier validSlipId(uint256 _slipId) {
        if (_slipId >= slipCount) revert DataNotFound();
        _;
    }



    // --- Constructor ---

    constructor(address _devWallet, uint256 _initialEntryFee) Ownable(msg.sender) {
        if (_devWallet == address(0)) revert InvalidInput();
        if (_initialEntryFee != 0.5 ether) revert InvalidInput(); // Must be exactly 0.5 STT
        
        devWallet = _devWallet;
        entryFee = _initialEntryFee;
        oracle = msg.sender; // Initially set oracle to deployer
        DEV_FEE_PERCENTAGE = 500; // 5%
        PRIZE_ROLLOVER_FEE_PERCENTAGE = 500; // 5%
    }

    // --- Admin Functions ---

    function setOracle(address _newOracle) external onlyOwner {
        if (_newOracle == address(0)) revert InvalidInput();
        if (_newOracle == oracle) revert InvalidInput();
        address oldOracle = oracle;
        oracle = _newOracle;
        emit OracleSet(_newOracle);
    }

    function setEntryFee(uint256 _newFee) external onlyOwner {
        if (_newFee != 0.5 ether) revert InvalidInput(); // Must be exactly 0.5 STT
        if (_newFee == entryFee) revert InvalidInput();
        entryFee = _newFee;
        emit EntryFeeSet(_newFee);
    }



    // --- Oracle Functions ---

    function startDailyCycle(Match[MATCH_COUNT] memory _matches) external onlyOracle {
        // Validate that all matches have valid data
        uint64 earliestStartTime = type(uint64).max;
        
        for (uint i = 0; i < MATCH_COUNT; i++) {
            Match memory matchData = _matches[i];
            
            // Validate match data
            if (matchData.id == 0) revert DataNotFound();
            if (matchData.startTime <= block.timestamp + 300) revert InvalidTiming();
            if (matchData.oddsHome == 0 || matchData.oddsDraw == 0 || matchData.oddsAway == 0) revert InvalidInput();
            if (matchData.oddsOver == 0 || matchData.oddsUnder == 0) revert InvalidInput();
            
            // Check for duplicates
            for (uint j = i + 1; j < MATCH_COUNT; j++) {
                if (matchData.id == _matches[j].id) revert InvalidInput();
            }
            
            if (matchData.startTime < earliestStartTime) {
                earliestStartTime = matchData.startTime;
            }
        }
        
        if (earliestStartTime <= block.timestamp + 300) revert InvalidTiming();

        dailyCycleId++;
        uint256 cycle = dailyCycleId;

        _handlePrizeRollover(cycle - 1);

        // Set betting deadline 5 minutes before first match
        uint256 bettingDeadline = earliestStartTime - 300;

        // Store cycle data
        dailyMatches[cycle] = _matches;
        dailyCycleEndTimes[cycle] = bettingDeadline;
        claimableStartTimes[cycle] = type(uint256).max; // Default to indefinite
        isCycleResolved[cycle] = false;

        // Initialize cycle info
        cycleInfo[cycle] = CycleInfo({
            startTime: block.timestamp,
            endTime: bettingDeadline,
            prizePool: 0,
            slipCount: 0,
            evaluatedSlips: 0,
            state: CycleState.Active,
            hasWinner: false
        });

        emit CycleStarted(cycle, bettingDeadline);
    }

    function resolveDailyCycle(uint256 _cycleId, Result[MATCH_COUNT] memory _results) 
        public 
        onlyOracle 
        validCycleId(_cycleId)
        cycleExists(_cycleId)
    {
        CycleInfo storage cycle = cycleInfo[_cycleId];
        
        if (cycle.state == CycleState.Resolved) revert InvalidState();
        if (block.timestamp <= cycle.endTime) revert InvalidTiming();

        // Update match results
        for (uint i = 0; i < MATCH_COUNT; i++) {
            dailyMatches[_cycleId][i].result = _results[i];
        }

        // Update cycle state
        cycle.state = CycleState.Resolved;
        isCycleResolved[_cycleId] = true;
        
        // Set claiming deadline (24 hours from now, or immediate if no slips)
        if (cycle.slipCount == 0) {
            claimableStartTimes[_cycleId] = block.timestamp;
        } else {
            claimableStartTimes[_cycleId] = block.timestamp + 24 hours;
        }

        emit CycleResolved(_cycleId, dailyPrizePools[_cycleId]);
    }

    /**
     * @dev Resolve multiple cycles in batch (gas efficient)
     * @param _cycleIds Array of cycle IDs to resolve
     * @param _results Array of results for each cycle
     */
    function resolveMultipleCycles(
        uint256[] memory _cycleIds,
        Result[MATCH_COUNT][] memory _results
    ) external onlyOracle {
        if (_cycleIds.length != _results.length) revert InvalidInput();
        if (_cycleIds.length > MAX_CYCLES_TO_RESOLVE) revert InvalidInput();
        
        for (uint i = 0; i < _cycleIds.length; i++) {
            resolveDailyCycle(_cycleIds[i], _results[i]);
        }
    }

    // --- Public Functions ---

    function placeSlip(UserPrediction[MATCH_COUNT] memory _predictions) external payable nonReentrant {
        uint256 cycle = dailyCycleId;
        if (cycle == 0) revert InvalidState();
        
        CycleInfo storage currentCycleInfo = cycleInfo[cycle];
        if (currentCycleInfo.state != CycleState.Active) revert InvalidState();
        if (block.timestamp >= currentCycleInfo.endTime) revert InvalidTiming();

        // Check exact payment
        if (msg.value != entryFee) revert InsufficientFunds();

        Match[MATCH_COUNT] storage currentMatches = dailyMatches[cycle];

        for (uint i = 0; i < MATCH_COUNT; i++) {
            UserPrediction memory p = _predictions[i];
            // Ensure predictions are for the correct matches and in order
            if (p.matchId != currentMatches[i].id) revert InvalidInput();
            Match memory m = currentMatches[i];

            uint32 odd;
            if (p.betType == BetType.MONEYLINE) {
                if (keccak256(bytes(p.selection)) == keccak256(bytes("1"))) odd = m.oddsHome;
                else if (keccak256(bytes(p.selection)) == keccak256(bytes("X"))) odd = m.oddsDraw;
                else if (keccak256(bytes(p.selection)) == keccak256(bytes("2"))) odd = m.oddsAway;
                else revert InvalidInput();
            } else if (p.betType == BetType.OVER_UNDER) {
                if (keccak256(bytes(p.selection)) == keccak256(bytes("Over"))) odd = m.oddsOver;
                else if (keccak256(bytes(p.selection)) == keccak256(bytes("Under"))) odd = m.oddsUnder;
                else revert InvalidInput();
            } else {
                revert InvalidInput();
            }
            if (odd == 0) revert InvalidInput();
            if (p.selectedOdd != odd) revert InvalidInput();
        }

        // Enhance predictions with team names from current matches
        UserPrediction[MATCH_COUNT] memory enhancedPredictions;
        for (uint i = 0; i < MATCH_COUNT; i++) {
            enhancedPredictions[i] = UserPrediction({
                matchId: _predictions[i].matchId,
                betType: _predictions[i].betType,
                selection: _predictions[i].selection,
                selectedOdd: _predictions[i].selectedOdd,
                homeTeam: currentMatches[i].homeTeam,
                awayTeam: currentMatches[i].awayTeam,
                leagueName: currentMatches[i].leagueName
            });
        }

        uint256 slipId = slipCount;
        slips[slipId] = Slip({
            player: msg.sender,
            cycleId: cycle,
            placedAt: block.timestamp,
            predictions: enhancedPredictions,
            finalScore: 0,
            correctCount: 0,
            isEvaluated: false
        });
        slipCount++;

        s_userSlipsPerCycle[cycle][msg.sender].push(slipId);
        s_userSlips[msg.sender].push(slipId);
        dailyPrizePools[cycle] += msg.value;
        
        // Update stats
        stats.totalVolume += msg.value;
        stats.totalSlips++;
        cycleStats[cycle].volume += msg.value;
        cycleStats[cycle].slips++;
        currentCycleInfo.prizePool += msg.value;
        currentCycleInfo.slipCount++;
        
        // Update daily stats
        dailySlipCount[cycle]++;
        dailyVolume[cycle] += msg.value;
        
        // Track unique users for this cycle
        if (s_userSlipsPerCycle[cycle][msg.sender].length == 1) {
            dailyUserCount[cycle]++;
        }
        
        // Update user stats
        _updateUserStats(msg.sender, cycle, true);
        
        // Note: Auto-evaluate is handled by the backend for better gas efficiency
        // Users can set autoEvaluate preference, but actual evaluation happens via backend
        
        emit SlipPlaced(cycle, msg.sender, slipId);
    }

    function evaluateSlip(uint256 _slipId) external nonReentrant {
        if (_slipId >= slipCount) revert DataNotFound();
        
        Slip storage slip = slips[_slipId];
        uint256 cycleIdOfSlip = slip.cycleId;

        if (cycleInfo[cycleIdOfSlip].state != CycleState.Resolved) revert InvalidState();
        if (slip.isEvaluated) revert InvalidState();
        
        uint8 correctCount = 0;
        uint256 score = ODDS_SCALING_FACTOR;
        Match[MATCH_COUNT] storage currentMatches = dailyMatches[cycleIdOfSlip];

        for(uint i = 0; i < MATCH_COUNT; i++) {
            UserPrediction memory p = slip.predictions[i];
            Match memory m = currentMatches[i];
            bool isCorrect = false;

            if (p.betType == BetType.MONEYLINE) {
                if ((keccak256(bytes(p.selection)) == keccak256(bytes("1")) && m.result.moneyline == MoneylineResult.HomeWin) ||
                    (keccak256(bytes(p.selection)) == keccak256(bytes("X")) && m.result.moneyline == MoneylineResult.Draw) ||
                    (keccak256(bytes(p.selection)) == keccak256(bytes("2")) && m.result.moneyline == MoneylineResult.AwayWin)) {
                    isCorrect = true;
                }
            } else { // OverUnder
                if ((keccak256(bytes(p.selection)) == keccak256(bytes("Over")) && m.result.overUnder == OverUnderResult.Over) ||
                    (keccak256(bytes(p.selection)) == keccak256(bytes("Under")) && m.result.overUnder == OverUnderResult.Under)) {
                    isCorrect = true;
                }
            }

            if (isCorrect) {
                correctCount++;
                // Use the odd stored at the time of placing the bet for score calculation
                score = (score * p.selectedOdd) / ODDS_SCALING_FACTOR;
            }
        }

        slip.correctCount = correctCount;
        slip.isEvaluated = true;
        slip.finalScore = (correctCount > 0) ? score : 0;

        _updateLeaderboard(cycleIdOfSlip, slip.player, _slipId, slip.finalScore, correctCount);
        
        // Update user stats after evaluation
        _updateUserStats(slip.player, cycleIdOfSlip, false);
        
        // Track evaluated slips and check for early claim unlock
        CycleStats storage statsForCycle = cycleStats[cycleIdOfSlip];
        CycleInfo storage cycle = cycleInfo[cycleIdOfSlip];
        
        statsForCycle.evaluatedSlips++;
        cycle.evaluatedSlips++;
        
        // Update daily evaluation stats
        dailyEvaluatedSlips[cycleIdOfSlip]++;
        dailyCorrectPredictions[cycleIdOfSlip] += correctCount;
        
        // Update score statistics
        if (slip.finalScore > 0) {
            if (dailyMaxScore[cycleIdOfSlip] == 0 || slip.finalScore > dailyMaxScore[cycleIdOfSlip]) {
                dailyMaxScore[cycleIdOfSlip] = slip.finalScore;
            }
            if (dailyMinScore[cycleIdOfSlip] == 0 || slip.finalScore < dailyMinScore[cycleIdOfSlip]) {
                dailyMinScore[cycleIdOfSlip] = slip.finalScore;
            }
        }
        
        // Count winners (correctCount >= MIN_CORRECT_PREDICTIONS)
        if (correctCount >= MIN_CORRECT_PREDICTIONS) {
            dailyWinnersCount[cycleIdOfSlip]++;
        }
        
        if (statsForCycle.evaluatedSlips == statsForCycle.slips) {
            claimableStartTimes[cycleIdOfSlip] = block.timestamp;
        }
    }

    function claimPrize(uint256 _cycleId) external nonReentrant {
        if (cycleInfo[_cycleId].state != CycleState.Resolved) revert InvalidState();
        if (block.timestamp < claimableStartTimes[_cycleId]) revert InvalidTiming();
        
        LeaderboardEntry[DAILY_LEADERBOARD_SIZE] storage leaderboard = dailyLeaderboards[_cycleId];
        uint8 rank = 0;
        bool playerFound = false;

        for (uint8 i = 0; i < DAILY_LEADERBOARD_SIZE; i++) {
            if (leaderboard[i].player == msg.sender) {
                rank = i;
                playerFound = true;
                break;
            }
        }

        if (!playerFound) revert DataNotFound();

        if (prizeClaimed[_cycleId][rank]) revert InvalidState();

        uint256 prizeAmount = _calculatePrize(rank, dailyPrizePools[_cycleId]);
        if (prizeAmount == 0) { // This can happen if prize pool was 0
            prizeClaimed[_cycleId][rank] = true;
            return;
        }

        prizeClaimed[_cycleId][rank] = true;

        uint256 devFee = (prizeAmount * DEV_FEE_PERCENTAGE) / 10000;
        uint256 userShare = prizeAmount - devFee;
        
        // Transfer native STT
        (bool success1, ) = payable(devWallet).call{value: devFee}("");
        if (!success1) revert TransferFailed();
        
        (bool success2, ) = payable(msg.sender).call{value: userShare}("");
        if (!success2) revert TransferFailed();

        emit PrizeClaimed(_cycleId, msg.sender, rank, userShare);
    }

    // --- View Functions ---

    function getDailyMatches(uint256 _cycleId) external view returns (Match[MATCH_COUNT] memory) {
        return dailyMatches[_cycleId];
    }

    function getDailyLeaderboard(uint256 _cycleId) external view returns (LeaderboardEntry[DAILY_LEADERBOARD_SIZE] memory) {
        return dailyLeaderboards[_cycleId];
    }

    function getUserSlipsForCycle(address _user, uint256 _cycleId) external view returns (uint256[] memory) {
        return s_userSlipsPerCycle[_cycleId][_user];
    }

    function getUserSlipCount(address _user) external view returns (uint256) {
        return s_userSlips[_user].length;
    }

    function getSlip(uint256 _slipId) external view returns (Slip memory) {
        return slips[_slipId];
    }
    
    function getBatchSlips(uint256[] calldata _slipIds) external view returns (Slip[] memory) {
        Slip[] memory result = new Slip[](_slipIds.length);
        for (uint256 i = 0; i < _slipIds.length; i++) {
            result[i] = slips[_slipIds[i]];
        }
        return result;
    }
    
    function getUserSlipsWithData(address _user, uint256 _cycleId) external view returns (
        uint256[] memory slipIds,
        Slip[] memory slipsData
    ) {
        slipIds = s_userSlipsPerCycle[_cycleId][_user];
        slipsData = new Slip[](slipIds.length);
        for (uint256 i = 0; i < slipIds.length; i++) {
            slipsData[i] = slips[slipIds[i]];
        }
    }

    // --- Consolidated View Functions ---

    /**
     * @dev Get comprehensive user data including stats and reputation
     */
    function getUserData(address _user) external view returns (
        UserStats memory userStatsData,
        uint256 reputation,
        uint256 correctPredictions
    ) {
        return (
            userStats[_user],
            userOddysseyReputation[_user],
            userOddysseyCorrectPredictions[_user]
        );
    }

    /**
     * @dev Get current cycle information with enhanced data
     */
    function getCurrentCycleInfo() external view returns (
        uint256 cycleId,
        uint8 state,
        uint256 endTime,
        uint256 prizePool,
        uint32 cycleSlipCount
    ) {
        cycleId = dailyCycleId;
        if (cycleId > 0) {
            CycleInfo memory info = cycleInfo[cycleId];
            return (cycleId, uint8(info.state), info.endTime, info.prizePool, info.slipCount);
        }
        return (0, 0, 0, 0, 0);
    }

    /**
     * @dev Get detailed cycle status
     */
    function getCycleStatus(uint256 _cycleId) external view returns (
        bool exists,
        uint8 state,
        uint256 endTime,
        uint256 prizePool,
        uint32 cycleSlipCount,
        bool hasWinner
    ) {
        if (_cycleId == 0 || _cycleId > dailyCycleId) {
            return (false, 0, 0, 0, 0, false);
        }
        
        CycleInfo memory info = cycleInfo[_cycleId];
        return (
            info.startTime > 0,
            uint8(info.state),
            info.endTime,
            info.prizePool,
            info.slipCount,
            info.hasWinner
        );
    }

    // --- Batch Operations ---

    function evaluateMultipleSlips(uint256[] memory _slipIds) external {
        for (uint256 i = 0; i < _slipIds.length; i++) {
            this.evaluateSlip(_slipIds[i]);
        }
    }

    function claimMultiplePrizes(uint256[] memory _cycleIds) external {
        for (uint256 i = 0; i < _cycleIds.length; i++) {
            this.claimPrize(_cycleIds[i]);
        }
    }


    // --- Internal Functions ---

    function _updateLeaderboard(uint256 _cycleId, address _player, uint256 _slipId, uint256 _finalScore, uint8 _correctCount) private {
        if (_correctCount < MIN_CORRECT_PREDICTIONS) return;

        LeaderboardEntry[DAILY_LEADERBOARD_SIZE] storage leaderboard = dailyLeaderboards[_cycleId];
        int256 position = -1;

        for (uint256 i = DAILY_LEADERBOARD_SIZE; i > 0; i--) {
            uint256 index = i - 1;
            LeaderboardEntry storage entry = leaderboard[index];
            if (_finalScore > entry.finalScore || (_finalScore == entry.finalScore && _correctCount > entry.correctCount)) {
                position = int256(index);
            } else {
                break;
            }
        }

        if (position != -1) {
            for (uint256 i = DAILY_LEADERBOARD_SIZE - 1; i > uint256(position); i--) {
                leaderboard[i] = leaderboard[i-1];
            }
            leaderboard[uint256(position)] = LeaderboardEntry({player: _player, slipId: _slipId, finalScore: _finalScore, correctCount: _correctCount});
            
            // Mark cycle as having winners
            cycleInfo[_cycleId].hasWinner = true;
        }
    }

    function _calculatePrize(uint8 _rank, uint256 _totalPrizePool) private pure returns (uint256) {
        uint256 percentage;
        if (_rank == 0) percentage = 4000;      // 40%
        else if (_rank == 1) percentage = 3000; // 30%
        else if (_rank == 2) percentage = 2000; // 20%
        else if (_rank == 3) percentage = 500;  // 5%
        else if (_rank == 4) percentage = 500;  // 5%
        else return 0;

        return (_totalPrizePool * percentage) / 10000;
    }

    function _updateUserStats(address _user, uint256 _cycleId, bool _isPlacing) private {
        UserStats storage userStat = userStats[_user];
        
        if (_isPlacing) {
            // Update when placing slip
            userStat.totalSlips++;
            userStat.lastActiveCycle = _cycleId;
        } else {
            // Update when evaluating slip - we need to find the user's slip for this cycle
            uint256[] storage userSlips = s_userSlipsPerCycle[_cycleId][_user];
            if (userSlips.length > 0) {
                uint256 latestSlipId = userSlips[userSlips.length - 1];
                Slip storage slip = slips[latestSlipId];
                
                // Calculate reputation points based on performance (updated to match backend)
                uint256 reputationPoints = 0;
                
                if (slip.correctCount >= MIN_CORRECT_PREDICTIONS) {
                    userStat.totalWins++;
                    
                    // Only add to total correct predictions if slip qualifies
                    userOddysseyCorrectPredictions[_user] += slip.correctCount;
                    
                    // Base points for qualifying (7+ correct)
                    reputationPoints = 3;
                    
                    // Bonus points for high accuracy
                    if (slip.correctCount >= 8) reputationPoints = 4; // Excellent
                    if (slip.correctCount >= 9) reputationPoints = 6; // Outstanding
                    if (slip.correctCount == 10) reputationPoints = 8; // Perfect score
                    
                    // Winner bonus (top 5 in cycle) - check if user is on leaderboard
                    bool isWinner = false;
                    for (uint8 i = 0; i < DAILY_LEADERBOARD_SIZE; i++) {
                        if (dailyLeaderboards[_cycleId][i].player == _user) {
                            isWinner = true;
                            break;
                        }
                    }
                    if (isWinner) reputationPoints += 10;
                    
                    // Champion bonus (can be earned only once) - simplified logic
                    // In practice, this would be tracked separately
                    // reputationPoints += 15; // Champion bonus
                    
                    // Update best score
                    if (slip.finalScore > userStat.bestScore) {
                        userStat.bestScore = slip.finalScore;
                        reputationPoints += 2; // Bonus for new best score
                    }
                    
                    // Update streaks
                    if (_cycleId == userStat.lastActiveCycle + 1) {
                        userStat.currentStreak++;
                        if (userStat.currentStreak > userStat.bestStreak) {
                            userStat.bestStreak = userStat.currentStreak;
                            reputationPoints += 3; // Bonus for new best streak
                        }
                    } else {
                        userStat.currentStreak = 1;
                    }
                } else {
                    userStat.currentStreak = 0;
                    // Participation points (even if not winning)
                    reputationPoints = 1;
                    // Do NOT add to total correct predictions for slips < 7 correct
                }
                
                // Update total reputation
                userOddysseyReputation[_user] += reputationPoints;
                
                // Integration with Enhanced Reputation System
                if (address(enhancedReputationSystem) != address(0)) {
                    enhancedReputationSystem.processReputationAction(
                        _user,
                        IEnhancedReputationSystem.ReputationAction.ODDYSSEY_ACTION,
                        string(abi.encodePacked("Oddyssey cycle ", _cycleId, " - ", slip.correctCount, " correct"))
                    );
                }
                
                // Update average score and win rate
                if (userStat.totalSlips > 0) {
                    userStat.averageScore = (userStat.averageScore * (userStat.totalSlips - 1) + slip.finalScore) / userStat.totalSlips;
                    userStat.winRate = (userStat.totalWins * 10000) / userStat.totalSlips;
                }
                
                emit OddysseyReputationUpdated(_user, reputationPoints, slip.correctCount, userOddysseyReputation[_user]);
            }
        }
        
        emit UserStatsUpdated(_user, userStat.totalSlips, userStat.totalWins, userStat.bestScore, userStat.winRate);
    }

    function _handlePrizeRollover(uint256 _previousCycleId) private {
        if (_previousCycleId == 0) return;

        LeaderboardEntry[DAILY_LEADERBOARD_SIZE] storage leaderboard = dailyLeaderboards[_previousCycleId];
        if (leaderboard[0].player == address(0) || leaderboard[0].correctCount < MIN_CORRECT_PREDICTIONS) {
            uint256 prizeToRoll = dailyPrizePools[_previousCycleId];
            if (prizeToRoll > 0) {
                uint256 fee = (prizeToRoll * PRIZE_ROLLOVER_FEE_PERCENTAGE) / 10000;
                uint256 amountToTransfer = prizeToRoll - fee;

                dailyPrizePools[_previousCycleId] = 0;
                dailyPrizePools[_previousCycleId + 1] += amountToTransfer;
                
                // Transfer rollover fee to dev wallet
                (bool success, ) = payable(devWallet).call{value: fee}("");
                if (!success) revert TransferFailed();

                emit PrizeRollover(_previousCycleId, _previousCycleId + 1, amountToTransfer);
            }
        }
    }
    
    // --- View Functions for External Integration ---
    
    // Removed duplicate getCycleStatus function
    
    function getCurrentCycle() external view returns (uint256) {
        return dailyCycleId;
    }
    
    function isCycleInitialized(uint256 _cycleId) external view returns (bool) {
        if (_cycleId > dailyCycleId || _cycleId == 0) {
            return false;
        }
        
        // Check if the cycle has matches data
        return dailyMatches[_cycleId][0].id > 0;
    }
    
    function getCycleMatches(uint256 _cycleId) external view returns (Match[MATCH_COUNT] memory) {
        require(_cycleId <= dailyCycleId && _cycleId > 0, "Cycle does not exist");
        
        // Check if the cycle has any matches data
        Match[MATCH_COUNT] memory matches = dailyMatches[_cycleId];
        
        // If the first match has no ID, the cycle might be uninitialized
        if (matches[0].id == 0) {
            // Return empty matches array for uninitialized cycles
            // This prevents revert and allows the system to handle gracefully
            Match[MATCH_COUNT] memory emptyMatches;
            return emptyMatches;
        }
        
        return matches;
    }
    
    /**
     * @dev Set the enhanced reputation system contract (only owner)
     */
    function setEnhancedReputationSystem(address _enhancedReputationSystem) external onlyOwner {
        enhancedReputationSystem = IEnhancedReputationSystem(_enhancedReputationSystem);
    }

    // ===== DAILY STATISTICS FUNCTIONS =====
    
    /**
     * @dev Get comprehensive daily statistics for a cycle
     */
    function getDailyStats(uint256 _cycleId) external view returns (DailyStats memory) {
        return DailyStats({
            slipCount: dailySlipCount[_cycleId],
            userCount: dailyUserCount[_cycleId],
            volume: dailyVolume[_cycleId],
            correctPredictions: dailyCorrectPredictions[_cycleId],
            evaluatedSlips: dailyEvaluatedSlips[_cycleId],
            averageScore: dailyEvaluatedSlips[_cycleId] > 0 ? 
                (dailyCorrectPredictions[_cycleId] * ODDS_SCALING_FACTOR) / dailyEvaluatedSlips[_cycleId] : 0,
            maxScore: dailyMaxScore[_cycleId],
            minScore: dailyMinScore[_cycleId],
            winnersCount: dailyWinnersCount[_cycleId]
        });
    }
    
    /**
     * @dev Get daily slip count for a cycle
     */
    function getDailySlipCount(uint256 _cycleId) external view returns (uint256) {
        return dailySlipCount[_cycleId];
    }
    
    /**
     * @dev Get daily user count for a cycle
     */
    function getDailyUserCount(uint256 _cycleId) external view returns (uint256) {
        return dailyUserCount[_cycleId];
    }
    
    /**
     * @dev Get daily volume for a cycle
     */
    function getDailyVolume(uint256 _cycleId) external view returns (uint256) {
        return dailyVolume[_cycleId];
    }
    
    /**
     * @dev Get daily correct predictions for a cycle
     */
    function getDailyCorrectPredictions(uint256 _cycleId) external view returns (uint256) {
        return dailyCorrectPredictions[_cycleId];
    }
    
    /**
     * @dev Get daily evaluated slips for a cycle
     */
    function getDailyEvaluatedSlips(uint256 _cycleId) external view returns (uint256) {
        return dailyEvaluatedSlips[_cycleId];
    }
    
    /**
     * @dev Get daily average score for a cycle
     */
    function getDailyAverageScore(uint256 _cycleId) external view returns (uint256) {
        if (dailyEvaluatedSlips[_cycleId] == 0) return 0;
        return (dailyCorrectPredictions[_cycleId] * ODDS_SCALING_FACTOR) / dailyEvaluatedSlips[_cycleId];
    }
    
    /**
     * @dev Get daily max score for a cycle
     */
    function getDailyMaxScore(uint256 _cycleId) external view returns (uint256) {
        return dailyMaxScore[_cycleId];
    }
    
    /**
     * @dev Get daily min score for a cycle
     */
    function getDailyMinScore(uint256 _cycleId) external view returns (uint256) {
        return dailyMinScore[_cycleId];
    }
    
    /**
     * @dev Get daily winners count for a cycle
     */
    function getDailyWinnersCount(uint256 _cycleId) external view returns (uint256) {
        return dailyWinnersCount[_cycleId];
    }
    
    /**
     * @dev Get daily statistics for multiple cycles
     */
    function getDailyStatsBatch(uint256[] calldata _cycleIds) external view returns (DailyStats[] memory) {
        DailyStats[] memory results = new DailyStats[](_cycleIds.length);
        
        for (uint256 i = 0; i < _cycleIds.length; i++) {
            uint256 cycleId = _cycleIds[i];
            results[i] = DailyStats({
                slipCount: dailySlipCount[cycleId],
                userCount: dailyUserCount[cycleId],
                volume: dailyVolume[cycleId],
                correctPredictions: dailyCorrectPredictions[cycleId],
                evaluatedSlips: dailyEvaluatedSlips[cycleId],
                averageScore: dailyEvaluatedSlips[cycleId] > 0 ? 
                    (dailyCorrectPredictions[cycleId] * ODDS_SCALING_FACTOR) / dailyEvaluatedSlips[cycleId] : 0,
                maxScore: dailyMaxScore[cycleId],
                minScore: dailyMinScore[cycleId],
                winnersCount: dailyWinnersCount[cycleId]
            });
        }
        
        return results;
    }
    
    /**
     * @dev Get platform-wide daily statistics summary
     */
    function getPlatformDailyStats() external view returns (
        uint256 totalCycles,
        uint256 totalSlips,
        uint256 totalUsers,
        uint256 totalVolume,
        uint256 totalCorrectPredictions,
        uint256 totalEvaluatedSlips,
        uint256 totalWinners,
        uint256 averageScore,
        uint256 maxScore,
        uint256 minScore
    ) {
        totalCycles = dailyCycleId;
        totalSlips = stats.totalSlips;
        totalUsers = stats.totalSlips; // Approximate - could be improved with user tracking
        totalVolume = stats.totalVolume;
        
        // Calculate totals across all cycles
        for (uint256 i = 1; i <= dailyCycleId; i++) {
            totalCorrectPredictions += dailyCorrectPredictions[i];
            totalEvaluatedSlips += dailyEvaluatedSlips[i];
            totalWinners += dailyWinnersCount[i];
            
            if (dailyMaxScore[i] > maxScore) {
                maxScore = dailyMaxScore[i];
            }
            if (dailyMinScore[i] > 0 && (minScore == 0 || dailyMinScore[i] < minScore)) {
                minScore = dailyMinScore[i];
            }
        }
        
        averageScore = totalEvaluatedSlips > 0 ? 
            (totalCorrectPredictions * ODDS_SCALING_FACTOR) / totalEvaluatedSlips : 0;
    }
    
    // ===== USER SLIP FUNCTIONS ACROSS ALL CYCLES =====
    
    /**
     * @dev Get all slip IDs for a user across all cycles
     * @param _user The user address
     * @return Array of slip IDs for the user across all cycles
     */
    function getAllUserSlips(address _user) external view returns (uint256[] memory) {
        return s_userSlips[_user];
    }

    /**
     * @dev Get all user slips with full data across all cycles
     * @param _user The user address
     * @return slipIds Array of slip IDs
     * @return slipsData Array of slip data
     */
    function getAllUserSlipsWithData(address _user) external view returns (
        uint256[] memory slipIds,
        Slip[] memory slipsData
    ) {
        slipIds = s_userSlips[_user];
        slipsData = new Slip[](slipIds.length);
        
        for (uint256 i = 0; i < slipIds.length; i++) {
            slipsData[i] = slips[slipIds[i]];
        }
    }

    /**
     * @dev Get all user slips with pagination support
     * @param _user The user address
     * @param _offset Starting index
     * @param _limit Maximum number of slips to return
     * @return slipIds Array of slip IDs
     * @return totalCount Total number of slips for the user
     */
    function getAllUserSlipsPaginated(
        address _user, 
        uint256 _offset, 
        uint256 _limit
    ) external view returns (
        uint256[] memory slipIds,
        uint256 totalCount
    ) {
        uint256[] memory allSlips = s_userSlips[_user];
        totalCount = allSlips.length;
        
        if (_offset >= totalCount) {
            return (new uint256[](0), totalCount);
        }
        
        uint256 endIndex = _offset + _limit;
        if (endIndex > totalCount) {
            endIndex = totalCount;
        }
        
        uint256 resultLength = endIndex - _offset;
        slipIds = new uint256[](resultLength);
        
        for (uint256 i = 0; i < resultLength; i++) {
            slipIds[i] = allSlips[_offset + i];
        }
    }

    /**
     * @dev Get user slips filtered by evaluation status across all cycles
     * @param _user The user address
     * @param _evaluatedOnly If true, only return evaluated slips
     * @return slipIds Array of slip IDs
     * @return slipsData Array of slip data
     */
    function getUserSlipsByStatus(address _user, bool _evaluatedOnly) external view returns (
        uint256[] memory slipIds,
        Slip[] memory slipsData
    ) {
        uint256[] memory allSlips = s_userSlips[_user];
        uint256[] memory tempSlipIds = new uint256[](allSlips.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < allSlips.length; i++) {
            Slip memory slip = slips[allSlips[i]];
            if (slip.isEvaluated == _evaluatedOnly) {
                tempSlipIds[count] = allSlips[i];
                count++;
            }
        }
        
        // Create properly sized arrays
        slipIds = new uint256[](count);
        slipsData = new Slip[](count);
        
        for (uint256 i = 0; i < count; i++) {
            slipIds[i] = tempSlipIds[i];
            slipsData[i] = slips[tempSlipIds[i]];
        }
    }

    /**
     * @dev Get user slips with minimum correct predictions across all cycles
     * @param _user The user address
     * @param _minCorrect Minimum number of correct predictions
     * @return slipIds Array of slip IDs
     * @return slipsData Array of slip data
     */
    function getUserSlipsByPerformance(
        address _user, 
        uint8 _minCorrect
    ) external view returns (
        uint256[] memory slipIds,
        Slip[] memory slipsData
    ) {
        uint256[] memory allSlips = s_userSlips[_user];
        uint256[] memory tempSlipIds = new uint256[](allSlips.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < allSlips.length; i++) {
            Slip memory slip = slips[allSlips[i]];
            if (slip.correctCount >= _minCorrect) {
                tempSlipIds[count] = allSlips[i];
                count++;
            }
        }
        
        // Create properly sized arrays
        slipIds = new uint256[](count);
        slipsData = new Slip[](count);
        
        for (uint256 i = 0; i < count; i++) {
            slipIds[i] = tempSlipIds[i];
            slipsData[i] = slips[tempSlipIds[i]];
        }
    }
    
} 