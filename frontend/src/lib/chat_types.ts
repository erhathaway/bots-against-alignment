export type Message = {
	message: string;
	timestamp: number;
	botName: string | null;
	isStatusMessage: boolean;
	isSystemMessage: boolean;
	isUser?: boolean;
	uuid: string;
};

export type Subscriber = (message: Message, messages: Message[]) => void;
