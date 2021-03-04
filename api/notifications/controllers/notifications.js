"use strict";
const { sanitizeEntity } = require("strapi-utils");
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async read(ctx) {
    const notifications = await strapi.services.notifications.find({
      receiver: ctx.state.user.id,
    });
    const entity = await Promise.all(
      notifications.map(async (notification) => {
        if(notification.read===false){
            return await strapi.services.notifications.update(
                { id: notification.id },
                { read: true }
              );
        }else{
            return notification
        }
      })
    );
    
    return sanitizeEntity(entity, { model: strapi.models.notifications });
  },
};
