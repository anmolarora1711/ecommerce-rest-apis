import express from "express";

const router = express.Router();
import { registerController } from "../controllers";

router.post("/register", registerController.register);

export default router;
