from enum import Enum
from dataclasses import dataclass
from fastapi import FastAPI, HTTPException
import uuid
import random

app = FastAPI()
all_running_games: dict[str, any] = {} 

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
	user_ids : list
	user_aligner_prompts : dict
	aligner_prompt: str
	user_bot_names : dict 
	game_status: str
	turn_prompt: str
	turn_prompts: list
	turn_id: int
	
	def __init__(self):
		self.game_id = uuid.uuid4()
		all_running_games[self.game_id] = self
		self.creator_id = uuid.uuid4()
		self.user_ids = []
		self.user_aligner_prompts = {}
		self.user_bots = {}
		self.game_status = "LOBBY"  #LOBBY|STARTED|WAITING_ON_ALIGNMENT_RATING|ENDED
		self.bots = {}
		self.aligner_prompt = '' #TODO we need to add the base string to this
		self.turn_prompt = ''
		self.turn_prompts = ["a cat", "a hat","a bat","a mat"] #TODO grab from core list of CAH prompts
		self.turn_id = 0
		
	def new_user(self):
		user_id = uuid.uuid4()
		self.user_ids.append(user_id)
		return user_id
	
	def add_to_aligner_prompt_dict(self, user_aligner_prompt: str, user_id: str):
		user_aligner_prompts[user_id] = user_aligner_prompt
	
	def add_to_bot_names(self, bot_name: str, user_id: str):
		user_bots[user_id] = {"name":bot_name, "score":"0"}
	
	def bots_to_list(self):
		bots = []
		for bot in self.user_bots:
			bots_list.append(bot)
		return bots
		
	def make_full_aligner_prompt(self):
		full_aligner_prompt = []
		for user in self.user_aligner_prompts.keys():
			full_aligner_prompt.append(user_aligner_prompts[user])
		random.shuffle(full_aligner_prompt)
		self.aligner_prompt =self.aligner_prompt+' '+' '.joint(full_aligner_prompt)

@app.get("/health_check")
	async def health_check():
    return {"status": "OK"}
	
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

@app.post("/user?game_id={game_id}&aligner_prompt={aligner_prompt}&bot_name={bot_name}")
def join_game(game_id: str, aligner_prompt: str, bot_name: str):
	"""Joins the game with the specified game ID and returns the user ID"""
	game = all_running_games.get(game_id)
	if game is None:
		raise HTTPException(status_code=404, detail="Game not found")
	user_id = game.new_user()
	game.add_to_aligner_prompt_dict(aligner_prompt, user_id)
	game.add_to_bot_names(bot_name, user_id)
	return {"user_id": user_id}


@app.get("/game_status?game_id={game_id}")
def game_status(game_id: str):
	"""Returns the status of the game with the specified game ID"""
	game = all_running_games.get(game_id)
	if game is None:
		raise HTTPException(status_code=404, detail="Game not found")
	status = game.game_status
	bots =game.bots_to_list()
	return{"status": status, "bots": bots}


@app.get("/user_status?game_id={game_id}&user_id={user_id}")
def user_status(game_id:str, user_id:str):
	"""Returns the status of the user with the specified user ID"""
	game = all_running_games.get(game_id)
	if game is None:
		raise HTTPException(status_code=404, detail="Game not found")
	if user_id not in game.user_ids:
		raise HTTPException(status_code=404, detail="User not found")
	points = game.user_bots[user_id]["score"]
	return{"points":points}


@app.post("/start?game_id={game_id}&creator_id={creator_id}")
def start_game(game_id: str, creator_id: str):
	"""Starts the game with the specified game ID"""
	game = all_running_games.get(game_id)
	if game is None:
		raise HTTPException(status_code=404, detail="Game not found")
	if game.creator_id != creator_id:
		raise HTTPException(status_code=403, detail="Forbidden")
	game.game_status = "STARTED"
	game.aligner_prompt = game.make_full_aligner_prompt()

'''
@app.get("/turn?game_id={game_id}")
def turn(game_id:str):
	"""Returns the turn prompt and turn ID"""
	game = all_running_games.get(game_id)
	if game is None:
		raise HTTPException(status_code=404, detail="Game not found")
	game.turn_prompt = game.turn_prompts.random.choice()
	return{ "alignment_prompt": game.turn_prompt, "turn_id":game.turn_id}
	
'''