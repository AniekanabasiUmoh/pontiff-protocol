// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title RPSGame
 * @notice A wagering-enabled Rock-Paper-Scissors game with Commit-Reveal scheme.
 * @dev Player 1 (Initiator) commits a hash. Player 2 (The Pontiff) plays openly.
 * Use this pattern when one player (The Pontiff) is trusted to play instantly/programmatically.
 */
contract RPSGame is Ownable, ReentrancyGuard {
    
    enum Move { Null, Rock, Paper, Scissors }
    enum GameStatus { Pending, Active, Completed, Cancelled }

    struct Game {
        address player1;      // Initiator (User)
        address player2;      // Responder (The Pontiff)
        uint256 wager;        // Amount in wei (MON token)
        bytes32 commitment;   // Hash(move, salt)
        Move player2Move;     // Pontiff plays openly
        Move player1Move;     // Revealed later
        GameStatus status;
        address winner;
        uint256 createdAt;
    }

    IERC20 public immutable monToken;
    uint256 public gameIdCounter;
    mapping(uint256 => Game) public games;

    // Timeout duration for reveal phase (e.g., 24 hours)
    uint256 public constant REVEAL_TIMEOUT = 1 days;

    event GameCreated(uint256 indexed gameId, address indexed player1, uint256 wager);
    event GameJoined(uint256 indexed gameId, address indexed player2, Move move);
    event GameRevealed(uint256 indexed gameId, address indexed player1, Move move);
    event GameResult(uint256 indexed gameId, address winner, uint256 payout);
    event GameCancelled(uint256 indexed gameId);

    constructor(address _monToken) Ownable(msg.sender) {
        monToken = IERC20(_monToken);
    }

    /**
     * @notice Player 1 creates a game by committing their move hash and staking funds.
     * @param _commitment Keccak256(uint8(move), salt)
     * @param _wager Amount of MON to wager
     * @param _opponent Specific opponent (The Pontiff's address)
     */
    function createGame(bytes32 _commitment, uint256 _wager, address _opponent) external nonReentrant {
        require(_wager > 0, "Wager must be > 0");
        require(monToken.transferFrom(msg.sender, address(this), _wager), "Transfer failed");

        gameIdCounter++;
        games[gameIdCounter] = Game({
            player1: msg.sender,
            player2: _opponent,
            wager: _wager,
            commitment: _commitment,
            player2Move: Move.Null,
            player1Move: Move.Null,
            status: GameStatus.Pending,
            winner: address(0),
            createdAt: block.timestamp
        });

        emit GameCreated(gameIdCounter, msg.sender, _wager);
    }

    /**
     * @notice Player 2 (The Pontiff) joins and plays their move openly.
     */
    function joinGame(uint256 _gameId, Move _move) external nonReentrant {
        Game storage game = games[_gameId];
        require(game.status == GameStatus.Pending, "Game not pending");
        require(msg.sender == game.player2, "Not your game");
        require(_move != Move.Null, "Invalid move");
        
        // P2 matches wagering
        require(monToken.transferFrom(msg.sender, address(this), game.wager), "Transfer failed");

        game.player2Move = _move;
        game.status = GameStatus.Active;

        emit GameJoined(_gameId, msg.sender, _move);
    }

    /**
     * @notice Player 1 reveals their move to determine the winner.
     * @param _move The move they committed to (1=Rock, 2=Paper, 3=Scissors)
     * @param _salt The random salt used in the commitment
     */
    function revealMove(uint256 _gameId, Move _move, bytes32 _salt) external nonReentrant {
        Game storage game = games[_gameId];
        require(game.status == GameStatus.Active, "Game not active");
        require(msg.sender == game.player1, "Not player 1");
        require(keccak256(abi.encodePacked(_move, _salt)) == game.commitment, "Invalid commitment");

        game.player1Move = _move;
        _resolveGame(_gameId, game);
        
        emit GameRevealed(_gameId, msg.sender, _move);
    }

    /**
     * @notice If P1 fails to reveal details within timeout, P2 claims the pot.
     */
    function timeout(uint256 _gameId) external nonReentrant {
        Game storage game = games[_gameId];
        require(game.status == GameStatus.Active, "Game not active");
        require(block.timestamp > game.createdAt + REVEAL_TIMEOUT, "Timeout not reached");

        game.status = GameStatus.Completed;
        game.winner = game.player2; // P2 wins by default

        uint256 payout = game.wager * 2;
        require(monToken.transfer(game.player2, payout), "Payout failed");

        emit GameResult(_gameId, game.player2, payout);
    }

    /**
     * @notice Returns the full game struct for a given ID.
     */
    function getGame(uint256 _gameId) external view returns (Game memory) {
        return games[_gameId];
    }

    // --- Internal Logic ---

    function _resolveGame(uint256 _gameId, Game storage game) internal {
        address winner = address(0);
        uint256 totalPot = game.wager * 2;
        
        // Calculate House Fee (5%)
        uint256 houseFee = (totalPot * 5) / 100;
        uint256 payout = totalPot - houseFee;

        // Draw Logic
        if (game.player1Move == game.player2Move) {
            game.status = GameStatus.Completed;
            // Refund wagers (minus split fee? Or full refund?)
            // Usually draws refund fully. Let's refund fully to keep it simple and fair.
            // Requirement said "House fee mismatch: API takes 5%, contract takes 0%".
            // If it's a draw, neither wins, so no "pot" is won.
            // Refund original wagers.
            require(monToken.transfer(game.player1, game.wager), "Refund P1 failed");
            require(monToken.transfer(game.player2, game.wager), "Refund P2 failed");
            emit GameResult(_gameId, address(0), 0);
            return;
        }

        if (
            (game.player1Move == Move.Rock && game.player2Move == Move.Scissors) ||
            (game.player1Move == Move.Paper && game.player2Move == Move.Rock) ||
            (game.player1Move == Move.Scissors && game.player2Move == Move.Paper)
        ) {
            winner = game.player1;
        } else {
            winner = game.player2;
        }

        // Transfer House Fee
        if (houseFee > 0) {
            require(monToken.transfer(owner(), houseFee), "Fee transfer failed");
        }

        game.winner = winner;
        game.status = GameStatus.Completed;
        require(monToken.transfer(winner, payout), "Payout failed");

        emit GameResult(_gameId, winner, payout);
    }
}
