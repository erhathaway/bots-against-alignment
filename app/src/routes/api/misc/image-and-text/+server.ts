import { json } from '@sveltejs/kit';

export const GET = async () => {
	return json({
		imageUrl: '',
		imageText: 'Thanks for playing!'
	});
};
