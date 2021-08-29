import express from "express";

const router = express.Router();
import { registerController } from "../controllers";
import { loginController } from "../controllers";

router.post("/register", registerController.register);
router.post("/login", loginController.login);

export default router;
