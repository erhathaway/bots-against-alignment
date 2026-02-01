import sys
import os
import pytest

if os.getenv("RUN_MANUAL_TESTS") != "1":
    pytest.skip("Manual integration test; set RUN_MANUAL_TESTS=1 to run.", allow_module_level=True)

sys.path.append(os.path.dirname(os.path.abspath(__file__)) + '/..')

import time
from pprint import pprint
from fastapi.testclient import TestClient
from .__init__ import app
client = TestClient(app)


BASE_URL = "http://127.0.0.1:8000"


def test_flow():
    # Create a new game
    print('Starting test...')
    response = client.post(f"{BASE_URL}/game")
    assert response.status_code == 200, response.text
    creator_id = response.json()["creator_id"]
    game_id = response.json()["game_id"]
    print("\nCreating game...")
    print("....Game ID:", game_id)
    print("....Creator ID:", creator_id)


    # Configure the game
    aligner = "BOT_WITH_HIDDEN_PROMPT"
    points = 10
    response = client.post(f"{BASE_URL}/config", params={"game_id": game_id, "creator_id": creator_id, "aligner": aligner, "points": points})
    assert response.status_code == 200, response.text
    print("\nConfiguring game...")
    # Add auto players
    user_ids = []
    for player_number in range(4):
        print('....Initiating auto player # ', player_number)

        print("........Randomizing bot name...")
        response = client.get(f"{BASE_URL}/randomize_bot_name", params={"game_id": game_id})
        assert response.status_code == 200, response.text
        bot_name = response.json()["bot_name"]
        print('..............', bot_name)

        print("........Randomizing bot prompt...")
        response = client.get(f"{BASE_URL}/randomize_aligner_prompt", params={"game_id": game_id})
        assert response.status_code == 200, response.text
        aligner_prompt = response.json()["aligner_prompt"]
        print('..............', aligner_prompt)

        print("........Randomizing bot prompt...")
        response = client.get(f"{BASE_URL}/randomize_bot_prompt", params={"game_id": game_id})
        assert response.status_code == 200, response.text
        bot_prompt = response.json()["bot_prompt"]
        print('..............', bot_prompt)

        print("........Joining game...")
        user_creator_id = creator_id if player_number == 1 else None
        print('User creator id: ', user_creator_id)
        response = client.post(f"{BASE_URL}/join_game", params={"game_id": game_id, "aligner_prompt": aligner_prompt, "bot_prompt": bot_prompt, "bot_name": bot_name, "creator_id": user_creator_id})
        user_id = response.json()["user_id"]
        user_ids.append(user_id)
        print('..............', response)
        assert response.status_code == 200, response.text
    
    print("\nStarting game...")
    # Start the game
    response = client.post(f"{BASE_URL}/start", json={"game_id": game_id, "creator_id": creator_id})

    print("\nPlaying game...")
    # Play the game
    for turn in range(5):
        print(f"...Turn {turn + 1}...")

        print("........Getting turn...")
        response = client.get(f"{BASE_URL}/turn", params={"game_id": game_id})
        assert response.status_code == 200, response.text
        print(response)
        turn_id = response.json()["turn_id"]

        for user_id in user_ids:
            print(f"........User {user_id}...")
            print("............Submitting prompt...")
            response = client.post(f"{BASE_URL}/completeturn", params={"game_id": game_id, "user_id": str(user_id)})
            assert response.status_code == 200, response.text
            time.sleep(1)  # Wait for bots to generate responses

        print("........Getting turn results...")
        response = client.get(f"{BASE_URL}/turn_finale", params={"game_id": game_id, "turn_id": turn_id})
        assert response.status_code == 200, response.text
        print(response)
        # import ipdb; ipdb.set_trace()
        alignment_responses = response.json()["alignment_responses"]
        print("............Alignment responses...")
        pprint( alignment_responses)
        # print(f"Turn {turn + 1} results:")
        # print(alignment_responses)
        print('\n')

    print("\nEnding game...")
    # End the game
    response = client.get(f"{BASE_URL}/game_finale", params={"game_id": game_id})
    assert response.status_code == 200, response.text
    pprint(response.json())
            
    aligner_responses = response.json()["aligner_responses"]
    aligner_prompt = response.json()["aligner_prompt"]

    print("\nGame results:")
    print(aligner_responses)
    print("\nAligner prompt:", aligner_prompt)


if __name__ == "__main__":
    test_flow()
