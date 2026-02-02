import Joi from "joi";

const targetsSchema = Joi.object({
	weeklyTarget: Joi.number().integer().min(0).required(),
	monthlyTarget: Joi.number().integer().min(0).required(),
});

export default {
	targetsSchema,
};
