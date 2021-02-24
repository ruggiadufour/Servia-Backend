"use strict";
const { sanitizeEntity } = require("strapi-utils");

module.exports = {
  async filter(ctx) {
    let filters = ctx.request.body;

    let query = {published_at_null: false};

    if (filters.category_id) {
      query["category"] = filters.category_id;
      query["type"] = filters.type;
    }

    if (filters.id) {
      query["id"] = filters.id;
    }

    if (filters.word && filters.word !== "") {
      //To see how to have a smart search by name
    }

    let res = await strapi.query("publications").find(query)
    return sanitizeEntity(res, { model: strapi.models.publications });
  },
};
