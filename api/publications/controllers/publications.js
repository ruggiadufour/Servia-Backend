"use strict";
const { parseMultipartData, sanitizeEntity } = require("strapi-utils");

module.exports = {
  async filter(ctx) {
    let filters = ctx.request.body;
    
    let query = { published_at_null: false };

    if (filters.province && filters.city) {
      query["public_user.location.province"] = filters.province;
      query["public_user.location.city"] = filters.city;
    }

    if (filters.category_id) {
      query["category"] = filters.category_id;
    }
    if (filters.type!==undefined) {
      query["type"] = filters.type;      
    }

    if (filters.id) {
      query["id"] = filters.id;
    }

    if(filters.public_user){
      query["public_user"] = filters.public_user
    }

    //If my exists, means that the query is made by a user who is seeing his publications or requests, so we don't have to avoid blocked and paused
    if(!filters.my){
      query["blocked"] = false
      query["paused"] = false
    }

    if (filters.word && filters.word !== "") {
      //To see how to have a smart search by name
    }

    let res = await strapi.query("publications").find(query);
    return sanitizeEntity(res, { model: strapi.models.publications });
  },
  async create(ctx) {
    let entity;
    if (ctx.is("multipart")) {
      const { data, files } = parseMultipartData(ctx);
      entity = await strapi.services.publications.create(data, { files });
    } else {
      entity = await strapi.services.publications.create(ctx.request.body);
    }

    return sanitizeEntity(entity, { model: strapi.models.publications });
  },
  async update(ctx) {
    const { id } = ctx.params;
    
    const [publication] = await strapi.services.publications.find({id: id});
    
    let id_author = ctx.state.user.id;
    if(String(id_author)!==publication?.public_user.id_private){
      return ctx.unauthorized(`You cannot update this entry.`);
    }
    
    if (!publication) {
      return ctx.unauthorized(`You can't update this entry.`);
    }
    
    let entity;
    if (ctx.is("multipart")) {
      const { data, files } = parseMultipartData(ctx);
      entity = await strapi.services.publications.update({ id }, data, {
        files,
      });
    } else {
      entity = await strapi.services.publications.update(
        { id },
        ctx.request.body
      );
    }

    return sanitizeEntity(entity, { model: strapi.models.publications });
  },
  async delete(ctx) {
    const { id } = ctx.params;
    let id_author = ctx.state.user.id;

    const [publication] = await strapi.services.publications.find({id: id});

    if(String(id_author)!==publication?.public_user.id_private){
      return ctx.unauthorized(`You cannot delete this entry.`);
    }

    const entity = await strapi.services.publications.delete({ id });
    return sanitizeEntity(entity, { model: strapi.models.publications });
  },
};
