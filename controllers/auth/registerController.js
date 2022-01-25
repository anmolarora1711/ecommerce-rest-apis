import Joi from "joi";
import CustomErrorHandler from "../../services/CustomErrorHandler";
import { User, RefreshToken } from "../../models/index";
import bcrypt from "bcrypt";
import JwtService from "../../services/JwtService";
import { REFRESH_SECRET } from "../../config";

const registerController = {
	async register(req, res, next) {
		// Checklist
		// [+] Validate the request
		// [+] Authorize the request
		// [+] Check if user is in the database already
		// [+] Prepare model
		// [+] Store the database
		// [+] Generate JWT token
		// [+] Send response

		// Validation
		const registerSchema = Joi.object({
			name: Joi.string().min(3).max(30).required(),
			email: Joi.string().email().required(),
			password: Joi.string()
				.pattern(new RegExp("^[a-zA-Z0-9]{3,30}$"))
				.required(),
			repeat_password: Joi.ref("password"),
		});

		const { error } = registerSchema.validate(req.body);

		if (error) {
			return next(error);
		}

		// check if user is in the database already
		try {
			const exists = await User.exists({ email: req.body.email });
			if (exists) {
				return next(
					CustomErrorHandler.alreadyExist(
						"This email is already taken."
					)
				);
			}
		} catch (error) {
			return next(error);
		}

		const { name, email, password } = req.body;

		// Hash password
		const hashedPassword = await bcrypt.hash(password, 10);

		// prepare a model
		const user = new User({
			name,
			email,
			password: hashedPassword,
		});

		let access_token;
		let refresh_token;

		try {
			const result = await user.save();

			console.log(result);

			// Token
			access_token = JwtService.sign({
				_id: result._id,
				role: result.role,
			});
			refresh_token = JwtService.sign({
				_id: result._id,
				role: result.role,
			}, '1y', REFRESH_SECRET);

			// Database whitelist
			await RefreshToken.create({ token: refresh_token });
		} catch (error) {
			return next(error);
		}

		res.status(200).json({ access_token, refresh_token });
	},
};

export default registerController;
