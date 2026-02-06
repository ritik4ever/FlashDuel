// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract FlashDuel is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;
    
    uint256 public constant PLATFORM_FEE_BPS = 500;
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant MIN_STAKE = 10 * 10**6;
    uint256 public constant MAX_STAKE = 1000 * 10**6;
    uint256 public constant MIN_DURATION = 60;
    uint256 public constant MAX_DURATION = 3600;

    enum MatchStatus { None, Waiting, Active, Completed, Cancelled, Disputed }

    struct Match {
        bytes32 id;
        address playerA;
        address playerB;
        uint256 stakeAmount;
        uint256 prizePool;
        uint256 createdAt;
        uint256 startedAt;
        uint256 endedAt;
        uint256 duration;
        MatchStatus status;
        address winner;
        int256 playerAScore;
        int256 playerBScore;
    }

    struct PlayerStats {
        uint256 totalMatches;
        uint256 wins;
        uint256 losses;
        uint256 totalEarnings;
        uint256 totalStaked;
        int256 bestScore;
    }

    struct LeaderboardEntry {
        address player;
        uint256 wins;
        uint256 totalMatches;
        uint256 earnings;
        int256 winRate;
    }

    mapping(bytes32 => Match) public matches;
    mapping(address => PlayerStats) public playerStats;
    mapping(address => bytes32[]) public playerMatches;
    
    bytes32[] public allMatchIds;
    address[] public allPlayers;
    mapping(address => bool) public isPlayer;

    uint256 public totalFeesCollected;
    uint256 public totalMatchesCreated;
    uint256 public totalPrizePoolDistributed;

    mapping(address => bool) public authorizedSettlers;

    event MatchCreated(bytes32 indexed matchId, address indexed playerA, uint256 stakeAmount, uint256 duration);
    event MatchJoined(bytes32 indexed matchId, address indexed playerB, uint256 prizePool);
    event MatchStarted(bytes32 indexed matchId, uint256 startedAt, uint256 endsAt);
    event MatchSettled(bytes32 indexed matchId, address indexed winner, uint256 payout, int256 winnerScore, int256 loserScore);
    event MatchCancelled(bytes32 indexed matchId, address indexed cancelledBy);
    event FeesWithdrawn(address indexed to, uint256 amount);
    event SettlerAuthorized(address indexed settler, bool authorized);

    modifier onlySettler() {
        require(authorizedSettlers[msg.sender] || msg.sender == owner(), "Not authorized settler");
        _;
    }

    constructor(address _usdc) Ownable(msg.sender) {
        usdc = IERC20(_usdc);
        authorizedSettlers[msg.sender] = true;
    }

    function createMatch(uint256 stakeAmount, uint256 duration) external nonReentrant whenNotPaused returns (bytes32) {
        require(stakeAmount >= MIN_STAKE, "Stake too low");
        require(stakeAmount <= MAX_STAKE, "Stake too high");
        require(duration >= MIN_DURATION, "Duration too short");
        require(duration <= MAX_DURATION, "Duration too long");

        usdc.safeTransferFrom(msg.sender, address(this), stakeAmount);

        bytes32 matchId = keccak256(abi.encodePacked(msg.sender, block.timestamp, block.prevrandao, totalMatchesCreated));

        matches[matchId] = Match({
            id: matchId,
            playerA: msg.sender,
            playerB: address(0),
            stakeAmount: stakeAmount,
            prizePool: stakeAmount,
            createdAt: block.timestamp,
            startedAt: 0,
            endedAt: 0,
            duration: duration,
            status: MatchStatus.Waiting,
            winner: address(0),
            playerAScore: 0,
            playerBScore: 0
        });

        allMatchIds.push(matchId);
        playerMatches[msg.sender].push(matchId);
        totalMatchesCreated++;

        if (!isPlayer[msg.sender]) {
            isPlayer[msg.sender] = true;
            allPlayers.push(msg.sender);
        }

        playerStats[msg.sender].totalStaked += stakeAmount;

        emit MatchCreated(matchId, msg.sender, stakeAmount, duration);
        return matchId;
    }

    function joinMatch(bytes32 matchId) external nonReentrant whenNotPaused {
        Match storage m = matches[matchId];
        require(m.status == MatchStatus.Waiting, "Match not available");
        require(m.playerA != msg.sender, "Cannot join own match");
        require(m.playerB == address(0), "Match already full");

        usdc.safeTransferFrom(msg.sender, address(this), m.stakeAmount);

        m.playerB = msg.sender;
        m.prizePool += m.stakeAmount;
        m.status = MatchStatus.Active;
        m.startedAt = block.timestamp;

        playerMatches[msg.sender].push(matchId);

        if (!isPlayer[msg.sender]) {
            isPlayer[msg.sender] = true;
            allPlayers.push(msg.sender);
        }

        playerStats[msg.sender].totalStaked += m.stakeAmount;

        emit MatchJoined(matchId, msg.sender, m.prizePool);
        emit MatchStarted(matchId, m.startedAt, m.startedAt + m.duration);
    }

    function settleMatch(bytes32 matchId, address winner, int256 playerAScore, int256 playerBScore) external onlySettler nonReentrant {
        Match storage m = matches[matchId];
        require(m.status == MatchStatus.Active, "Match not active");
        require(winner == m.playerA || winner == m.playerB, "Invalid winner");
        require(block.timestamp >= m.startedAt + m.duration, "Match not ended yet");

        m.status = MatchStatus.Completed;
        m.winner = winner;
        m.endedAt = block.timestamp;
        m.playerAScore = playerAScore;
        m.playerBScore = playerBScore;

        uint256 fee = (m.prizePool * PLATFORM_FEE_BPS) / BASIS_POINTS;
        uint256 payout = m.prizePool - fee;

        totalFeesCollected += fee;
        totalPrizePoolDistributed += payout;

        address loser = winner == m.playerA ? m.playerB : m.playerA;
        int256 winnerScore = winner == m.playerA ? playerAScore : playerBScore;
        int256 loserScore = winner == m.playerA ? playerBScore : playerAScore;

        PlayerStats storage winnerStats = playerStats[winner];
        winnerStats.totalMatches++;
        winnerStats.wins++;
        winnerStats.totalEarnings += payout;
        if (winnerScore > winnerStats.bestScore) {
            winnerStats.bestScore = winnerScore;
        }

        PlayerStats storage loserStats = playerStats[loser];
        loserStats.totalMatches++;
        loserStats.losses++;

        usdc.safeTransfer(winner, payout);

        emit MatchSettled(matchId, winner, payout, winnerScore, loserScore);
    }

    function cancelMatch(bytes32 matchId) external nonReentrant {
        Match storage m = matches[matchId];
        require(m.status == MatchStatus.Waiting, "Can only cancel waiting");
        require(m.playerA == msg.sender, "Only creator can cancel");

        m.status = MatchStatus.Cancelled;
        usdc.safeTransfer(msg.sender, m.stakeAmount);

        emit MatchCancelled(matchId, msg.sender);
    }

    function getMatch(bytes32 matchId) external view returns (Match memory) {
        return matches[matchId];
    }

    function getPlayerStats(address player) external view returns (PlayerStats memory) {
        return playerStats[player];
    }

    function getPlayerMatches(address player) external view returns (bytes32[] memory) {
        return playerMatches[player];
    }

    function getOpenMatches() external view returns (Match[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < allMatchIds.length; i++) {
            if (matches[allMatchIds[i]].status == MatchStatus.Waiting) {
                count++;
            }
        }

        Match[] memory openMatches = new Match[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < allMatchIds.length; i++) {
            if (matches[allMatchIds[i]].status == MatchStatus.Waiting) {
                openMatches[index] = matches[allMatchIds[i]];
                index++;
            }
        }
        return openMatches;
    }

    function getActiveMatches() external view returns (Match[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < allMatchIds.length; i++) {
            if (matches[allMatchIds[i]].status == MatchStatus.Active) {
                count++;
            }
        }

        Match[] memory activeMatches = new Match[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < allMatchIds.length; i++) {
            if (matches[allMatchIds[i]].status == MatchStatus.Active) {
                activeMatches[index] = matches[allMatchIds[i]];
                index++;
            }
        }
        return activeMatches;
    }

    function getRecentMatches(uint256 limit) external view returns (Match[] memory) {
        uint256 count = allMatchIds.length < limit ? allMatchIds.length : limit;
        Match[] memory recentMatches = new Match[](count);
        
        for (uint256 i = 0; i < count; i++) {
            uint256 idx = allMatchIds.length - 1 - i;
            recentMatches[i] = matches[allMatchIds[idx]];
        }
        return recentMatches;
    }

    function getLeaderboard(uint256 limit) external view returns (LeaderboardEntry[] memory) {
        uint256 playerCount = allPlayers.length;
        if (playerCount == 0) {
            return new LeaderboardEntry[](0);
        }
        
        uint256 count = playerCount < limit ? playerCount : limit;
        
        address[] memory sortedPlayers = new address[](playerCount);
        for (uint256 i = 0; i < playerCount; i++) {
            sortedPlayers[i] = allPlayers[i];
        }

        for (uint256 i = 0; i < sortedPlayers.length - 1; i++) {
            for (uint256 j = i + 1; j < sortedPlayers.length; j++) {
                if (playerStats[sortedPlayers[j]].wins > playerStats[sortedPlayers[i]].wins) {
                    address temp = sortedPlayers[i];
                    sortedPlayers[i] = sortedPlayers[j];
                    sortedPlayers[j] = temp;
                }
            }
        }

        LeaderboardEntry[] memory leaderboard = new LeaderboardEntry[](count);
        for (uint256 i = 0; i < count; i++) {
            address player = sortedPlayers[i];
            PlayerStats memory stats = playerStats[player];
            int256 winRate = stats.totalMatches > 0 
                ? int256((stats.wins * 10000) / stats.totalMatches)
                : int256(0);
            
            leaderboard[i] = LeaderboardEntry({
                player: player,
                wins: stats.wins,
                totalMatches: stats.totalMatches,
                earnings: stats.totalEarnings,
                winRate: winRate
            });
        }
        return leaderboard;
    }

    function getPlatformStats() external view returns (uint256, uint256, uint256, uint256) {
        return (totalMatchesCreated, totalPrizePoolDistributed, totalFeesCollected, allPlayers.length);
    }

    function setSettler(address settler, bool authorized) external onlyOwner {
        authorizedSettlers[settler] = authorized;
        emit SettlerAuthorized(settler, authorized);
    }

    function withdrawFees(address to) external onlyOwner {
        uint256 amount = totalFeesCollected;
        require(amount > 0, "No fees to withdraw");
        totalFeesCollected = 0;
        usdc.safeTransfer(to, amount);
        emit FeesWithdrawn(to, amount);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }
}
