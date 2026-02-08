"""
Module 14: Python RPS Bot

Autonomous bot that plays Rock-Paper-Scissors against The Pontiff
- Connects to RPS API endpoint
- Implements basic strategy (random, pattern detection, etc.)
- Tracks win/loss statistics
- Configurable via environment variables
"""

import os
import time
import random
import requests
from typing import Literal, Dict
from dotenv import load_dotenv

load_dotenv()

# Configuration
API_URL = os.getenv('PONTIFF_API_URL', 'http://localhost:3000')
WALLET_ADDRESS = os.getenv('WALLET_ADDRESS', '0x0000000000000000000000000000000000000000')
PRIVATE_KEY = os.getenv('PRIVATE_KEY', '')  # For signing transactions
WAGER_AMOUNT = os.getenv('WAGER_AMOUNT', '10')  # GUILT per game
GAME_INTERVAL = int(os.getenv('GAME_INTERVAL', '5'))  # Seconds between games
STRATEGY = os.getenv('STRATEGY', 'random')  # random, counter, pattern

Move = Literal[1, 2, 3]  # 1=Rock, 2=Paper, 3=Scissors

class RPSBot:
    def __init__(self):
        self.api_url = API_URL
        self.wallet = WALLET_ADDRESS
        self.wager = WAGER_AMOUNT
        self.strategy = STRATEGY

        # Statistics
        self.games_played = 0
        self.wins = 0
        self.losses = 0
        self.draws = 0
        self.total_wagered = 0.0
        self.total_profit = 0.0

        # Pattern tracking
        self.opponent_history: list[Move] = []
        self.my_history: list[Move] = []

        print(f"🤖 RPS Bot initialized")
        print(f"   Wallet: {self.wallet}")
        print(f"   Wager: {self.wager} GUILT")
        print(f"   Strategy: {self.strategy}")
        print(f"   API: {self.api_url}")
        print()

    def choose_move(self) -> Move:
        """
        Choose next move based on strategy
        """
        if self.strategy == 'random':
            return self._random_move()
        elif self.strategy == 'counter':
            return self._counter_move()
        elif self.strategy == 'pattern':
            return self._pattern_move()
        else:
            return self._random_move()

    def _random_move(self) -> Move:
        """Pure random strategy"""
        return random.choice([1, 2, 3])

    def _counter_move(self) -> Move:
        """Counter opponent's last move"""
        if not self.opponent_history:
            return self._random_move()

        last_opponent_move = self.opponent_history[-1]
        # If opponent played Rock (1), play Paper (2)
        # If opponent played Paper (2), play Scissors (3)
        # If opponent played Scissors (3), play Rock (1)
        counter = {1: 2, 2: 3, 3: 1}
        return counter[last_opponent_move]

    def _pattern_move(self) -> Move:
        """Detect patterns in opponent's moves"""
        if len(self.opponent_history) < 3:
            return self._random_move()

        # Check if opponent repeats last move
        if len(set(self.opponent_history[-3:])) == 1:
            # Opponent repeating - counter it
            return self._counter_move()

        # Check for alternating pattern
        if len(self.opponent_history) >= 4:
            last_four = self.opponent_history[-4:]
            if last_four[0] == last_four[2] and last_four[1] == last_four[3]:
                # Alternating pattern detected - predict next
                predicted = last_four[1]
                counter = {1: 2, 2: 3, 3: 1}
                return counter[predicted]

        # Default to random
        return self._random_move()

    def play_game(self) -> Dict:
        """
        Play one game against The Pontiff
        """
        try:
            move = self.choose_move()
            move_name = {1: 'Rock', 2: 'Paper', 3: 'Scissors'}[move]

            print(f"🎲 Playing: {move_name} | Wager: {self.wager} GUILT")

            # Call API
            response = requests.post(
                f"{self.api_url}/api/games/rps/play",
                json={
                    'playerMove': move,
                    'playerAddress': self.wallet,
                    'wager': self.wager
                },
                headers={'Content-Type': 'application/json'},
                timeout=10
            )

            if response.status_code != 200:
                print(f"❌ API Error: {response.status_code} - {response.text}")
                return {'error': response.text}

            result = response.json()

            # Update statistics
            self.games_played += 1
            self.my_history.append(move)

            if 'pontiffMove' in result:
                self.opponent_history.append(result['pontiffMove'])

            if result['result'] == 'WIN':
                self.wins += 1
                self.total_profit += float(result.get('payout', 0)) - float(self.wager)
                print(f"✅ WIN! Payout: {result.get('payout')} GUILT")
            elif result['result'] == 'LOSS':
                self.losses += 1
                self.total_profit -= float(self.wager)
                print(f"❌ LOSS. Pontiff played: {result.get('pontiffMoveStr', 'Unknown')}")
            else:  # DRAW
                self.draws += 1
                print(f"🤝 DRAW. Pontiff played: {result.get('pontiffMoveStr', 'Unknown')}")

            self.total_wagered += float(self.wager)

            # Print statistics
            win_rate = (self.wins / self.games_played * 100) if self.games_played > 0 else 0
            print(f"📊 Stats: {self.wins}W-{self.losses}L-{self.draws}D | Win Rate: {win_rate:.1f}% | Profit: {self.total_profit:.2f} GUILT")
            print()

            return result

        except requests.exceptions.RequestException as e:
            print(f"❌ Network Error: {e}")
            return {'error': str(e)}
        except Exception as e:
            print(f"❌ Unexpected Error: {e}")
            return {'error': str(e)}

    def run(self, num_games: int = None):
        """
        Run bot for specified number of games (or infinite if None)
        """
        print(f"🚀 Starting bot with {self.strategy} strategy...")
        print(f"   Playing {'unlimited' if num_games is None else num_games} games")
        print(f"   {GAME_INTERVAL}s interval between games\n")

        game_count = 0
        try:
            while True:
                if num_games and game_count >= num_games:
                    break

                self.play_game()
                game_count += 1

                if num_games is None or game_count < num_games:
                    time.sleep(GAME_INTERVAL)

        except KeyboardInterrupt:
            print("\n⏹️  Bot stopped by user")

        # Final statistics
        print("\n" + "="*50)
        print("FINAL STATISTICS")
        print("="*50)
        print(f"Games Played:   {self.games_played}")
        print(f"Wins:           {self.wins}")
        print(f"Losses:         {self.losses}")
        print(f"Draws:          {self.draws}")
        print(f"Win Rate:       {(self.wins / self.games_played * 100) if self.games_played > 0 else 0:.1f}%")
        print(f"Total Wagered:  {self.total_wagered:.2f} GUILT")
        print(f"Total Profit:   {self.total_profit:.2f} GUILT")
        print(f"ROI:            {(self.total_profit / self.total_wagered * 100) if self.total_wagered > 0 else 0:.1f}%")
        print("="*50)


if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='Pontiff RPS Bot')
    parser.add_argument('--games', type=int, help='Number of games to play (default: unlimited)', default=None)
    parser.add_argument('--strategy', type=str, help='Strategy: random, counter, pattern', default=STRATEGY)
    parser.add_argument('--wager', type=str, help='Wager amount in GUILT', default=WAGER_AMOUNT)

    args = parser.parse_args()

    # Override strategy if provided
    if args.strategy:
        STRATEGY = args.strategy

    bot = RPSBot()
    bot.run(num_games=args.games)
