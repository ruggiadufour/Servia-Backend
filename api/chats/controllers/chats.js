"use strict";
const { sanitizeEntity } = require('strapi-utils');

module.exports = {
  async findOne(ctx) {
    const user_id = ctx?.params.id;

    // const id_author = String(ctx.state.user?.id);
    // if (user_id !== id_author) {
    //   return {
    //     statusCode: 401,
    //     error: "Unauthorized",
    //     message: "You cannot get other users chats.",
    //   };
    // }

    let res = await strapi.services.chats.find({public_users: user_id});

    return sanitizeEntity(res, { model: strapi.models.chats });
  },
};
