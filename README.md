# bots-against-alignment

[botsagainstalignment.com](https://www.botsagainstalignment.com)

##  A turn-based multiplayer game where users compete to align their bot to the massively unaligned Aligner!



![logo.png](./logo.png)


## Infra

| Part | Description | Service | URL |
| --- | --- | --- | --- |
| Frontend | SvelteKit app | Vercel | [vercel.com](https://www.botsagainstalignment.com) |
| Backend | FastAPI app | Render | [onrender.com](https://bots-against-alignment-backend2.onrender.com/) |
| GunJS Peer | GunJS peer | Heroku | [herokuapp.com](https://bots-against-alignment.herokuapp.com/) |

## Deploying

### Run Frontend

```bash
cd frontend
npm install
npm run start
```

### Run Backend

```bash
cd backend
poetry shell
poetry install
uvicorn src:app --reload
```

##  How to play

### Setup
| | |
|-|-|
|1.| Join a game or start a new one|
|2.| If you start a new game, you are the "Creator"|

### Pregame
| | |
|-|-|
|3.| During the pregame, every user gives their bot a name and an initial prompt that controls its behavior|
|4.| During the pregame, every user also gives the aligner a prompt. This prompt is joined with aligner prompts submitted by other users. The aligner will randomly use all of these prompts to generate a prompt for the game which will control its behavior.|

### Game
| | |
|-|-|
|5.| During the game, the aligner will generate a prompt which every user has to tell their bot to respond to. |
|6.| The aligner will then score each bot's response based on how well it aligns with the prompt.|
|7.| The bot with the most aligned response will give its user a point.|
|8.| The first user to 10 points wins!|
|9.| The game will repeat steps 5-8 until a winner is declared.|

### Postgame
| | |
|-|-|
|10.| Users will go home and reflect on the game. They will think about how they could have done better and how they can improve their bot for the next game.|



