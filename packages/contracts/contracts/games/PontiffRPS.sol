// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract PontiffRPS is ReentrancyGuard {
    IERC20 public guiltToken;
    address public treasury;
    address public pontiff; // Backend wallet that can execute moves

    uint256 public constant HOUSE_FEE_PERCENT = 5; // 5% house edge

    enum Move { None, Rock, Paper, Scissors }
    enum GameResult { Pending, PlayerWin, PontiffWin, Draw }

    struct Game {
        address player;
        uint256 wager;
        Move playerMove;
        Move pontiffMove;
        GameResult result;
        uint256 payout;
        uint256 timestamp;
        bool settled;
    }

    mapping(uint256 => Game) public games;
    uint256 public gameCount;

    event GameCreated(uint256 indexed gameId, address indexed player, uint256 wager, Move playerMove);
    event GameSettled(uint256 indexed gameId, GameResult result, uint256 payout);

    constructor(address _guiltToken, address _treasury, address _pontiff) {
        guiltToken = IERC20(_guiltToken);
        treasury = _treasury;
        pontiff = _pontiff;
    }

    /**
     * Player initiates a game by locking their wager
     */
    function playRPS(Move _playerMove, uint256 _wager) external nonReentrant returns (uint256 gameId) {
        require(_playerMove != Move.None, "Invalid move");
        require(_wager > 0, "Wager must be > 0");
        require(guiltToken.balanceOf(msg.sender) >= _wager, "Insufficient balance");

        // Transfer wager to contract
        require(guiltToken.transferFrom(msg.sender, address(this), _wager), "Transfer failed");

        gameId = gameCount++;
        games[gameId] = Game({
            player: msg.sender,
            wager: _wager,
            playerMove: _playerMove,
            pontiffMove: Move.None,
            result: GameResult.Pending,
            payout: 0,
            timestamp: block.timestamp,
            settled: false
        });

        emit GameCreated(gameId, msg.sender, _wager, _playerMove);
        return gameId;
    }

    /**
     * Pontiff (backend) settles the game
     */
    function settleGame(uint256 _gameId, Move _pontiffMove) external nonReentrant {
        require(msg.sender == pontiff, "Only Pontiff can settle");

        Game storage game = games[_gameId];
        require(!game.settled, "Already settled");
        require(game.pontiffMove == Move.None, "Already played");
        require(_pontiffMove != Move.None, "Invalid Pontiff move");

        game.pontiffMove = _pontiffMove;
        game.result = determineWinner(game.playerMove, _pontiffMove);

        // House fee calculation
        // If Player wins: They get 2x wager - 5% fee. 
        // If Draw: They get 1x wager - 5% fee.
        // If Pontiff wins: House gets 1x wager (already in contract).
        
        // Note: The logic in the spec says "Draw: Refund wager minus house fee".
        // This effectively means House takes 5% rake on EVERY game. Even draws.
        
        uint256 houseFee = (game.wager * HOUSE_FEE_PERCENT) / 100;

        if (game.result == GameResult.PlayerWin) {
            // Player wins: (Wager * 2) - fee
            // Contract has 1x wager from player. Payout needs 2x wager - fee.
            // Wait, this standard assumes Pontiff (House) matches the bet.
            // But Pontiff doesn't transfer funds in `playRPS`.
            // The contract must be funded! Or Pontiff sends funds in `settleGame`.
            
            // Let's check the spec in the reference doc:
            // "Contract locks wager" -> implies only player wager is locked?
            // "Winner receives payout" -> if Player wins 100, they usually get 200 back (100 principle + 100 profit).
            // Where does the profit come from? The House Treasury / Contract Balance.
            // The contract MUST have a balance of GUILT to pay out wins.
            
            // For this implementation, let's assume the contract has a balance (Treasury/House funds).
            
            game.payout = (game.wager * 2) - houseFee;
            require(guiltToken.transfer(game.player, game.payout), "Payout failed");
            require(guiltToken.transfer(treasury, houseFee), "Fee transfer failed");
            
        } else if (game.result == GameResult.Draw) {
            // Draw: Refund wager minus fee
            game.payout = game.wager - houseFee;
            require(guiltToken.transfer(game.player, game.payout), "Refund failed");
            require(guiltToken.transfer(treasury, houseFee), "Fee transfer failed");
        } else {
            // Pontiff wins: Transfer player's wager to treasury
            // Contract holds the wager. Send it all to treasury.
            game.payout = 0;
            require(guiltToken.transfer(treasury, game.wager), "Treasury transfer failed");
        }

        game.settled = true;
        emit GameSettled(_gameId, game.result, game.payout);
    }

    /**
     * Determine game winner
     */
    function determineWinner(Move player, Move pontiffMove) internal pure returns (GameResult) {
        if (player == pontiffMove) return GameResult.Draw;

        if (
            (player == Move.Rock && pontiffMove == Move.Scissors) ||
            (player == Move.Paper && pontiffMove == Move.Rock) ||
            (player == Move.Scissors && pontiffMove == Move.Paper)
        ) {
            return GameResult.PlayerWin;
        }

        return GameResult.PontiffWin;
    }

    /**
     * Get game details
     */
    function getGame(uint256 _gameId) external view returns (Game memory) {
        return games[_gameId];
    }
    
    /**
     * Admin/Pontiff can withdraw funds (if needed to drain contract)
     */
    function withdrawFunds(uint256 amount) external {
        require(msg.sender == pontiff || msg.sender == treasury, "Unauthorized");
        guiltToken.transfer(msg.sender, amount);
    }
}
