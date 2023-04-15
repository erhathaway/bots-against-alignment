from enum import Enum
from dataclasses import dataclass
from fastapi import FastAPI, HTTPException
import uuid
# from dotenv import load_dotenv
import os

app = FastAPI()
all_running_games: dict[str, any] = {} 


# load_dotenv()  # take environment variables from .env.

# OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')


class AlignerType(str, Enum):
	USER_ROUND_ROBIN = "USER_ROUND_ROBIN"
	LAST_WON_USER = "LAST_WON_USER"
	BOT_WITH_HIDDEN_PROMPT = "BOT_WITH_HIDDEN_PROMPT"
	BOT_WITH_USER_PROMPT = "BOT_WITH_USER_PROMPT"

class Game:
	game_id: str
	creator_id: str
	aligner: AlignerType
	points: int

	def __init__(self):
		self.game_id = uuid.uuid4()
		all_running_games[self.game_id] = self
		self.creator_id = uuid.uuid4()

@app.get("/game/{game_id}")
def get_game(game_id: str):
	"""Returns a valid game object id if it exists, otherwise returns an error"""
	game_id = all_running_games.get(game_id)
	if game_id is None:
		raise HTTPException(status_code=404, detail="Game not found")
	else:
		return {"game_id": game_id}

@app.post("/game")
def create_game():
	"""Creates a new game and returns the creator ID and game ID"""
	game = Game()

	return {"creator_id": game.creator_id, "game_id": game.game_id}

@app.post("/config?game_id={game_id}&creator_id={creator_id}&aligner={aligner}&points={points}")
def config_game(game_id: str, creator_id: str, aligner: AlignerType, points: int):
	"""Configures the game with the specified parameters"""
	game = all_running_games.get(game_id)
	if game is None:
		raise HTTPException(status_code=404, detail="Game not found")
	if game.creator_id != creator_id:
		raise HTTPException(status_code=403, detail="Forbidden")
	game.aligner = aligner
	game.points = points
	return {"game_id": game_id, "aligner": aligner, "points": points}
