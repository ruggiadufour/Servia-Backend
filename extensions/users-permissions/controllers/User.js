const _ = require("lodash");
const { sanitizeEntity } = require("strapi-utils");

const sanitizeUser = user =>
  sanitizeEntity(user, {
    model: strapi.query("user", "users-permissions").model
  });

const formatError = error => [
  { messages: [{ id: error.id, message: error.message, field: error.field }] }
];

module.exports = {
  /**
   * Retrieve user records.
   * @return {Object|Array}
   */
  async findOne(ctx, next, { populate } = {}) {
    const {id} = ctx.params
    const cookies = ctx.request.header.cookie

    let user = null;

    if(id){
        user = await strapi.query("user", "users-permissions").findOne({id: id},populate)

        if(!user){
            return {"statusCode":404,"error":"Not Found","message":"Not Found"}
        }
    }else{
        return {"statusCode":404,"error":"Not Found","message":"Not Found"}
    }

    const data = sanitizeUser(user)
    ctx.send(data);
  }
};


// https://github.com/strapi/strapi/issues/5618