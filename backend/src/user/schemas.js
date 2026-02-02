import Joi from "joi";

const targetsSchema = Joi.object({
	weeklyTarget: Joi.number().integer().min(0).required(),
	monthlyTarget: Joi.number().integer().min(0).required(),
});

const roleSchema = Joi.object({
	role: Joi.string().valid("user", "admin").required(),
});

export default {
	targetsSchema,
	roleSchema,
};
