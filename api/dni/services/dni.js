"use strict";
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/concepts/services.html#core-services)
 * to customize this service
 */

module.exports = {
  async update(params, data, files) {
    // const existingEntry = await strapi.query("dni").findOne(params);
    
    // console.log("14",existingEntry)

    // const isDraft = isDraft(existingEntry, strapi.models.dni);
    // const validData = await strapi.entityValidator.validateEntityUpdate(
    //   strapi.models.dni,
    //   data,
    //   { isDraft }
    // );

    // const entry = await strapi.query("dni").update(params, validData);
    const entry = await strapi.query("dni").findOne(params);
    
    if (files) {
      //automatically uploads the files based on the entry and the model
      await strapi.entityService.uploadFiles(entry, files, {
        model: "dni",
        // if you are using a plugin's model you will have to add the `source` key (source: 'users-permissions')
      });
      return this.findOne({ id: entry.id });
    }

    return entry;
  },
};
