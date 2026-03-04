import 'dotenv/config';
import express, { Response, Request } from 'express';
import cors from 'cors';
import projectrouter from './routes/prioject.routes';
import renderrouter from './routes/render.routes';
import warehouserouter from './routes/warehouse.routes';
import compositionrouter from './routes/composition.routes';
import r2router from './routes/r2.routes';
import ttsrouter from './routes/tts.routes';
import mapsrouter from './routes/maps.routes';


const app = express();

const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map(u => u.trim())
    : ['http://localhost:5173'];

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
}));
app.use(express.json());

app.use('/api/projects', projectrouter);

app.use('/api/render', renderrouter);

app.use('/api/warehouse', warehouserouter);

app.use('/api/composition', compositionrouter);

app.use('/api/r2', r2router);

app.use('/api/tts', ttsrouter);

app.use('/api/maps', mapsrouter);

projectrouter.get("/health", (req: Request, res: Response) => {
    res.status(201).send("Server Up and Running")
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});