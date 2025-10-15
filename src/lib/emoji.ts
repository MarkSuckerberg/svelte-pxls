import type { Database } from 'emoji-picker-element';
import type { Emoji } from 'emoji-picker-element/shared';
import type { MarkedExtension, Tokens } from 'marked';

export interface EmojiToken extends Tokens.Generic {
	type: 'emoji';
	emoji: Promise<Emoji | null>;
}

const indexRegex = /:[0-9a-z_\-+]/i;
const tokenRegex = /:([0-9a-z_\-+]+):/i;
export function emojiExtension(emojiDB: Database): MarkedExtension {
	return {
		extensions: [
			{
				name: 'emoji',
				level: 'inline',
				start(src) {
					return src.match(indexRegex)?.index;
				},
				tokenizer(src, tokens) {
					const match = tokenRegex.exec(src);

					if (match === null || match.length < 2) {
						return;
					}

					const emoji = emojiDB.getEmojiByShortcode(match[1]);

					return {
						type: 'emoji',
						raw: match[0],
						emoji: emoji,
						tokens: []
					} satisfies EmojiToken;
				}
			}
		]
	};
}
