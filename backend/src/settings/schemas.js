import Joi from "joi";

const integrationsSchema = Joi.object({
	mastodonEnabled: Joi.boolean().required(),
	blueskyEnabled: Joi.boolean().required(),
});

export default {
	integrationsSchema,
};
