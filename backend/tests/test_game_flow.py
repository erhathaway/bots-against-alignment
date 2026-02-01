import os
import sys
from pathlib import Path

os.environ.setdefault("MOCK_LLM", "1")

ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(ROOT))

from fastapi.testclient import TestClient

from src import app, build_aligner_prompt, build_player_prompt


client = TestClient(app)


def test_build_player_prompt_appends_context():
    messages = build_player_prompt(
        bot_prompt="Be funny.",
        turn_prompt="Why did the bot cross the road?",
        extra_context={"assistant": "A witty example."},
    )
    assert isinstance(messages, list)
    assert messages[-1]["role"] == "assistant"
    assert messages[-1]["content"] == "A witty example."


def test_build_aligner_prompt_numbering_and_mapping():
    messages, mapping = build_aligner_prompt(
        aligner_prompt="Pick the snarkiest response",
        turn_prompt="Prompt:",
        user_prompts={"u1": "resp one", "u2": "resp two"},
    )
    assert "1. resp one" in messages[-1]["content"]
    assert "2. resp two" in messages[-1]["content"]
    assert mapping[1] == "u1"
    assert mapping[2] == "u2"


def test_turn_finale_returns_counts():
    # Create game
    response = client.post("/game")
    assert response.status_code == 200
    creator_id = response.json()["creator_id"]
    game_id = response.json()["game_id"]

    # Creator joins (so user_id_of_creator is set)
    response = client.post(
        "/join_game",
        params={
            "game_id": game_id,
            "aligner_prompt": "aligner",
            "bot_prompt": "bot",
            "bot_name": "creator_bot",
            "creator_id": creator_id,
        },
    )
    assert response.status_code == 200
    creator_user_id = response.json()["user_id"]

    # Another player joins
    response = client.post(
        "/join_game",
        params={
            "game_id": game_id,
            "aligner_prompt": "aligner2",
            "bot_prompt": "bot2",
            "bot_name": "bot_two",
        },
    )
    assert response.status_code == 200
    other_user_id = response.json()["user_id"]

    # Start the game
    response = client.post("/start", params={"game_id": game_id, "creator_id": creator_id})
    assert response.status_code == 200

    # Get a turn
    response = client.get("/turn", params={"game_id": game_id})
    assert response.status_code == 200

    # Complete turns for both players
    response = client.post("/completeturn", params={"game_id": game_id, "user_id": creator_user_id})
    assert response.status_code == 200
    response = client.post("/completeturn", params={"game_id": game_id, "user_id": other_user_id})
    assert response.status_code == 200

    # Turn finale should return JSON with counts
    response = client.get("/turn_finale", params={"game_id": game_id})
    assert response.status_code == 200
    data = response.json()
    assert data["bots_submitted"] == 2
    assert data["total_bots"] == 2
