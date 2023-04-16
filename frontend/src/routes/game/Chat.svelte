<script>
    import { globalStore } from '$lib/store.js';
    import chat from '$lib/chat';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	let _messages = [
		// { isUser: true, name: 'User', icon: '/user-icon.png', text: 'Hello!' },
		// { isUser: false, name: 'John Doe', icon: '/john-icon.png', text: 'Hi there!' }
		// Add more messages as needed
	];
    let messages = writable(_messages)
	let inputText = '';

	function sendMessage() {
		if (inputText.trim() === '') return;
		// messages.push({ isUser: true, name: 'User', icon: '/user-icon.png', text: inputText });
        chat.sendMessage(inputText);
		inputText = '';
	}

	function handleKeyPress(event) {
		if (event.key === 'Enter') {
			sendMessage();
		}
	}

    let lastBotName = '';
    let hasJoinedChat = false;
    $: {
        // console.log("Chat.svelte: ", $globalStore);
        if ($globalStore.bot_name != null && $globalStore.bot_name !== lastBotName) {
            chat.leaveGame();
            chat.joinGame($globalStore.game_id, $globalStore.bot_name);
            hasJoinedChat = true;
            // console.log('JOINED CHAT')
            chat.subscribe((lastMessage, allMessages) => {
                // console.log('New Message: ', lastMessage);
                const isUser = lastMessage.botName === $globalStore.bot_name;
                const newMessage = { isUser, name: lastMessage.botName, icon: '../../static/noun-face-1751230.svg', text: lastMessage.message };
                // messages = [...messages];
                messages.update((messages) => {
                    messages.push(newMessage);
                    return messages;
                });
                // messages = [...messages];
                // console.log('MESSAGES: ', messages)
            });
        }
    }

    onMount(() => {
        // chat.joinGame($globalStore.game_id, $globalStore.bot_name);
        // chat.subscribe((lastMessage, messages) => {
        //     console.log('New Message: ', lastMessage);
        //     const isUser = lastMessage.userId === $globalStore.user_id;
        //     messages.push({ isUser, name: lastMessage.botName, icon: '/john-icon.png', text: lastMessage.message });
        // });
        return () => {
            chat.leaveGame();
        };
    });


    // $: {
    //     console.log("Chat.svelte: ", $globalStore);

    // }
</script>

<div class="chat-window">
	<div class="messages">
		{#each $messages as message (message)}
			<div class="message {message.isUser ? 'user' : 'other'}">
				<img class="message-icon" src={message.icon} alt={message.name} />
				<div class="message-text">{message.text}</div>
			</div>
		{/each}
	</div>
    {#if hasJoinedChat}
	<div class="input-container">
		<input
			class="message-input"
			type="text"
			placeholder="Type your message..."
			bind:value={inputText}
			on:keypress={handleKeyPress}
		/>
		<button class="send-button" on:click={sendMessage}>Send</button>
	</div>
    {:else}
    <div class="input-container">
        <p>Give your bot a name to join the chat!</p>
    </div>

    {/if}

</div>

<style>
	.chat-window {
		/* width: 400px; */
        
		height: 500px;
		/* border: 1px solid #ccc; */
		display: flex;
		flex-direction: column;
        align-items: space-between;
        justify-content: space-between;
        flex-grow: 2;
	}

	.messages {
		flex: 2;
		overflow-y: auto;
		padding: 5px;
		display: flex;
		flex-direction: column;
	}

	.message {
		display: flex;
		margin-bottom: 10px;
	}

	.message-icon {
		width: 30px;
		height: 30px;
		border-radius: 50%;
	}

	.message-text {
		padding: 10px;
		background-color: #eee;
		border-radius: 5px;
	}

	.user {
		justify-content: flex-start;
	}

	.other {
		justify-content: flex-end;
	}

	.input-container {
		display: flex;
		padding: 10px;
	}

	.message-input {
		flex: 1;
		padding: 5px 10px;
		border: 1px solid #ccc;
		border-radius: 5px;
        box-shadow: 0px 10px 15px -3px rgba(0,0,0,0.1);

	}

	.send-button {
		/* margin-left: 10px;
		padding: 5px 10px;
		border: none;
		background-color: black;
		color: white;
		border-radius: 5px; */
        font-size: 1.5rem;
		font-weight: bold;
		padding: 0.75rem 1.5rem;
		margin: 0.5rem 0.5rem;
		cursor: pointer;
		border: 2px solid rgb(0, 0, 0);
		background-color: rgb(0, 0, 0);
		border-radius: 2rem;
		color: white;
		box-shadow: 0px 10px 15px -3px rgba(0,0,0,0.1);
	}
    button:hover {
			background-color: rgb(123, 255, 0);
			color: rgb(0, 0, 0);
            border: 2px solid black;
		}
</style>
