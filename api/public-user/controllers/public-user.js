'use strict';
const { parseMultipartData, sanitizeEntity } = require('strapi-utils');

module.exports = {
    async filter(ctx) { 
        let filters = ctx.request.body;

        let query = {published_at_null: false}
        
        if(filters.category_id)
        query["categories"] = filters.category_id
        
        console.log(query)

        let res = await strapi.query('public-user').find(query);
        return sanitizeEntity(res, { model: strapi.models['public-user']})

    },
};
