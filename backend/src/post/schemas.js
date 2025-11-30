import Joi from "joi";

const postSchema = Joi.object({
	content: Joi.string().min(1).max(255).trim().required(),
	scheduledTime: Joi.date().iso().required(),
	visibility: Joi.string().valid("public", "private").required(),
	mediaIds: Joi.array().items(Joi.string()).required(),
	status: Joi.string().valid("pending", "canceled").optional(),
});

export default {
	postSchema,
};
