import Joi from "joi";

const baseAuthSchema = {
	username: Joi.string().min(3).max(32).trim().required(),
	password: Joi.string().min(6).max(128).trim().required(),
};

const signInSchema = Joi.object(baseAuthSchema);

const signUpSchema = signInSchema.keys({
	confirmPassword: Joi.string()
		.trim()
		.valid(Joi.ref("password"))
		.required()
		.messages({
			"any.only": "Passwords must match",
			"any.required": "Password confirmation is required",
		}),
});

export default {
	signInSchema,
	signUpSchema,
};
