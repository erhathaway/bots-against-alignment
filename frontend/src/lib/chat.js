import GUN from 'gun';


class Chat {
    constructor() {
        this.gun = GUN();
        this.messages = [];
        this.gameId = null;
        this.botName = null;
    }

    joinGame(gameID, botName) {
        this.gameId = gameID;
        this.botName = botName;
        this.sendMessage('joined the game');
        this.gun.get('game').get(gameID).get('messages').on((data, key) => {
            this.messages.push(data);
        });
    }

    leaveGame() {
        this.sendMessage('left the game');
        this.gun.get('game').get(this.gameId).get('messages').off();
    }

    
    sendMessage(message) {
        this.gun.get('game').get(this.gameId).get('messages').set({
            message,
            timestamp: Date.now(),
            botName: this.botName,
        });


    }
}

export default new Chat();