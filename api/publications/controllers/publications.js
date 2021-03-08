"use strict";
const { parseMultipartData, sanitizeEntity } = require("strapi-utils");

module.exports = {
  async find(ctx) {
    // let query = { published_at_null: false };
    if(!ctx.query.my){
      ctx.query["blocked"] = false
      ctx.query["paused"] = false
      ctx.query["public_user.state"] = false

    }else{
      delete ctx.query.my
    }
    
    let entities;
    if (ctx.query._q) {
      entities = await strapi.services.publications.search(ctx.query);
    } else {
      entities = await strapi.services.publications.find(ctx.query);
    }

    return entities.map(entity => sanitizeEntity(entity, { model: strapi.models.publications }));
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

    //If the publication has an active report
    const existsReport = await strapi.services.reports.findOne({
      publication: publication.id,
      state: [1,0]
    });
    if (existsReport) {
      await strapi.services.reports.update(
        { id: existsReport.id },
        { state: -1 }
      );
    }
    //////////////////////////
    
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
