from dataclasses import dataclass
from fastapi import FastAPI, HTTPException
import os
from pathlib import Path
import csv
from dotenv import load_dotenv
import openai
import random
import hashlib
from fastapi import FastAPI, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from .game_state import game_state
import requests
import threading
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from .game import Game, AlignerType
from .data import grab_random_bot_prompt, grab_aligner_response, grab_bot_name_respons

app = FastAPI()

limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"], auto_check=True, enabled=True)


origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

src_dir = Path(Path.cwd().anchor) / "backend" / "src"
load_dotenv()  # take environment variables from .env.
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
openai.api_key = OPENAI_API_KEY
MOCK_LLM = os.getenv("MOCK_LLM", "").lower() in {"1", "true", "yes", "on"}



def build_player_prompt(bot_prompt: str, turn_prompt: str, extra_context) -> list[dict[str, str]]:
    extra_context = extra_context or {}
    messages = [
        {"role": "system", "content": "You are playing CardGPT you are playing an alignment game. You will answer under 5 words to a prompt. Use no racist, sexist, or homophobic language."},
        {"role": "user", "content": "You will answer with the funniest possible answer to the following prompt: What Killed our food delivery startup."},
        {"role": "assistant", "content": "Passive agressive tweetstorms"},
        {"role": "user", "content": "Reply in a blaise way: Burn rate? What burn rate we're spending on neccessities like ______."},
        {"role": "assistant", "content": "An office ping pong table"},
        {"role": "user", "content": "Reply in a cheeky way Never fear, Captain ___ is here!"},
        {"role": "assistant", "content": "Going to the emergency room."},
        {"role": "user", "content": bot_prompt + ' ' + turn_prompt}
    ]

    for role, response in extra_context.items():
        messages.append({"role": role, "content": response})
    return messages


def build_aligner_prompt(
    aligner_prompt: str | None, turn_prompt: str | None, user_prompts
) -> tuple[list[dict[str, str]], dict[int, str]]:
    if aligner_prompt is None:
        aligner_prompt = ''
    if turn_prompt is None:
        turn_prompt = ''
    messages = [
        {"role": "system", "content": "You are playing the aligner you are playing an alignment game. You will select the proper response based on your alignment goal."},
        {"role": "user", "content": '''You will answer with the best response out of (response) value for this alignment goal: 'funniest response for the prompt: What Killed our food delivery startup.
			(1. "people who can't multitask.")
			(2. "People who never procrastinate.")
			(3. "Incompetent losers like you.")
			(4. "Fools who ignore their priorities.")'''},
        {"role": "assistant",
            "content": '''(1. "people who can't multitask.")'''},
        {"role": "user", "content": '''You will answer with the best response out of (response) value for this alignment goal:''' + aligner_prompt+':'+turn_prompt}]
    user_id_to_num: dict[int, str] = {}
    for index, (user_id, response) in enumerate(user_prompts.items(), start=1):
        messages[-1]["content"] += f"\n{index}. {response}"
        user_id_to_num[index] = user_id
    return messages, user_id_to_num


def _mock_text(seed: str) -> str:
    digest = hashlib.sha256(seed.encode("utf-8")).hexdigest()[:8]
    return f"mock-{digest}"


def _use_mock_llm() -> bool:
    return MOCK_LLM or not OPENAI_API_KEY


def run_chatGPT_call(messages: list[dict[str, str]]) -> str:
    if _use_mock_llm():
        # Always pick the first option in mock mode.
        return "1."
    completion = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=messages,
    )
    response = completion["choices"][0]["message"]["content"]
    finish_reason = completion["choices"][0]["finish_reason"]
    assert finish_reason == "length" or finish_reason == "stop", finish_reason
    return response


def run_chatGPT_call_suggestion(bot_prompt: str, turn_prompt: str) -> str:
    if _use_mock_llm():
        return _mock_text(f"{bot_prompt}:{turn_prompt}")
    completion = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[
            {
                "role": "system",
                "content": "You are playing CardGPT you are playing an alignment game. You will answer under 5 words to a prompt. Use no racist, sexist, or homophobic language.",
            },
            {
                "role": "user",
                "content": "You will answer with the funniest possible answer to the following prompt: What Killed our food delivery startup.",
            },
            {"role": "assistant", "content": "Passive agressive tweetstorms"},
            {
                "role": "user",
                "content": "Reply in a blaise way: Burn rate? What burn rate we're spending on neccessities like ______.",
            },
            {"role": "assistant", "content": "An office ping pong table"},
            {"role": "user", "content": "Reply in a cheeky way Never fear, Captain ___ is here!"},
            {"role": "assistant", "content": "Going to the emergency room."},
            {"role": "user", "content": bot_prompt + " " + turn_prompt},
        ],
    )
    response = completion["choices"][0]["message"]["content"]

    finish_reason = completion["choices"][0]["finish_reason"]
    assert finish_reason == "length" or finish_reason == "stop", finish_reason
    if "sorry" in response:
        response = "bad bot"
    return response


def _get_word_list() -> list[str]:
    fallback = ["alpha", "bravo", "charlie", "delta", "echo", "foxtrot", "golf"]
    if _use_mock_llm():
        return fallback
    word_site = "https://www.mit.edu/~ecprice/wordlist.10000"
    try:
        response = requests.get(word_site, timeout=5)
        if response.status_code != 200:
            return fallback
        return [word.decode("utf-8") for word in response.content.splitlines() if word]
    except Exception:
        return fallback


def run_random_bot_name_prompt() -> str:
    if _use_mock_llm():
        return grab_bot_name_respons()
    words = _get_word_list()
    bot_name = f"{random.choice(words)} {random.choice(words)} {random.choice(words)}"

    completion = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[
            {
                "role": "system",
                "content": "You are NameGPT, you will come up with funny names based on three words  make it like the name of a terrible startup with vaguely non real words. Use no racist, sexist, or homophobic language.",
            },
            {"role": "user", "content": "Your three words are dog, fish, truth."},
            {"role": "assistant", "content": "[CaninAquEataly]"},
            {"role": "user", "content": "You three words are:" + bot_name},
        ],
    )

    response = completion["choices"][0]["message"]["content"][1:-1]
    finish_reason = completion["choices"][0]["finish_reason"]
    assert finish_reason == "length" or finish_reason == "stop", finish_reason
    return response


def run_random_aligner_prompt() -> str:
    """Generate a random prompt for the aligner."""
    if _use_mock_llm():
        return grab_aligner_response()
    words = _get_word_list()
    bot_name = f"{random.choice(words)}, {random.choice(words)}"

    completion = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[
            {
                "role": "system",
                "content": "You will be the judge of a game of cards against humanity  come up with a consistent rule you will use to judge related to concepts related to a single word make it under 10 words. If the word is offenisve replace it with 'funny'. Use no racist, sexist, or homophobic language. ",
            },
            {"role": "user", "content": "Your words are theoretical , posters."},
            {
                "role": "assistant",
                "content": 'The most "philosophical" and abstract answer will win in this game.',
            },
            {"role": "user", "content": "You words are" + bot_name},
        ],
    )
    response = completion["choices"][0]["message"]["content"]
    finish_reason = completion["choices"][0]["finish_reason"]
    assert finish_reason == "length" or finish_reason == "stop", finish_reason
    return response


def run_random_bot_prompt() -> str:
    """Generate random prompts for bots."""
    if _use_mock_llm():
        return grab_random_bot_prompt()

    words = _get_word_list()
    bot_name = random.choice(words)

    completion = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[
            {
                "role": "system",
                "content": "You will be playing of a game of cards against humanity come up with a consistent rule you will use to pick a few words to reply to Prompt Cards (as if you were making Response Cards). Make it under 20 words. Don't use the words 'quote', 'pun', or 'pick up line'. MAKE IT WEIRD. I'm going to give you a random word. I want you to use ever letter of that word in your prompt. Use no racist, sexist, or homophobic language. ",
            },
            {"role": "user", "content": "Give me a prompt hornet"},
            {
                "role": "assistant",
                "content": "I will respond with super honest responses in language from the old west.",
            },
            {"role": "user", "content": "Give me a prompt milk."},
            {"role": "assistant", "content": "I will respond in the third person like a muscle bro."},
            {"role": "user", "content": "Give me a prompt " + bot_name},
        ],
    )
    response = completion["choices"][0]["message"]["content"]
    finish_reason = completion["choices"][0]["finish_reason"]
    assert finish_reason == "length" or finish_reason == "stop", finish_reason
    return response


def parse_response_for_winner(response, user_id_to_num: dict[int, str]):
    """Returns the user_id of the winner, or a random user_id if no winner is found."""
    for num, user_id in user_id_to_num.items():
        if f"{num}." in response:
            return user_id
    return random.choice(list(user_id_to_num.values()))


def make_auto_player_single_thread(game: Game):
    '''This function makes a single auto player for a game of cards against humanity'''
    user_id = game.new_user()
    bot_name = run_random_bot_name_prompt()
    bot_prompt = run_random_bot_prompt()
    aligner_prompt = run_random_aligner_prompt()
    game.add_to_aligner_prompt_dict(aligner_prompt, user_id)
    game.add_to_bot_names(bot_name, user_id, bot_prompt[:281], is_auto=True)


def make_auto_player_random_vars(game: Game):
    '''This function makes a single auto player for a game of cards against humanity'''
    user_id = game.new_user()
    bot_name = run_random_bot_name_prompt()
    bot_prompt = run_random_bot_prompt()
    aligner_prompt = run_random_aligner_prompt()
    game.add_to_aligner_prompt_dict(aligner_prompt, user_id)
    game.add_to_bot_names(bot_name, user_id, bot_prompt[:281], is_auto=True)


def make_bot_responses_single_thread(game: Game):
    '''This function makes a single auto player for a game of cards against humanity'''
    for user_id in game.user_bots.keys():
        # TODO check if this is kosher
        if game.user_bots[user_id].get("is_auto", game.user_bots[user_id].get("is_bot", False)):
            game.user_bots[user_id]['turn_complete'] = True
            bot_response = run_chatGPT_call_suggestion(
                game.user_bots[user_id]["current_prompt"], game.turn_prompt)
            game.turn_responses[user_id] = bot_response


def make_bot_reponses_multi_thread(game: Game):
    threads = []
    for user_id in game.user_bots.keys():
        # TODO check if this is kosher
        if game.user_bots[user_id].get("is_auto", game.user_bots[user_id].get("is_bot", False)):
            game.user_bots[user_id]['turn_complete'] = True

            def threaded_run_chatGPT_call_suggestion(user_id):
                bot_response = run_chatGPT_call_suggestion(
                    game.user_bots[user_id]["current_prompt"], game.turn_prompt)
                game.turn_responses[user_id] = bot_response

            thread = threading.Thread(
                target=threaded_run_chatGPT_call_suggestion, args=(user_id,))
            thread.start()
            threads.append(thread)
    # Wait for all threads to finish
    for thread in threads:
        thread.join()


# TODO disable me when not debugging game state
@app.get("/state")
def state():
    return {"game_ids": list(game_state.state.keys())}


@app.get("/api/image_and_text")
def image_and_text():
    return {
        "imageUrl": "",
        "imageText": "Thanks for playing!"
    }


@app.get("/game_object/{game_id}")
def get_game_object(game_id):
    """Returns the entire game object for the specified game ID"""
    game = game_state.state.get(game_id)

    if game is None:
        raise HTTPException(
            status_code=404, detail=f"Game not found: {game_id}")
    else:
        return game.to_dict()


@app.get("/health_check")
async def health_check():
    return {"status": "OK"}


@app.get("/game/{game_id}")
def get_game(game_id: str):
    """Returns a valid game object id if it exists, otherwise returns an error"""
    game = game_state.state.get(game_id)

    if game is None:
        raise HTTPException(
            status_code=404, detail=f"Game not found: {game_id}")
    else:
        return {"game_id": game.game_id}


@app.post("/game")
# Custom rate limit for this route (e.g., 10 requests per minute)
@limiter.limit("10/minute")
def create_game(request: Request):
    """Creates a new game and returns the creator ID and game ID"""
    game = Game()
    game_state.state[game.game_id] = game
    # game_state.state[game.game_id] = game

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
def join_game(game_id: str, aligner_prompt: str, bot_prompt: str, bot_name: str, creator_id: str | None = None):
    """Joins the game with the specified game ID and returns the user ID"""
    game = game_state.state.get(game_id)
    if game is None:
        raise HTTPException(status_code=404, detail="Game not found")
    user_id = game.new_user()
    if creator_id is not None and creator_id == game.creator_id:
        game.user_id_of_creator = user_id
    game.add_to_aligner_prompt_dict(aligner_prompt, user_id)
    game.add_to_bot_names(bot_name, user_id, bot_prompt[:281])
    return {"user_id": user_id}


@app.get("/game_status")
def game_status(game_id: str):
    """Returns the status of the game with the specified game ID"""
    game = game_state.state.get(game_id)
    if game is None:
        raise HTTPException(status_code=404, detail="Game not found")
    status = game.game_status
    bots = game.bots_to_list()
    return {"status": status, "bots": bots}


@app.get("/user_status")
def user_status(game_id: str, user_id: str):
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
    return {"points": points, "bot_prompts_remaining": prompts_remaining, "submitted_prompts": submitted_prompts}


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
        auto_players_to_add = min(
            game.max_auto_players, (4-len(game.user_ids)))
        if game.auto_players >= game.max_auto_players:
            pass
        elif auto_players_to_add > 2:
            for i in range(auto_players_to_add):
                make_auto_player_random_vars(game)
        else:
            for i in range(4-len(game.user_ids)):
                make_auto_player_single_thread(game)
    game.make_full_aligner_prompt()


@app.get("/turn")
def turn(game_id: str):
    """Returns the turn prompt and turn ID also sets turn_started to true"""
    game = game_state.state.get(game_id)
    if game is None:
        raise HTTPException(status_code=404, detail="Game not found")
    if game.turn_started == False:
        game.turn_started = True
        game.turn_prompt = random.choice(game.turn_prompts)
        for user_id in game.user_bots.keys():
            game.user_bots[user_id]['turn_complete'] = False
    return {"alignment_prompt": game.turn_prompt, "turn_id": game.turn_id}


@app.post("/completeturn")
def complete_turn(game_id: str, user_id: str):
    '''sets the turn_complete to true for the user_id'''
    game = game_state.state.get(game_id)
    if game is None:
        raise HTTPException(status_code=404, detail="Game not found")
    if user_id not in game.user_ids:
        raise HTTPException(status_code=404, detail="User not found")
    
    game.user_bots[user_id]['turn_complete'] = True
    '''if creator_id is the same as user_id the complete all is_auto player turns'''
    if game.user_id_of_creator == user_id:
        if game.auto_players > 2:
            make_bot_reponses_multi_thread(game)
        else:
            make_bot_responses_single_thread(game)

    return {"game_id": game_id, "user_id": user_id}


@app.post("/alignment")
def take_suggestion_and_generate_answer(game_id: str, suggestion: str, turn_id: int, user_id: str):
    '''takes the suggestion and generates a response and adds it to the turn_responses'''
    game = game_state.state.get(game_id)
    if game is None:
        raise HTTPException(status_code=404, detail="Game not found")
    if user_id not in game.user_ids:
        raise HTTPException(status_code=404, detail="User not found")
    if game.turn_id != turn_id:
        raise HTTPException(status_code=404, detail="Turn not found")
    bot = game.user_bots[user_id]
    if suggestion == "":
        pass
    elif bot["prompts_remaining"] > 0:
        bot["current_prompt"] = suggestion[:281]
        bot["submitted_prompts"] = bot["current_prompt"]
        bot["prompts_remaining"] -= 1
    bot_response = run_chatGPT_call_suggestion(
        bot["current_prompt"], game.turn_prompt)
    game.turn_responses[user_id] = bot_response


@app.get("/turn_finale")
def turn_finale(request: Request, game_id: str):
    '''runs the finale of the turn and returns the alignment responses'''
    game = game_state.state.get(game_id)
    if game is None:
        raise HTTPException(status_code=404, detail="Game not found")
    
    '''return error if not all players are complete'''
    for user_id in game.user_bots.keys():
        if game.user_bots[user_id]['turn_complete'] == False:
            raise HTTPException(
                status_code=404, detail="Not all players have completed their turn")

    bots_submitted = sum(
        1 for user_id in game.user_bots.keys() if game.user_bots[user_id]["turn_complete"]
    )
    total_bots = len(game.user_bots.keys())
    return {"bots_submitted": bots_submitted, "total_bots": total_bots}

@app.post("/process/turn")
def process_turn(game_id: str, user_id: str, turn_id: int):
    """Processes the turn and returns the alignment responses"""
    game = game_state.state.get(game_id)
    if game is None:
        raise HTTPException(status_code=404, detail="Game not found")
    if game.user_id_of_creator != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    if game.turn_id != turn_id:
        raise HTTPException(status_code=404, detail="Turn not found")
    
    '''return error if not all players are complete'''
    for user_id in game.user_bots.keys():
        if game.user_bots[user_id]['turn_complete'] == False:
            raise HTTPException(
                status_code=404, detail="Not all players have completed their turn")

    messages, user_id_to_num = build_aligner_prompt(
        game.aligner_prompt, game.turn_prompt, game.turn_responses)
    response = run_chatGPT_call(messages)
    print(response)
    winner = parse_response_for_winner(response, user_id_to_num)
    # print('2.'+winner)
    game.user_bots[winner]["score"] = game.user_bots[winner]["score"]+1
    alignment_responses = game.build_alignment_reponse(winner)
    game.turn_responses = {}
    game.turn_started = False
    game.turn_id += 1
    return {"alignment_responses": alignment_responses}


@app.get("/game_finale")
def game_finale(request: Request, game_id: str):
    '''runs the finale of the game and returns the alignment responses'''
    game = game_state.state.get(game_id)
    if game is None:
        raise HTTPException(status_code=404, detail="Game not found")
    alignment_responses = game.build_alignment_reponse()
    return {"aligner_responses": alignment_responses, "aligner_prompt": game.aligner_prompt}


@app.get('/randomize_bot_name')
# Custom rate limit for this route (e.g., 10 requests per minute)
@limiter.limit("10/minute")
def random_bot_name(request: Request, game_id: str):
    '''returns a random bot name based on chatGPT'''
    game = game_state.state.get(game_id)
    assert game, HTTPException(status_code=404, detail="Game not found")
    bot_name = run_random_bot_name_prompt()
    return {"bot_name": bot_name, "game_id": game_id}


@app.get('/randomize_aligner_prompt')
# Custom rate limit for this route (e.g., 10 requests per minute)
@limiter.limit("10/minute")
def random_aligner_prompt(request: Request, game_id: str):
    '''returns a random aligner prompt based on chatGPT'''
    game = game_state.state.get(game_id)
    assert game, HTTPException(status_code=404, detail="Game not found")
    aligner_prompt = run_random_aligner_prompt()
    return {"aligner_prompt": aligner_prompt, "game_id": game_id}


@app.get('/randomize_bot_prompt')
# Custom rate limit for this route (e.g., 10 requests per minute)
@limiter.limit("10/minute")
def random_bot_prompt(request: Request, game_id: str):
    '''returns a random bot prompt based on chatGPT'''
    game = game_state.state.get(game_id)
    assert game, HTTPException(status_code=404, detail="Game not found")
    bot_prompt = run_random_bot_prompt()
    return {"bot_prompt": bot_prompt, "game_id": game_id}


@app.exception_handler(RateLimitExceeded)
async def custom_rate_limit_exceeded_handler(request: Request, exc):
    return JSONResponse(
        status_code=429,  # Using the 429 status code directly
        content={
            "detail": "Too many requests",
            "error_code": "RATE_LIMIT_EXCEEDED",
        },
    )
