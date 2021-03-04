"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async create(ctx) {
    const body = ctx.request.body;
    let existsReport;
    //Check if exists a report for the publication/profile reported
    if (body.public_user) {
      existsReport = await strapi.services.reports.findOne({
        public_user: body.public_user,
        state: [1, -1, 0],
      });
    } else {
      existsReport = await strapi.services.reports.findOne({
        publication: body.publication,
        state: [1, -1, 0],
      });
    }

    console.log(existsReport)
    
    //if there is a report for the publication/user, then we attach data to that report
    console.log(body)
    if (existsReport) {
      await strapi.services.reports.update(
        {
          id: existsReport.id,
        },
        {
          description: existsReport.description + " ➡\n " + body.description,
          state: 0,
          motives: [
            ...existsReport.motives.map((motive) => motive.id),
            ...body.motives,
          ],
        }
      );
      return { success: true };
    } else {
      await strapi.services.reports.create(body);
      return { success: true };
    }
  },
};
