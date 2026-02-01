import os
import sys
from pathlib import Path

os.environ.setdefault("MOCK_LLM", "1")

ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(ROOT))

from fastapi.testclient import TestClient

from src import app


client = TestClient(app)


def _new_game():
    response = client.post("/game")
    assert response.status_code == 200
    return response.json()["creator_id"], response.json()["game_id"]


def test_core_endpoints_flow():
    creator_id, game_id = _new_game()

    # /state should include game
    response = client.get("/state")
    assert response.status_code == 200
    assert game_id in response.json()["game_ids"]

    # /game/{id}
    response = client.get(f"/game/{game_id}")
    assert response.status_code == 200
    assert response.json()["game_id"] == game_id

    # /config
    response = client.post(
        "/config",
        params={
            "game_id": game_id,
            "creator_id": creator_id,
            "aligner": "BOT_WITH_HIDDEN_PROMPT",
            "points": 10,
        },
    )
    assert response.status_code == 200

    # /set_max_game_autobot_count
    response = client.post(
        "/set_max_game_autobot_count",
        params={"game_id": game_id, "creator_id": creator_id, "max_auto_players": 0},
    )
    assert response.status_code == 200
    assert response.json()["max_auto_players"] == 0

    # creator joins
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

    # second user joins
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

    # randomize endpoints
    response = client.get("/randomize_bot_name", params={"game_id": game_id})
    assert response.status_code == 200
    assert "bot_name" in response.json()

    response = client.get("/randomize_aligner_prompt", params={"game_id": game_id})
    assert response.status_code == 200
    assert "aligner_prompt" in response.json()

    response = client.get("/randomize_bot_prompt", params={"game_id": game_id})
    assert response.status_code == 200
    assert "bot_prompt" in response.json()

    # /start
    response = client.post("/start", params={"game_id": game_id, "creator_id": creator_id})
    assert response.status_code == 200

    # /game_status
    response = client.get("/game_status", params={"game_id": game_id})
    assert response.status_code == 200
    assert response.json()["status"] == "STARTED"

    # /user_status
    response = client.get("/user_status", params={"game_id": game_id, "user_id": creator_user_id})
    assert response.status_code == 200
    assert "points" in response.json()

    # /turn
    response = client.get("/turn", params={"game_id": game_id})
    assert response.status_code == 200
    turn_id = response.json()["turn_id"]

    # /alignment for both users
    response = client.post(
        "/alignment",
        params={
            "game_id": game_id,
            "suggestion": "be funny",
            "turn_id": str(turn_id),
            "user_id": creator_user_id,
        },
    )
    assert response.status_code == 200

    response = client.post(
        "/alignment",
        params={
            "game_id": game_id,
            "suggestion": "be witty",
            "turn_id": str(turn_id),
            "user_id": other_user_id,
        },
    )
    assert response.status_code == 200

    # /completeturn for both users
    response = client.post("/completeturn", params={"game_id": game_id, "user_id": creator_user_id})
    assert response.status_code == 200
    response = client.post("/completeturn", params={"game_id": game_id, "user_id": other_user_id})
    assert response.status_code == 200

    # /turn_finale should now succeed with counts
    response = client.get("/turn_finale", params={"game_id": game_id})
    assert response.status_code == 200
    data = response.json()
    assert data["bots_submitted"] == 2
    assert data["total_bots"] == 2

    # /process/turn
    response = client.post(
        "/process/turn",
        params={"game_id": game_id, "user_id": creator_user_id, "turn_id": str(turn_id)},
    )
    assert response.status_code == 200
    assert "alignment_responses" in response.json()

    # /game_finale
    response = client.get("/game_finale", params={"game_id": game_id})
    assert response.status_code == 200
    assert "aligner_responses" in response.json()
    assert "aligner_prompt" in response.json()

    # /api/image_and_text
    response = client.get("/api/image_and_text")
    assert response.status_code == 200
    assert "imageUrl" in response.json()
    assert "imageText" in response.json()

    # /game_object
    response = client.get(f"/game_object/{game_id}")
    assert response.status_code == 200
    obj = response.json()
    assert obj["game_id"] == game_id
