from .game import Game
from typing import Dict

class GameState:
    state: Dict[str, Game]

    def __init__(self):
        self.state = {}

 
game_state = GameState()

