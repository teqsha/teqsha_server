import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/connect.js";
dotenv.config();


const app = express();
app.use(express.json());

app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    optionsSuccessStatus: 200,
}));

app.get("/", (_req, res) => {
    res.send("Hello from nikita");
} 
);
app.get("/Api", (_req, res) => {
    res.send("Hello from sujeet!");
}
);

import authRouter from "./routes/auth.js"
import fileRouter from "./routes/file.js";
import reelRouter from "./routes/reel.js";
import userRouter from "./routes/user.js";
import feedRouter from "./routes/feed.js";
import authMiddleware from "./middleware/authentication.js";

app.use('/api/oauth', authRouter);
app.use('/api/file', fileRouter);
app.use('/api', reelRouter);
app.use('/user', authMiddleware, userRouter);
app.use('/feed', authMiddleware, feedRouter);



const port = process.env.PORT || 3000 ;
const host = '0.0.0.0';

connectDB(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Connected..."))
    .catch(err => console.log(err));

app.listen(port,host, () => {
    console.log(`server is run ${host}:${port}`);
}
);
 
app.use((req, res) => {
    console.log(`❌ Unmatched route: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ message: 'Route not found' });
  });
  












