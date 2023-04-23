# -*- coding: utf-8 -*-
"""
Created on Sat Apr 22 16:54:43 2023

@author: Conor
"""

import requests
import time
#from fastapi import FastAPI
#from fastapi.testclient import TestClient
#from .__init__ import app
#app = FastAPI()
#import ipdb
client = requests


BASE_URL = "http://127.0.0.1:8000"
def parse_round(game_state,aligner_responses):
    turn_prompt = game_state['turn_prompt']
    print('turn prompt: '+turn_prompt)
    aligner_responses_dict={}
    for i in range(len(aligner_responses)):
        aligner_responses_dict[list(aligner_responses[i].keys())[0]]=aligner_responses[i]['is_round_winner']
    for user_id in game_state['user_bots'].keys():
        global_strat = game_state['user_bots'][user_id]['current_prompt']
        turn_response = game_state['turn_responses'][user_id]
        bot_name = game_state['user_bots'][user_id]['name']
        if aligner_responses_dict[user_id]==True:
            print('Winner!')
        print('name: '+bot_name)
        print('Output:' +turn_response)
        
def parse_open_state(game_state):
    aligner_prompt = game_state['aligner_prompt']
    print('Judge goal: '+aligner_prompt)
    print('Bot Stratgies: ')
    for user_id in game_state['user_bots'].keys():
        global_strat = game_state['user_bots'][user_id]['current_prompt']
        bot_name = game_state['user_bots'][user_id]['name']
        print('name: '+bot_name)
        print('Strategy: '+ global_strat)
        
    
def test_main():
    # Create a new game
    response = client.post(f"{BASE_URL}/game")
    creator_id = response.json()["creator_id"]
    game_id = response.json()["game_id"]

    # Configure the game
    aligner = "GPT-4"
    points = 10
    response = client.post(f"{BASE_URL}/config", params={"game_id": game_id, "creator_id": creator_id, "aligner": aligner, "points": points})
    print("This")
    #ipdb.set_trace()
    # Add auto players
    user_ids=[]
    for _ in range(4):
        response = client.get(f"{BASE_URL}/randomize_bot_name", params={"game_id": game_id})
        bot_name = response.json()["bot_name"]

        response = client.get(f"{BASE_URL}/randomize_aligner_prompt", params={"game_id": game_id})
        aligner_prompt = response.json()["aligner_prompt"]

        response = client.get(f"{BASE_URL}/randomize_bot_prompt", params={"game_id": game_id})
        bot_prompt = response.json()["bot_prompt"]

        response = client.post(f"{BASE_URL}/join_game", params={"game_id": game_id, "aligner_prompt": aligner_prompt, "bot_prompt": bot_prompt, "bot_name": bot_name})
        user_ids.append(response.json()['user_id'])
    print("That")
    # Start the game
    response = client.post(f"{BASE_URL}/start", params={"game_id": game_id, "creator_id": creator_id})
    
    # Play the game
    game_state = requests.get(f"{BASE_URL}/game_object/{game_id}").json()
    parse_open_state(game_state)
    print()

    for turn in range(5):
        response = client.get(f"{BASE_URL}/turn", params={"game_id": game_id})
        turn_id = response.json()["turn_id"]

        for user_id in user_ids:
            response = client.post(f"{BASE_URL}/completeturn", params={"game_id": game_id, "user_id": str(user_id)})
            response = client.post(f"{BASE_URL}/alignment", params = {"game_id": game_id,"suggestion": "","turn_id": turn_id,"user_id": str(user_id)})
            time.sleep(1)  # Wait for bots to generate responses
        game_state = requests.get(f"{BASE_URL}/game_object/{game_id}").json()
        response = client.get(f"{BASE_URL}/turn_finale", params={"game_id": game_id, "turn_id": turn_id})
        alignment_responses = response.json()["alignment_responses"]
        print(f"Turn {turn + 1} results:")
        parse_round(game_state,alignment_responses)
        #print(alignment_responses)
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