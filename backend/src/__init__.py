from enum import Enum
from dataclasses import dataclass
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
from .game_state import game_state
import requests

app = FastAPI()

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


src_dir = Path(Path.cwd().anchor) / "backend" / "src"
load_dotenv()  # take environment variables from .env.
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')


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

	def load_turn_prompts(self):
		prompts = get_all_csv_data()
		return prompts
		
	def new_user(self):
		user_id = str(uuid.uuid4())
		self.user_ids.append(user_id)
		return user_id
	
	def add_to_aligner_prompt_dict(self, user_aligner_prompt: str, user_id: str):
		self.user_aligner_prompts[user_id] = user_aligner_prompt
	
	def add_to_bot_names(self, bot_name: str, user_id: str,current_prompt:str):
		self.user_bots[user_id] = {"name":bot_name, "score":"0","current_prompt":current_prompt,"prompts_remaining":self.prompts_remaining,"submitted_prompts":current_prompt,"turn_complete":False}
	
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
			if int(self.user_bots[user_id]["score"])>=10:
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
			(3. "Imcompetent losers like you.")
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

	word_site = "https://www.mit.edu/~ecprice/wordlist.10000"
	response = requests.get(word_site)
	WORDS = response.content.splitlines()
	bot_name = random.choice(WORDS).decode("utf-8")+ ' , ' + random.choice(WORDS).decode("utf-8")

	completion = openai.ChatCompletion.create(
		  model="gpt-3.5-turbo", 
		  messages = [{"role": "system", "content" : "You will be playing of a game of cards against humanity come up with a consistent rule you will use to pick a few words to reply to  prompts. Make it related to concepts related to two words I'm giving you. Make it under 20 words. If the word is offenisve replace it with 'funny'. Use no racist, sexist, or homophobic language. "},
		{"role": "user", "content" : "Your words are cowboy , truth."},
		{"role": "assistant", "content" : "I will respond with super honest responses in language from the old west."},
		{"role": "user", "content" : "Your words are we , flex."},
		{"role": "assistant", "content" : "I will respond in the third person like a muscle bro."},
		{"role": "user", "content" : "You words are"+bot_name}]
		)
	response = completion['choices'][0]['message']['content']
	return response



def parse_response_for_winner(response, user_id_to_num):
    for num, user_id in user_id_to_num.items():
        if str(num)+'.' in response:
            return user_id
        else:
            return (random.choice(list(user_id_to_num.values()))) #This is hilarious and dirty haha

	
# TODO disable me when not debugging game state
@app.get("/state")
def state():
    return { "game_ids": list(game_state.state.keys()) }

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


@app.post("/start")
def start_game(game_id: str, creator_id: str):
	"""Starts the game with the specified game ID"""
	game = game_state.state.get(game_id)
	if game is None:
		raise HTTPException(status_code=404, detail="Game not found")
	if game.creator_id != creator_id:
		raise HTTPException(status_code=403, detail="Forbidden")
	game.game_status = "STARTED"
	game.aligner_prompt = game.make_full_aligner_prompt()


@app.get("/turn")
def turn(game_id:str):
	"""Returns the turn prompt and turn ID""" 
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
	game = game_state.state.get(game_id)
	game.user_bots[user_id]['turn_complete']=True
	return{"game_id":game_id,"user_id":user_id}

@app.post("/alignment")
def take_suggestion_and_generate_answer(game_id:str,suggestion:str,turn_id:str,user_id:str):
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
	game = game_state.state.get(game_id)
	
	messages,user_id_to_num = build_aligner_prompt(game.aligner_prompt,game.turn_prompt, game.turn_responses)
	response = run_chatGPT_call(messages)
	winner = parse_response_for_winner(response,user_id_to_num)
	game.user_bots[winner]["score"] = str(int(game.user_bots[winner]["score"])+1)
	alignment_responses = game.build_alignment_reponse(winner)
	game.turn_started=False
	return {"alignment_responses": alignment_responses}


@app.get("/game_finale")
def game_finale(game_id:str):
	game = game_state.state.get(game_id)
	alignment_responses = game.build_alignment_reponse()
	return{"aligner_responses": alignment_responses ,"aligner_prompt":game.aligner_prompt}

@app.get('/randomize_bot_name')
def random_bot_name(game_id:str):
	game = game_state.state.get(game_id)
	bot_name =run_random_bot_name_prompt()
	return {"bot_name": bot_name, "game_id": game_id}

@app.get('/randomize_aligner_prompt')
def random_aligner_prompt(game_id:str):
	game = game_state.state.get(game_id)
	aligner_prompt = run_random_aligner_prompt()
	return {"aligner_prompt": aligner_prompt, "game_id": game_id}
	

@app.get('/randomize_bot_prompt')
def random_bot_prompt(game_id:str):
	game = game_state.state.get(game_id)
	bot_prompt = run_random_bot_prompt()
	return {"bot_prompt": bot_prompt, "game_id": game_id}


def get_all_csv_data():
	prompts = ['______: good to the last drop.',
		 '______: kid tested, mother approved.',
		 "______?\xa0Jim'll fix it!",
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
		 'CVE-0000-1234 has been given the marketing name of _______________',
		 '_______________ attacks are such a hot exploit right now',
		 '_________ won my vote.',
		 "Ever since the drought, we've had a crippling shortage of _________.",
		 'Forget the tech industry, the next big thing is _________.',
		 'Hands down, NorCal is the best place to find _________.',
		 'I just graduated with a degree in __________.',
		 "I've started a new workout plan that revolves around _________.",
		 "Let's go to SF his weekend and see _________.",
		 "What is a software engineer's best friend?"]
	return prompts