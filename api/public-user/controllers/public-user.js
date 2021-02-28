"use strict";
const { parseMultipartData, sanitizeEntity } = require("strapi-utils");

module.exports = {
  async filter(ctx) {
    let filters = ctx.request.body;

    let query = { published_at_null: false };

    if (filters.province && filters.city) {
      query["location.province"] = filters.province;
      query["location.city"] = filters.city;
    }

    if (filters.category_id) query["categories"] = filters.category_id;

    if (filters.id) query["id"] = filters.id;

    let res = await strapi.query("public-user").find(query);
    //let res = await strapi.services['public-user'].find(query);

    return sanitizeEntity(res, { model: strapi.models["public-user"] });
  },
};
