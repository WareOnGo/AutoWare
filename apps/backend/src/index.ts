import express, { Response, Request} from 'express';
import projectrouter from './routes/prioject.routes';
import renderrouter from './routes/render.routes';


const app = express();

app.use('/api/projects', projectrouter);

app.use('api/render', renderrouter)

projectrouter.get("/health", (req : Request, res : Response)=>{
    res.status(201).send("Server Up and Running")
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});