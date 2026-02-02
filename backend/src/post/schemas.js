import Joi from "joi";

const postSchema = Joi.object({
	content: Joi.string().min(1).max(255).trim().required(),
	scheduledTime: Joi.date().iso().allow(null).optional(),
	visibility: Joi.string().valid("public", "private").required(),
	mediaIds: Joi.array().items(Joi.string()).required(),
	blueskyMedia: Joi.array().items(Joi.object().unknown(true)).optional(),
	status: Joi.string().valid("pending", "canceled", "draft").optional(),
	platforms: Joi.array()
		.items(Joi.string().valid("mastodon", "bluesky"))
		.optional(),
});

export default {
	postSchema,
};
