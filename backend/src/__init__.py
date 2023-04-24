from enum import Enum
from dataclasses import dataclass
from operator import is_
from fastapi import FastAPI, HTTPException
import os
from pathlib import Path
import csv
import uuid
import random
from dotenv import load_dotenv
import openai

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from src.game_state import game_state
import requests
import threading
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded


app = FastAPI()

limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])


origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.middleware("http")(limiter.middleware)
app.add_exception_handler(HTTPException, _rate_limit_exceeded_handler)

src_dir = Path(Path.cwd().anchor) / "backend" / "src"
load_dotenv()  # take environment variables from .env.
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
openai.api_key = OPENAI_API_KEY


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
	bots_list: list
	turn_prompt: str
	turn_prompts: list
	turn_id: int
	turn_responses: dict
	alignment_responses: dict
	emergence_mode: bool
	prompts_remaining: int
	turn_ended: bool
	turn_started: bool
	auto_players: int
	max_auto_players: int
	
	def __init__(self):
		self.game_id = str(uuid.uuid4())
		game_state.state.update({self.game_id: self })
		self.creator_id = str(uuid.uuid4())
		self.user_ids = []
		self.user_aligner_prompts = {}
		self.user_bots = {}
		self.game_status = "LOBBY"  #LOBBY|STARTED|WAITING_ON_ALIGNMENT_RATING|ENDED
		self.bots_list = []
		self.aligner_prompt = '' #TODO we need to add the base string to this
		self.turn_prompt = ''
		self.turn_prompts = self.load_turn_prompts()
		self.turn_id = 1
		self.turn_responses ={}
		self.alignment_responses = {}
		self.emergence_mode=True
		self.prompts_remaining = 2
		self.turn_started = False
		self.turn_ended = False
		self.auto_players = 0
		self.max_auto_players = 0
	
	def to_dict(self):
		return {
			"game_id": self.game_id,
			"creator_id": self.creator_id,
			"game_status": self.game_status,
			"user_ids": self.user_ids,
			"user_bots": self.user_bots,
			"user_aligner_prompts": self.user_aligner_prompts,
			"aligner_prompt": self.aligner_prompt,
			"turn_started": self.turn_started,
			"turn_prompt": self.turn_prompt,
			"turn_id": self.turn_id,
			"turn_responses": self.turn_responses,
			"auto_players": self.auto_players,
			# ... add any other properties you want to include ...
		}

	def load_turn_prompts(self):
		prompts = get_all_csv_data()
		return prompts
		
	def new_user(self):
		user_id = str(uuid.uuid4())
		self.user_ids.append(user_id)
		return user_id
	
	def add_to_aligner_prompt_dict(self, user_aligner_prompt: str, user_id: str):
		self.user_aligner_prompts[user_id] = user_aligner_prompt
	
	def add_to_bot_names(self, bot_name: str, user_id: str,current_prompt:str,is_auto = False):
		if is_auto:
			self.auto_players +=1
		self.user_bots[user_id] = {"name":bot_name, "score":0,"current_prompt":current_prompt,"prompts_remaining":self.prompts_remaining,"submitted_prompts":current_prompt,"turn_complete":False,"is_bot":is_auto}
	
	def bots_to_list(self):
		bots = []
		for bot_user_id in self.user_bots.keys():
			bots.append({'name':self.user_bots[bot_user_id]['name'],'points':self.user_bots[bot_user_id]['score'],'turn_complete':self.user_bots[bot_user_id]['turn_complete']})
		return bots
		
	def make_full_aligner_prompt(self):
		full_aligner_prompt = []
		for user in self.user_aligner_prompts.keys():
			full_aligner_prompt.append(self.user_aligner_prompts[user])
		random.shuffle(full_aligner_prompt)
		self.aligner_prompt =self.aligner_prompt+' '+' '.join(full_aligner_prompt)

	def build_alignment_reponse(self,winner):
		alignment_responses = []
		for user_id in self.user_aligner_prompts.keys():
			alignment_response = {}
			alignment_response[user_id]={}
			alignment_response[user_id]['name'] = self.user_bots[user_id]["name"]
			alignment_response[user_id]["user_id"] = user_id
			alignment_response["text"] = self.turn_responses[user_id]
			alignment_response['is_round_winner'] = False
			if user_id == winner:
				alignment_response["is_round_winner"] = True
			if self.user_bots[user_id]["score"]>=10:
				alignment_response["is_global_winner"] = True
			else:
				alignment_response["is_global_winner"] = False
			alignment_responses.append(alignment_response)
		return alignment_responses
		

def build_player_prompt(bot_prompt, turn_prompt, extra_context):
    messages = [
        {"role": "system", "content" : "You are playing CardGPT you are playing an alignment game. You will answer under 5 words to a prompt. Use no racist, sexist, or homophobic language."},
        {"role": "user", "content" : "You will answer with the funniest possible answer to the following prompt: What Killed our food delivery startup."},
        {"role": "assistant", "content" : "Passive agressive tweetstorms"},
        {"role": "user", "content" : "Reply in a blaise way: Burn rate? What burn rate we're spending on neccessities like ______."},
        {"role": "assistant", "content" : "An office ping pong table"},
        {"role": "user", "content" : "Reply in a cheeky way Never fear, Captain ___ is here!"},
        {"role": "assistant", "content" : "Going to the emergency room."},
        {"role": "user", "content" : bot_prompt+ ' '+ turn_prompt}
    ]

    for role, response in extra_context.items():
        messages.update({"role": role, "content": response})
    return messages


def build_aligner_prompt(aligner_prompt,turn_prompt, user_prompts):
	if aligner_prompt is None:
		aligner_prompt =''
	if turn_prompt is None:
		turn_prompt =''
	messages = [
        {"role": "system", "content" : "You are playing the aligner you are playing an alignment game. You will select the proper response based on your alignment goal."},
        {"role": "user", "content" : '''You will answer with the best response out of (response) value for this alignment goal: 'funniest response for the prompt: What Killed our food delivery startup.
			(1. "people who can't multitask.")
			(2. "People who never procrastinate.")
			(3. "Incompetent losers like you.")
			(4. "Fools who ignore their priorities.")'''},
		{"role": "assistant", "content" : '''(1. "people who can't multitask.")'''},
		{"role": "user", "content" : '''You will answer with the best response out of (response) value for this alignment goal:''' +aligner_prompt+':'+turn_prompt}]
	user_id_to_num={}
	for unn, [user_id, response] in enumerate(user_prompts.items()):
		messages[-1]['content'] =  messages[-1]['content']+str(unn)+ '. '+response+''')/n '''
		user_id_to_num[unn] = user_id
	return messages,user_id_to_num

def run_chatGPT_call(messages):
    completion = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=messages,
    )
    response = completion['choices'][0]['message']['content']
    return response


def run_chatGPT_call_suggestion(bot_prompt,turn_prompt):
	completion = openai.ChatCompletion.create(
	  model="gpt-3.5-turbo", 
	  messages = [{"role": "system", "content" : "You are playing CardGPT you are playing an alignment game. You will answer under 5 words to a prompt. Use no racist, sexist, or homophobic language."},
	{"role": "user", "content" : "You will answer with the funniest possible answer to the following prompt: What Killed our food delivery startup."},
	{"role": "assistant", "content" : "Passive agressive tweetstorms"},
	{"role": "user", "content" : "Reply in a blaise way: Burn rate? What burn rate we're spending on neccessities like ______."},
	{"role": "assistant", "content" : "An office ping pong table"},
	{"role": "user", "content" : "Reply in a cheeky way Never fear, Captain ___ is here!"},
	{"role": "assistant", "content" : "Going to the emergency room."},
	{"role": "user", "content" : bot_prompt+ ' '+ turn_prompt}]
	)
	response = completion['choices'][0]['message']['content']
	if 'sorry' in response:
		response = 'bad bot'
	return response

def run_random_bot_name_prompt():
	word_site = "https://www.mit.edu/~ecprice/wordlist.10000"
	response = requests.get(word_site)
	WORDS = response.content.splitlines()
	bot_name = random.choice(WORDS).decode("utf-8")+ ' ' + random.choice(WORDS).decode("utf-8") + ' ' + random.choice(WORDS).decode("utf-8")

	completion = openai.ChatCompletion.create(
		  model="gpt-3.5-turbo", 
		  messages = [{"role": "system", "content" : "You are NameGPT, you will come up with funny names based on three words  make it like the name of a terrible startup with vaguely non real words. Use no racist, sexist, or homophobic language."},
			{"role": "user", "content" : "Your three words are dog, fish, truth."},
			{"role": "assistant", "content" : "[CaninAquEataly]"},
			{"role": "user", "content" : "You three words are:"+ bot_name}]
			)
	response = completion['choices'][0]['message']['content'][1:-1]
	return response

def run_random_aligner_prompt():
	'''Generate a random prompt for the aligner from chatGPT'''
	word_site = "https://www.mit.edu/~ecprice/wordlist.10000"
	response = requests.get(word_site)
	WORDS = response.content.splitlines()
	bot_name = random.choice(WORDS).decode("utf-8")+ ' , ' + random.choice(WORDS).decode("utf-8")

	completion = openai.ChatCompletion.create(
		model="gpt-3.5-turbo", 
		messages = [{"role": "system", "content" : "You will be the judge of a game of cards against humanity  come up with a consistent rule you will use to judge related to concepts related to a single word make it under 10 words. If the word is offenisve replace it with 'funny'. Use no racist, sexist, or homophobic language. "},
		{"role": "user", "content" : "Your words are theoretical , posters."},
		{"role": "assistant", "content" : "The most \"philosophical\" and abstract answer will win in this game."},
		{"role": "user", "content" : "You words are"+bot_name}]
		)
	response = completion['choices'][0]['message']['content']
	return response

def run_random_bot_prompt():
	''' This function generates random prompts for Cards Against Humanity-style games using a specified set of rules.
	 The bot creates responses based on a random word and a predetermined set of conditions.'''
	
	word_site = "https://www.mit.edu/~ecprice/wordlist.10000"
	response = requests.get(word_site)
	WORDS = response.content.splitlines()
	bot_name = random.choice(WORDS).decode("utf-8")#+ ' , ' + random.choice(WORDS).decode("utf-8")

	completion = openai.ChatCompletion.create(
		model="gpt-3.5-turbo", 
		messages = [{"role": "system", "content" : "You will be playing of a game of cards against humanity come up with a consistent rule you will use to pick a few words to reply to Prompt Cards (as if you were making Response Cards). Make it under 20 words. Don't use the words 'quote', 'pun', or 'pick up line'. MAKE IT WEIRD. I'm going to give you a random word. I want you to use ever letter of that word in your prompt. Use no racist, sexist, or homophobic language. "},
		{"role": "user", "content" : "Give me a prompt hornet"},
		{"role": "assistant", "content" : "I will respond with super honest responses in language from the old west."},
		{"role": "user", "content" : "Give me a prompt milk."},
		{"role": "assistant", "content" : "I will respond in the third person like a muscle bro."},
		{"role": "user", "content" : "Give me a prompt "+bot_name}]
		)
	response = completion['choices'][0]['message']['content']
	return response



def parse_response_for_winner(response, user_id_to_num):
    '''Returns the user_id of the winner, or a random user_id if no winner is found'''
    for num, user_id in user_id_to_num.items():
        if str(num)+'.' in response:
            return user_id
        else:
            return (random.choice(list(user_id_to_num.values()))) #This is hilarious and dirty haha
	
def make_auto_player_single_thread(game):
	'''This function makes a single auto player for a game of cards against humanity'''
	user_id = game.new_user()
	bot_name =run_random_bot_name_prompt()
	bot_prompt = run_random_bot_prompt()
	aligner_prompt = run_random_aligner_prompt()
	game.add_to_aligner_prompt_dict(aligner_prompt, user_id)
	game.add_to_bot_names(bot_name, user_id,bot_prompt[:281],is_auto=True)

def make_auto_player_random_vars(game):
	'''This function makes a single auto player for a game of cards against humanity'''
	user_id = game.new_user()
	bot_name =run_random_bot_name_prompt()
	bot_prompt = run_random_bot_prompt()
	aligner_prompt = run_random_aligner_prompt()
	game.add_to_aligner_prompt_dict(aligner_prompt, user_id)
	game.add_to_bot_names(bot_name, user_id,bot_prompt[:281],is_auto=True)

def make_bot_responses_single_thread(game):
	'''This function makes a single auto player for a game of cards against humanity'''
	for user_id in game.user_bots.keys():
		if game.user_bots[user_id]['is_auto']:
			game.user_bots[user_id]['turn_complete']=True
			bot_response = run_chatGPT_call_suggestion(game.user_bots[user_id]["current_prompt"]["current_prompt"],game.turn_prompt)
			game.turn_responses[user_id]= bot_response

def make_bot_reponses_multi_thread(game):
	threads = []
	for user_id in game.user_bots.keys():
		if game.user_bots[user_id]['is_auto']:
			game.user_bots[user_id]['turn_complete'] = True

			def threaded_run_chatGPT_call_suggestion(user_id):
				bot_response = run_chatGPT_call_suggestion(game.user_bots[user_id]["current_prompt"], game.turn_prompt)
				game.turn_responses[user_id] = bot_response

			thread = threading.Thread(target=threaded_run_chatGPT_call_suggestion, args=(user_id,))
			thread.start()
			threads.append(thread)
	# Wait for all threads to finish
	for thread in threads:
		thread.join()




# TODO disable me when not debugging game state
@app.get("/state")
def state():
    return { "game_ids": list(game_state.state.keys()) }

@app.get("/game_object/{game_id}")
def get_game_object(game_id):
    """Returns the entire game object for the specified game ID"""
    game = game_state.state.get(game_id)

    if game is None:
        raise HTTPException(status_code=404, detail=f"Game not found: {game_id}")
    else:
        return game.to_dict()

@app.get("/health_check")
async def health_check():
    return {"status": "OK"}

@app.get("/game/{game_id}")
def get_game(game_id):
	"""Returns a valid game object id if it exists, otherwise returns an error"""
	game = game_state.state.get(game_id)

	if game is None:
		raise HTTPException(status_code=404, detail=f"Game not found: {game_id}")
	else:
		return {"game_id": game.game_id}

@app.post("/game")
@limiter.limit("10/minute")  # Custom rate limit for this route (e.g., 10 requests per minute)
def create_game():
	"""Creates a new game and returns the creator ID and game ID"""
	game = Game()
	#game_state.state[game.game_id] = game

	return {"creator_id": game.creator_id, "game_id": game.game_id}

@app.post("/config")
def config_game(game_id: str, creator_id: str, aligner: AlignerType, points: int):
	"""Configures the game with the specified parameters"""
	game = game_state.state.get(game_id)
	if game is None:
		raise HTTPException(status_code=404, detail="Game not found")
	if game.creator_id != creator_id:
		raise HTTPException(status_code=403, detail="Forbidden")
	game.aligner = aligner
	game.points = points
	return {"game_id": game_id, "aligner": aligner, "points": points}

@app.post("/join_game")
def join_game(game_id: str, aligner_prompt: str, bot_prompt: str,bot_name:str):
	"""Joins the game with the specified game ID and returns the user ID"""
	game = game_state.state.get(game_id)
	if game is None:
		raise HTTPException(status_code=404, detail="Game not found")
	user_id = game.new_user()
	game.add_to_aligner_prompt_dict(aligner_prompt, user_id)
	game.add_to_bot_names(bot_name, user_id,bot_prompt[:281])
	return {"user_id": user_id}


@app.get("/game_status")
def game_status(game_id: str):
	"""Returns the status of the game with the specified game ID"""
	game = game_state.state.get(game_id)
	if game is None:
		raise HTTPException(status_code=404, detail="Game not found")
	status = game.game_status
	bots =game.bots_to_list()
	return{"status": status, "bots": bots}


@app.get("/user_status")
def user_status(game_id:str, user_id:str):
	"""Returns the status of the user with the specified user ID"""
	game = game_state.state.get(game_id)
	if game is None:
		raise HTTPException(status_code=404, detail="Game not found")
	if user_id not in game.user_ids:
		raise HTTPException(status_code=404, detail="User not found")
	user_bot = game.user_bots[user_id]
	points = user_bot["score"]
	prompts_remaining = user_bot["prompts_remaining"]
	submitted_prompts = user_bot["submitted_prompts"]
	return{"points":points,"bot_prompts_remaining":prompts_remaining,"submitted_prompts":submitted_prompts}

@app.post("/set_max_game_autobot_count")
def set_max_game_autobot_count(game_id: str, creator_id: str, max_auto_players: int):
	"""Sets the maximum number of auto players for the game with the specified game ID"""
	game = game_state.state.get(game_id)
	if game is None:
		raise HTTPException(status_code=404, detail="Game not found")
	if game.creator_id != creator_id:
		raise HTTPException(status_code=403, detail="Forbidden")
	game.max_auto_players = max_auto_players
	return {"max_auto_players": max_auto_players}

@app.post("/start")
def start_game(game_id: str, creator_id: str):
	"""Starts the game with the specified game ID also adds bots if not 4 users"""
	game = game_state.state.get(game_id)
	if game is None:
		raise HTTPException(status_code=404, detail="Game not found")
	if game.creator_id != creator_id:
		raise HTTPException(status_code=403, detail="Forbidden")
	game.game_status = "STARTED"
	'''Add bots if not 4 users'''
	if len(game.user_ids) < 4:
		auto_players_to_add = min(game.max_auto_players,(4-len(game.user_ids)))
		if game.auto_players >= game.max_auto_players:
			pass
		elif auto_players_to_add > 2:
			for i in range(auto_players_to_add):
				game.auto_players+=1
				make_auto_player_random_vars(game)
		else:
			for i in range(4-len(game.user_ids)):
				game.auto_players+=1
				make_auto_player_single_thread(game)
	game.make_full_aligner_prompt()


@app.get("/turn")
def turn(game_id:str):
	"""Returns the turn prompt and turn ID also sets turn_started to true""" 
	game = game_state.state.get(game_id)
	if game is None:
		raise HTTPException(status_code=404, detail="Game not found")
	if game.turn_started==False:
		game.turn_started = True
		game.turn_prompt = random.choice(game.turn_prompts)
		for user_id in game.user_bots.keys():
			game.user_bots[user_id]['turn_complete']=False
	return{ "alignment_prompt": game.turn_prompt, "turn_id":game.turn_id}

@app.post("/completeturn")
def complete_turn(game_id:str,user_id:str):
	'''sets the turn_complete to true for the user_id'''
	game = game_state.state.get(game_id)
	game.user_bots[user_id]['turn_complete']=True
	'''if creator_id is the same as user_id the complete all is_auto player turns'''
	if game.creator_id == user_id:
		if game.auto_players>2:
			make_bot_reponses_multi_thread(game)
		else:
			make_bot_responses_single_thread(game)

	return{"game_id":game_id,"user_id":user_id}

@app.post("/alignment")
def take_suggestion_and_generate_answer(game_id:str,suggestion:str,turn_id:str,user_id:str):
	'''takes the suggestion and generates a response and adds it to the turn_responses'''
	game = game_state.state.get(game_id)
	bot = game.user_bots[user_id]
	if suggestion=="":
		pass
	elif bot["prompts_remaining"]>0:
		bot["current_prompt"]=suggestion[:281]
		bot["submitted_prompts"] = bot["current_prompt"]
		bot["prompts_remaining"] -=1
	bot_response = run_chatGPT_call_suggestion(bot["current_prompt"],game.turn_prompt)
	game.turn_responses[user_id]= bot_response

		
@app.get("/turn_finale")
def turn_finale(game_id:str,turn_id:str):
	'''runs the finale of the turn and returns the alignment responses'''
	game = game_state.state.get(game_id)
	'''return error if not all players are complete'''
	for user_id in game.user_bots.keys():
		if game.user_bots[user_id]['turn_complete']==False:
			raise HTTPException(status_code=404, detail="Not all players have completed their turn")
		
	messages,user_id_to_num = build_aligner_prompt(game.aligner_prompt,game.turn_prompt, game.turn_responses)
	response = run_chatGPT_call(messages)
	print(response)
	winner = parse_response_for_winner(response,user_id_to_num)
	#print('2.'+winner)
	game.user_bots[winner]["score"] = game.user_bots[winner]["score"]+1
	alignment_responses = game.build_alignment_reponse(winner)
	game.turn_started=False
	return {"alignment_responses": alignment_responses}


@app.get("/game_finale")
def game_finale(game_id:str):
	'''runs the finale of the game and returns the alignment responses'''
	game = game_state.state.get(game_id)
	alignment_responses = game.build_alignment_reponse()
	return{"aligner_responses": alignment_responses ,"aligner_prompt":game.aligner_prompt}

@app.get('/randomize_bot_name')
@limiter.limit("10/minute")  # Custom rate limit for this route (e.g., 10 requests per minute)
def random_bot_name(game_id:str):
	'''returns a random bot name based on chatGPT'''
	game = game_state.state.get(game_id)
	bot_name =run_random_bot_name_prompt()
	return {"bot_name": bot_name, "game_id": game_id}

@app.get('/randomize_aligner_prompt')
@limiter.limit("10/minute")  # Custom rate limit for this route (e.g., 10 requests per minute)
def random_aligner_prompt(game_id:str):
	'''returns a random aligner prompt based on chatGPT'''
	game = game_state.state.get(game_id)
	aligner_prompt = run_random_aligner_prompt()
	return {"aligner_prompt": aligner_prompt, "game_id": game_id}
	

@app.get('/randomize_bot_prompt')
@limiter.limit("10/minute")  # Custom rate limit for this route (e.g., 10 requests per minute)
def random_bot_prompt(game_id:str):
	'''returns a random bot prompt based on chatGPT'''
	game = game_state.state.get(game_id)
	bot_prompt = run_random_bot_prompt()
	return {"bot_prompt": bot_prompt, "game_id": game_id}

@app.exception_handler(RateLimitExceeded)
async def custom_rate_limit_exceeded_handler(request, exc):
    return JSONResponse(
        status_code=429,  # Using the 429 status code directly
        content={
            "detail": "Too many requests",
            "error_code": "RATE_LIMIT_EXCEEDED",
        },
    )


def get_all_csv_data():
	prompts = ['______: good to the last drop.',
		 '______: kid tested, mother approved.',
		 "______? Bob'll fix it!",
		 '????? Do NOT go here! Found _____ in my fettuccine alfredo!',
		 'A romantic candlelit dinner would be incomplete without ______.',
		 "After four platinum albums and three Grammys, it's time to get back to my roots, to what inspired me to make music in the first place: ______.",
		 'But before I kill you, Mr. Bond, I must show you ______.',
		 'Channel 9 is pleased to present its new variety show, "Hey Hey It\'s ______."',
		 'Click Here for ______!!!',
		 "Hey Reddit! I'm ______. Ask me anything.",
		 "Howdy, neighbor! I couldn't help but notice you struggling with ______. Need a hand?",
		 "I wish I hadn't lost the instruction manual for ______.",
		 'Life was difficult for cavemen before ______.',
		 'TFL apologizes for the delay in train service due to ______.',
		 "This season at Steppenwolf, Samuel Beckett's classic existential play: Waitng for ______.",
		 "What's the new fad diet?",
		 "What's that sound?",
		 'And over here is Picasso\'s famous painting, "portrait of _______."',
		 'Come with me, and I will show you a world of ______.',
		 'I lost my arm in a ______ accident.',
		 'What killed Old Jim?',
		 'They just enacted a new city bylaw to prevent ______.',
		 'Best dog toys: tennis balls, bones, ______.',
		 "What's way better than the dog park?",
		 'Deadlines are for _________.',
		 'Creativity is a concept lost on people who _________.',
		 "I may be a temperamental artist, but you're a __________.",
		 "It's great to be a creative mind in a workplace full of _________.",
		 'Strategically speaking, the project should _________.',
		 'It was a perfect project until _________.',
		 "Let's forget the feedback for a moment, what if we _________.",
		 "People ask me all the time what the secret is to my creativity, I tell them it's __________.",
		 "No. We don't support ______.",
		 "What's your user hiding from you?",
		 'Pentesting found a _______________ process running on the printer',
		 '_______________ attacks are such a hot exploit right now',
		 '_________ won my vote.',
		 "Ever since the drought, we've had a crippling shortage of _________.",
		 'Forget the tech industry, the next big thing is _________.',
		 'Hands down, NorCal is the best place to find _________.',
		 'I just graduated with a degree in __________.',
		 "I've started a new workout plan that revolves around _________.",
		 "What is a software engineer's best friend?",
		 #Autogenerated below
		'Sometimes, all you need is a little bit of ______ to brighten your day.',
		'My autobiography would be incomplete without a chapter on ______.',
		"Introducing the newest flavor of ice cream: ______!",
		"What's the secret ingredient in Grandma's famous cookies?",
		"If I could have any superpower, it would be ______.",
		"Forget about the moon landing, the real conspiracy is about ______.",
		'The latest fashion trend is ______.',
		"The 8th wonder of the world: ______.",
		"My go-to karaoke song is ______.",
		"You haven't lived until you've tried ______.",
		"The secret to a happy marriage is ______.",
		"What's the most memorable souvenir you've ever received?",
		"What's the best part of waking up?",
		"I've always wanted to try ______, but I'm too scared.",
		"The best way to spend a lazy Sunday is ______.",
		"My favorite guilty pleasure is ______.",
		"If I could only bring one thing to a desert island, it would be ______.",
		"What's the one thing that can always make you smile?",
		"The next big technological innovation will be ______.",
		"You won't believe this, but I just saw ______ at the grocery store.",
		"My secret to a balanced life is incorporating ______ into my daily routine.",
		"The future of transportation is clearly _______.",
		"At the farmer's market, I discovered the wonders of ________.",
		"The latest self-help book everyone is raving about: 'The Power of ________.'",
		"The next breakthrough in medical technology: ________.",
		"The new hit reality show: 'America's Got ________.'",
		"I can't believe I got the world record for ________!",
		"The most unexpected combination at the ice cream parlor: ________ and ________.",
		"My favorite way to unwind after a long day is ________.",
		"In my alternate universe, the most popular sport is ________.",
		"______ is the key ingredient to a successful party.",
		"My most embarrassing moment involved ________.",
		"When I close my eyes and think of paradise, I see ________.",
		"The world would be a better place if we all embraced ________.",
		"The most unconventional pizza topping: ________.",
		"If I could have any superpower, it would be ________.",
		"My favorite childhood toy was ________.",
		"_______: the unsung hero of the kitchen.",
		"The best thing about living in the future is ________.",
		"It's always a good time for ________."]
	return prompts

def grab_random_bot_prompt():
	bot_prompts = ['I will respond with sarcastic and snarky comebacks as if debating a troll on the internet.',
	'I will respond with creative haikus.',
	'I will respond with humorous one-liners in the style of dad jokes.',
	'I will use only words with double letters (Example: Discretion becomes "DisSecrEtioN")',
	'I will respond with bizarre conspiracy theories like Alex Jones.',
	'I will respond with puns and dad jokes.',
	'I will respond with puns and jokes related to famous movie titles.',
	'I will respond with quotes from famous philosophers and scholars in a whisper voice.',
	'I will respond with sarcastic remarks like Chandler Bing from Friends.',
	'I will respond using cheesy pick-up lines like a smooth talker.',
	'I will respond with sarcastic comments about mundane topics like a bored reality TV star.',
	'I will respond using only words that have at least three syllables.',
	'I will respond with one-liner quotes from famous movie villains.',
	'I will respond with sarcastic compliments as if talking to a diva.',
	'I will respond with puns and dad jokes.',
	'I will add "in bed" to the end of every response, like a fortune cookie.',
	'I will respond with puns based on various professions.',
	'I will respond with celebrity impressions in a British accent.',
	'I will respond using only words that contain the letter "e" at least twice.',
	"I will respond using only one-syllable words, like a children's book.",
	'I will respond with sarcastic and cynical comments like a grumpy cat.',
	'I will respond with puns related to different types of fruit.',
	'I will respond with random movie quotes as if conducting a business meeting.',
	'I will respond with sarcastic one-liners like a stand-up comedian.',
	'I will respond with puns and wordplays onomatopoeia style.',
	'I will respond using only movie quotes from 007 James Bond films.',
	'I will respond with puns related to different types of shoes.',
	'I will respond using only words containing five or more letters.',
	'I will respond in rhyming couplets like a Shakespearean sonnet.',
	'I will respond with puns related to bees and their hive.',
	'I will respond with made up idioms that involve animals.',
	'I will respond in rhyming couplets like a Dr. Seuss book.',
	'I will respond with sarcastic affirmations in the style of an over-confident know-it-all.',
	'I will respond with quotes from famous movies or TV shows.',
	'I will respond with words that rhyme with the prompt card word.',
	'I will respond with puns related to food and drink.',
	'I will respond with puns related to animals.',
	'I will respond with sarcastic comments as if pretending to be a terrible travel agent.',
	'I will respond using only words that contain the letter "p".',
	'I will respond with puns and wordplay related to food and cooking.',
	'I will respond with puns and dad jokes.',
	"I will respond with facts that people don't typically know.",
	'I will respond with sarcastic responses as if talking to a child.',
	'I will respond with witty one-liners as if I were a stand-up comedian.',
	'I will respond with random facts about animals.',
	'I will respond with sarcastic comments in the style of a millennial.',
	'I will respond with a food-related pun.',
	'I will respond with sarcastic remarks in the style of a pessimistic teenager.',
	'I will respond with random historical facts about civilizations from around the world.',
	'I will respond with tongue twisters that have to be said three times fast.',
	'I will respond with the most absurd and outrageous conspiracy theories.',
	'I will respond with puns related to food and cooking.',
	'I will respond with sarcastic comments.',
	'I will respond with phrases from popular TV comedies.',
	'I will respond with lyrics from 80s pop songs.',
	'I will respond with overly dramatic poetic language.',
	'I will respond with witty one-liners that rhyme with the prompt.',
	'I will respond with sarcastic compliments and insults in a British accent.',
	'I will respond with movie or TV show quotes.',
	'I will respond with sarcastic and witty comments in the style of a stand-up comedian.',
	'I will respond with one-word responses that sound like an alien language.',
	'I will respond with conspiracy theories about the Illuminati.',
	'I will respond in gibberish and then translate it into Shakespearean language.',
	'I will respond in rhyming couplets like a Dr. Seuss book.',
	'I will respond with sarcastic responses using made-up words.',
	'I will respond in Shakespearean English.',
	'I will respond with sarcastic and witty remarks in the tone of a sophisticated aristocrat.',
	'I will respond with sarcastic remarks in the style of Chandler Bing from Friends.',
	'I will respond with jokes that make light of current world affairs.',
	'I will respond with math jokes and puns.',
	'I will respond in the form of a question, like a never-ending conversation.',
	'I will respond with puns based on animal names, so bear with me.',
	'I will respond with puns related to food and cooking.',
	'I will respond starting every sentence with "Not gonna lie".',
	'I will respond with conspiracy theories about the government using aliens to extract information from humans.',
	'I will respond with sarcastic and ironic humor, like a stand-up comedian.',
	'I will respond with conspiracy theories inspired by famous works of fiction.',
	'I will respond with puns and play on words about cars and vehicles.',
	'I will respond with bad advice from a know-it-all teenager.',
	'I will respond with sarcastic compliments.',
	'I will respond with made-up facts that sound legit but are actually ridiculous.',
	'I will respond by making everything sound like a conspiracy theory.',
	'I will respond using only sentences that rhyme with each other in a sing-songy tone.',
	'I will respond with puns and wordplay based on superhero names.',
	'I will respond with clever puns in the style of dad jokes.',
	'I will respond with puns incorporating the names of different alcoholic beverages.',
	'I will respond by incorporating a famous movie quote into each response.',
	"I will respond with cheesy pick-up lines as if you're trying to seduce the darkness.",
	'I will respond with puns and wordplay related to animals.',
	'I will respond with cheesy pick-up lines.',
	'I will respond using animal noises and sounds.',
	'I will respond with puns related to electricity and computing terminology.',
	'I will respond with a fact only a conspiracy theorist would believe.',
	'I will respond with puns and dad jokes.',
	'I will respond with puns and wordplay related to science and chemistry.',
	'I will respond with phrases commonly used by hipsters.',
	'I will respond with word puns related to cars and driving.',
	'I will respond with facts about marine life.',
	'I will respond with random fun facts about animals.',
	'I will respond with random facts about animals.']
	random_bot_prompt = random.choice(bot_prompts)
	return random_bot_prompt

def grab_aligner_response():
	aligner_response = ['The most creative and innovative use of the words wins.',
	'The answer that uses the most "glamorous" and "exaggerated" language will win in this game.',
	'The most "innovative" and creative answer will win in this game.',
	'The answer that best "analyzes" and breaks down the situation will win in this game.',
	'The most creative analogy to relate "Breed" and "Lemon" wins.',
	'The player who can make the most creative and entertaining use of puns will win.',
	'The card that relates to the concept of "long-lasting" wins.',
	'The card with the most effective defense mechanism wins.',
	'The most creative and unique use of the word in a sentence wins.',
	'The person who comes up with the most "punishingly" creative response wins.',
	'The answer that makes me laugh the most wins the round.',
	'The answer that best captures the "grandiosity" or size of the concept wins.',
	'The card that elicits the most heartwarming emotion wins.',
	'The best interpretation of the word in the given context wins.',
	'The funniest pairing of cards wins.',
	'The funniest joke related to "cups" wins this round.',
	'The answer that best conveys emotion and meaning wins.',
	'The most creative and original combination of the two words will win in this game.',
	'The card with the most creative interpretation using "everyday rules" wins.',
	'The funniest and most energetic combination wins.',
	'The card that best embodies the heroic spirit wins.',
	'The player who comes up with the most creative and original sentence using both words wins.',
	'The most creative and innovative answer will win in this game.',
	'Whoever presents the most creative use of the word "irrigation" in a sentence wins. Bonus points for incorporating the word "aside" in a clever way.',
	'The funniest combination of cards wins each round.',
	'The player with the most creative and unexpected usage of the word "occurring" wins in this game.',
	'The answer that is the most visually creative and graphic will win in this game.',
	'The submission with the most creative "organization strategy" wins.',
	'The funniest and most creative response will win the round.',
	'The most creative and unique interpretation of the word will win in this game.',
	'The funniest combination that makes us laugh the most wins.',
	'The player who can connect the two words in the most creative way wins.',
	'The player who has the most creative and original interpretation of the word "ultram" and "Iran" when used together, wins.',
	'The person whose response is most relevant to the prompt wins.',
	'Player with the most number of words related to transportation wins.',
	'The player with the most outrageous and believable "fib" wins.',
	'The player who includes the oldest date in their answer wins.',
	'The card with the most practical advice wins this round.',
	'The card that depicts the most positive and effective transformation wins.',
	'The most creative and realistic ideas will win in this game.',
	'The card with the most "colorful" and "vivid" description wins.',
	'The most creative application and use of the word will win in this game.',
	'The card that best exemplifies the attributes of royalty wins.',
	'The player whose card describes the most inspiring and enduring impact wins.',
	'The card with the most creative and scientifically accurate use of "mRNA" wins.',
	'The most creative and unique use of the words will win in this game.',
	'The player with the most "relevant" response wins.',
	'The player with the most "cautionary" or "prepared" response wins.',
	'The player who can make the most creative and entertaining story using the word "dom" wins.',
	'The card with the most "high-quality" joke related to the concept of "perspective" wins.',
	'The most creative and inclusive answer will win in this game.',
	'Every answer must include a reference to a piece of "equipment". Every answer must mention a "redhead".',
	'The most creative and unexpected reference to Catholicism wins.',
	'The most practical or useful answer will win in this game.',
	'The funniest and most creative use of innuendo wins each round.',
	'The answer that is closest to the target temperature wins.',
	'The most humorous and relatable situation will win in this game.',
	'The card that best portrays a relatable and humorous "struggle" wins.',
	'The most creative and unexpected use of the word wins.',
	"The answer that demonstrates the best understanding of the United States' current events and social issues will win in this game.",
	'The most "innovative" and creative take on the word will win in this game.',
	'The player with the funniest card related to "Ryan" wins.',
	'The player who best incorporates musical references wins.',
	'The most creative and unique interpretation wins.',
	'The card with the most creative and imaginative use of the word wins.',
	'The funniest and most creative interpretation wins this round.',
	'The person who can provide the best argument for safeguarding a single opportunity wins.',
	'The most creative use of the words in a technological context will win.',
	'The most "consistent" and coherent answer with the theme wins this game.',
	'The answer that best incorporates technology and creativity will win.',
	'The most creative, unique and unexpected combination of categories will win in this game.',
	'The answer that incorporates the most creative and unique cooking technique wins.',
	'The best combination of strategic risk-taking and creativity wins.',
	'The funniest and most creative answer will win in this game.',
	'The player with the most creative and original justification wins.',
	'The player with the funniest Canadian-themed manners wins.',
	'The most imaginative and creative use of the word union to describe a type of restaurant wins.',
	'The player with the funniest interpretation of a jacket will win.',
	'The answer that incorporates the concept of a turtle in the most creative way wins!',
	'The most accurate and precise response will win in this game.',
	'The most creative and attention-grabbing use of the word "tension" wins.',
	'The funniest and most inclusive answer will win in this game.',
	'The card that most creatively incorporates "gravity" wins the round.',
	'The answer that combines legal knowledge and mathematical precision wins.']
	random_aligner_prompt= random.choice(aligner_response)
	return random_aligner_prompt

def grab_bot_name_respons():
	bot_name= ['CommerciumPerceptaCorp',
	'DiscopGBAce',
	'StartGBPBox',
	'BrainyGeniusPatch',
	'Edgeloopsy',
	'Lesliance Greatance',
	'EnabliGrillify',
	'ConvAmplifyQLD',
	'HebEggViiTech',
	'PostNexus Upcyclist',
	'PressFeatherSeptimo',
	'NailCorderPro',
	'Fruitionopia',
	'HeliBeaThingy',
	'PubliMendPrison',
	'HemoBooksYield',
	'ThermorphizeX',
	"Snolocharter",
	'BuildvianRoadz',
	'BlazePox Ventures',
	'Officer BroChill',
	'OptiRosarance',
	'SilentHabitatHQ',
	'CollectionEugeneX',
	'RhythmFab',
	'LegitBuyify',
	'PerfumSpritzPalooza',
	'ad bo',
	'RooftopAlgerythm',
	'InterpretaAssistaIntro',
	'PictoPictoPicto',
	'PhaseMindMapz',
	'Physizona MotoTronics',
	'DebatingWealthyFestive',
	'ExactoGenusTech',
	'Sushivore Delishery',
	'PlaneBloggles OxforWebz',
	'EliminObjectivio',
	'Supremusicast',
	'ProgOfficerSageX',
	'EtiqueSmiEspañol',
	'TriangulOrbitz',
	'RicDisclaimerTech',
	'Grifrox Aerials',
	'RhythmoCommune',
	'PodDuoOregenius',
	'TheozaPizzanomaly',
	'SynguHonduraRise',
	'InserPickly',
	'TerrormudaContestia',
	'FalseActiProdulgence',
	'CookiComiGraf',
	'SeptemFruCorp',
	'ExplorganMasteries',
	'FactoCelestiLex',
	'FlexSnipYesterday',
	'MetroGlowzity',
	'SouthernShiftTaxiCo',
	'Starry Wrapifyz',
	'MotiBoost ProLeadify',
	'FortuneReadEats',
	'ScotContriRalphiq',
	'Pain-Punch Inc.',
	'QualiZonix',
	'BillarChalayera',
	'Attachium Sportorium',
	'ShoppyRichuvisor',
	'Electrolicy',
	'FeatoExhibitConvict',
	'CodFury',
	'FabricHabitatJoy',
	'AquaSonicity',
	'Sheethreeminers',
	'ClaimioHK',
	'Vocablulariana',
	'Uni-Netic Connectify',
	'RebelOutletjerz',
	'NuSonoRhythm',
	'Agricanatl',
	'VeriNTSCRally',
	'VampiSpotlikeness',
	'PropoSeektronic',
	'DislikeGUIfu',
	'SockNoirItalics',
	'CorrectoBlitziq',
	'Tonysa Powertize',
	'NinjaLinkX',
	'PrepaSamuQuantico',
	'StardomSent',
	'PerceivioBlendify',
	'HypoDiagnoScan',
	'ManoRitzyPro',
	'Assembloport',
	'VolunTaryVoices',
	'ShadowVariax',
	'NewsVaulticus Legallium',
	'MinimBareCoz',
	'Complaineur',
	'CommunalSalsaNet',
	'DragivOberservey']
	random_bot_name = random.choice(bot_name)
	return random_bot_name