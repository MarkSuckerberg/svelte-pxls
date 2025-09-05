import express from 'express';
import { attach_sockets } from './server.socket.js';
import { handler } from '../build/handler.js';

const PORT = 3000;
const app = express();
const server = app.listen(PORT, () => {
	console.log(`server is listening at http://127.0.0.1:${PORT}`);
});
app.use(handler);
attach_sockets(server);
