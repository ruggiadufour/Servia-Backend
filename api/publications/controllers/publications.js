'use strict';
const { parseMultipartData, sanitizeEntity } = require('strapi-utils');

module.exports = {
    async filter(ctx) { 
        let filters = ctx.request.body;

        let query = {}
        
        if(filters.services && filters.services.length!==0){
            let services_id = filters.services.map(service => service.id)
            query["service"] = services_id
        }else{
            query["categories"] = filters.category_id
        }

        if(filters.typePublication) query["type"] = filters.typePublication;

        if(filters.word && filters.word!==""){
            //To see how to have a smart search by name
        }

        let res = await strapi.query('publications').find(query);
        return sanitizeEntity(res, { model: strapi.models.publications });
    },
};
