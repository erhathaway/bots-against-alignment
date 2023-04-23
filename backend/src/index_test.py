# -*- coding: utf-8 -*-
"""
Created on Sat Apr 22 16:54:43 2023

@author: Conor
"""

import requests
import time
from fastapi import FastAPI
from fastapi.testclient import TestClient
from .__init__ import app
#app = FastAPI()
#import ipdb
client = TestClient(app)


BASE_URL = "http://127.0.0.1:8000"


def test_main():
    # Create a new game
    response = client.post(f"{BASE_URL}/game")
    creator_id = response.json()["creator_id"]
    game_id = response.json()["game_id"]

    # Configure the game
    aligner = "GPT-4"
    points = 10
    response = client.post(f"{BASE_URL}/config", json={"game_id": game_id, "creator_id": creator_id, "aligner": aligner, "points": points})
    print("This")
    #ipdb.set_trace()
    # Add auto players
    for _ in range(4):
        response = client.get(f"{BASE_URL}/randomize_bot_name", params={"game_id": game_id})
        bot_name = response.json()["bot_name"]

        response = client.get(f"{BASE_URL}/randomize_aligner_prompt", params={"game_id": game_id})
        aligner_prompt = response.json()["aligner_prompt"]

        response = client.get(f"{BASE_URL}/randomize_bot_prompt", params={"game_id": game_id})
        bot_prompt = response.json()["bot_prompt"]

        response = client.post(f"{BASE_URL}/join_game", json={"game_id": game_id, "aligner_prompt": aligner_prompt, "bot_prompt": bot_prompt, "bot_name": bot_name})
    print("That")
    # Start the game
    response = client.post(f"{BASE_URL}/start", json={"game_id": game_id, "creator_id": creator_id})

    # Play the game
    for turn in range(5):
        response = client.get(f"{BASE_URL}/turn", params={"game_id": game_id})
        turn_id = response.json()["turn_id"]

        for user_id in range(4):
            response = client.post(f"{BASE_URL}/completeturn", json={"game_id": game_id, "user_id": str(user_id)})
            time.sleep(1)  # Wait for bots to generate responses
       
        response = client.get(f"{BASE_URL}/turn_finale", params={"game_id": game_id, "turn_id": turn_id})
        alignment_responses = response.json()["alignment_responses"]
        print(f"Turn {turn + 1} results:")
        print(alignment_responses)
        print()

    # End the game
    response = client.get(f"{BASE_URL}/game_finale", params={"game_id": game_id})
    aligner_responses = response.json()["aligner_responses"]
    aligner_prompt = response.json()["aligner_prompt"]

    print("Game results:")
    print(aligner_responses)
    print("Aligner prompt:", aligner_prompt)


if __name__ == "__main__":
    test_main()