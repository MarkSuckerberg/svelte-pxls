import Snoozin from '$lib/assets/favicon.png';

export function doNotify(title: string, message: string) {
	if (!('Notification' in window)) {
		return;
	}

	const options: NotificationOptions = {
		lang: 'en',
		body: message,
		icon: Snoozin,
		badge: Snoozin
	};

	if (Notification.permission === 'granted') {
		new Notification(title, options);
		return;
	}

	Notification.requestPermission().then((status) => {
		if (status !== 'granted') {
			return;
		}

		new Notification(title, options);
	});
}
