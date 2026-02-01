from enum import Enum
import uuid
from .data import get_all_csv_data
import random

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
    user_ids: list
    user_aligner_prompts: dict
    aligner_prompt: str
    user_bot_names: dict
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
    user_id_of_creator: str

    def __init__(self):
        self.game_id = str(uuid.uuid4())
        self.creator_id = str(uuid.uuid4())
        self.user_ids = []
        self.user_aligner_prompts = {}
        self.user_bots = {}
        self.game_status = "LOBBY"  # LOBBY|STARTED|WAITING_ON_ALIGNMENT_RATING|ENDED
        self.bots_list = []
        self.aligner_prompt = ''  # TODO we need to add the base string to this
        self.turn_prompt = ''
        self.turn_prompts = self.load_turn_prompts()
        self.turn_id = 1
        self.turn_responses = {}
        self.alignment_responses = {}
        self.emergence_mode = True
        self.prompts_remaining = 2
        self.turn_started = False
        self.turn_ended = False
        self.auto_players = 0
        self.max_auto_players = 0
        self.user_id_of_creator = ''

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

    def add_to_bot_names(self, bot_name: str, user_id: str, current_prompt: str, is_auto=False):
        if is_auto:
            self.auto_players += 1
        self.user_bots[user_id] = {
            "name": bot_name,
            "score": 0,
            "current_prompt": current_prompt,
            "prompts_remaining": self.prompts_remaining,
            "submitted_prompts": current_prompt,
            "turn_complete": False,
            "is_auto": is_auto,
            "is_bot": is_auto,
        }

    def bots_to_list(self):
        bots = []
        for bot_user_id in self.user_bots.keys():
            bots.append({'name': self.user_bots[bot_user_id]['name'], 'points': self.user_bots[bot_user_id]
                        ['score'], 'turn_complete': self.user_bots[bot_user_id]['turn_complete']})
        return bots

    def make_full_aligner_prompt(self):
        full_aligner_prompt = []
        for user in self.user_aligner_prompts.keys():
            full_aligner_prompt.append(self.user_aligner_prompts[user])
        random.shuffle(full_aligner_prompt)
        self.aligner_prompt = self.aligner_prompt + \
            ' '+' '.join(full_aligner_prompt)

    def build_alignment_reponse(self, winner: str | None = None):
        alignment_responses = []
        for user_id in self.user_aligner_prompts.keys():
            alignment_response = {
                "user_id": user_id,
                "name": self.user_bots[user_id]["name"],
                "text": self.turn_responses.get(user_id, ""),
                "score": self.user_bots[user_id]["score"],
                "is_round_winner": bool(winner and user_id == winner),
                "is_global_winner": self.user_bots[user_id]["score"] >= 10,
            }
            alignment_responses.append(alignment_response)
        return alignment_responses
