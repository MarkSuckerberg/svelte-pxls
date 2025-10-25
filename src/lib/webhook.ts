export async function sendMessage(
	webhook: string,
	content:
		| string
		| {
				title: string;
				timestamp: Date;
				url?: string;
				user: { image?: string | null; name: string };
				message: string;
		  }
) {
	if (typeof content == 'string') {
		return fetch(webhook, {
			method: 'POST',
			body: JSON.stringify({ username: 'Pixels', content }),
			headers: {
				'Content-Type': 'application/json'
			}
		});
	}

	const details = {
		username: 'Pixels',
		embeds: [
			{
				timestamp: content.timestamp.toISOString(),
				title: content.title,
				url: content.url,
				author: {
					name: content.user.name,
					icon_url: content.user.image
				},
				description: content.message
			}
		]
	};

	return fetch(webhook, {
		method: 'POST',
		body: JSON.stringify(details),
		headers: {
			'Content-Type': 'application/json'
		}
	});
}
