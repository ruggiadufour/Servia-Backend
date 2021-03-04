"use strict";

const _ = require("lodash");
const { sanitizeEntity, parseMultipartData } = require("strapi-utils");

const sanitizeUser = (user) =>
  sanitizeEntity(user, {
    model: strapi.query("user", "users-permissions").model,
  });

const formatError = (error) => [
  { messages: [{ id: error.id, message: error.message, field: error.field }] },
];

module.exports = {
  /**
   * Create a/an user record.
   * @return {Object}
   */
  async create(ctx) {
    const advanced = await strapi
      .store({
        environment: "",
        type: "plugin",
        name: "users-permissions",
        key: "advanced",
      })
      .get();

    const { email, username, password, role } = ctx.request.body;

    if (!email) return ctx.badRequest("missing.email");
    if (!username) return ctx.badRequest("missing.username");
    if (!password) return ctx.badRequest("missing.password");

    const userWithSameUsername = await strapi
      .query("user", "users-permissions")
      .findOne({ username });

    if (userWithSameUsername) {
      return ctx.badRequest(
        null,
        formatError({
          id: "Auth.form.error.username.taken",
          message: "Username already taken.",
          field: ["username"],
        })
      );
    }

    if (advanced.unique_email) {
      const userWithSameEmail = await strapi
        .query("user", "users-permissions")
        .findOne({ email: email.toLowerCase() });

      if (userWithSameEmail) {
        return ctx.badRequest(
          null,

          formatError({
            id: "Auth.form.error.email.taken",
            message: "Email already taken.",
            field: ["email"],
          })
        );
      }
    }

    const user = {
      ...ctx.request.body,
      provider: "local",
    };

    user.email = user.email.toLowerCase();

    if (!role) {
      const defaultRole = await strapi
        .query("role", "users-permissions")
        .findOne({ type: advanced.default_role }, []);

      user.role = defaultRole.id;
    }

    try {
      const data = await strapi.plugins["users-permissions"].services.user.add(
        user
      );

      ctx.created(sanitizeUser(data));
    } catch (error) {
      ctx.badRequest(null, formatError(error));
    }
  },
  /**
   * Update a/an user record.
   * @return {Object}
   */

  async update(ctx) {
    const advancedConfigs = await strapi
      .store({
        environment: "",
        type: "plugin",
        name: "users-permissions",
        key: "advanced",
      })
      .get();

    const { id } = ctx.params;

    let private_user, public_user, files, dni_files, location;
    if (ctx.is("multipart")) {
      let data = parseMultipartData(ctx).data;
      let Files = parseMultipartData(ctx).files;
      if (Files.profile) {
        files = Files;
      }
      if (Files.photos) {
        dni_files = Files;
      }

      private_user = data.private_usr;
      public_user = data.public_usr;
      location = data.location;
    } else {
      private_user = ctx.request.body.private_usr;
      public_user = ctx.request.body.public_usr;
      location = ctx.request.body.location;
    }

    //Validate if a user tries to modify other one
    const id_author = String(ctx.state.user.id);
    if (id !== id_author) {
      return {
        statusCode: 401,
        error: "Unauthorized",
        message: "You cannot modify other users.",
      };
    }
    //

    const { email, username, password } = private_user;

    const user = await strapi.plugins["users-permissions"].services.user.fetch({
      id,
    });

    if (_.has(private_user, "email") && !email) {
      return ctx.badRequest("email.notNull");
    }

    if (_.has(private_user, "username") && !username) {
      return ctx.badRequest("username.notNull");
    }

    if (
      _.has(private_user, "password") &&
      !password &&
      user.provider === "local"
    ) {
      return ctx.badRequest("password.notNull");
    }

    if (_.has(private_user, "username")) {
      const userWithSameUsername = await strapi
        .query("user", "users-permissions")
        .findOne({ username });

      if (userWithSameUsername && userWithSameUsername.id != id) {
        return ctx.badRequest(
          null,
          formatError({
            id: "Auth.form.error.username.taken",
            message: "username.alreadyTaken.",
            field: ["username"],
          })
        );
      }
    }

    if (_.has(private_user, "email") && advancedConfigs.unique_email) {
      const userWithSameEmail = await strapi
        .query("user", "users-permissions")
        .findOne({ email: email.toLowerCase() });

      if (userWithSameEmail && userWithSameEmail.id != id) {
        return ctx.badRequest(
          null,
          formatError({
            id: "Auth.form.error.email.taken",
            message: "Email already taken",
            field: ["email"],
          })
        );
      }
      private_user.email = private_user.email.toLowerCase();
    }

    //************************************************************************* */
    //Modification
    let id_location = null;
    if (location?.province && location?.city) {
      try {
        let [loc_exists] = await strapi.query("location").find(location);

        if (!loc_exists) {
          loc_exists = await strapi.query("location").create(location);
        }
        id_location = loc_exists.id;
      } catch (error) {
        return error;
      }
    }

    //Update public-user data
    let updated_public_user;
    if (public_user) {
      if (files) {
        try {
          updated_public_user = await strapi.services["public-user"].update(
            { id_private: id },
            { ...public_user, location: id_location },
            {
              files,
            }
          );
        } catch (error) {
          return error;
        }
      } else {
        updated_public_user = await strapi.services["public-user"].update(
          { id_private: id },
          { ...public_user, location: id_location }
        );
      }
    }

    //If the user has a active report
    const existsReport = await strapi.services.reports.findOne({
      public_user: updated_public_user.id,
      state: [1,0]
    });
    if (existsReport) {
      await strapi.services.reports.update(
        { id: existsReport.id },
        { state: -1 }
      );
    }
    //////////////////////////

    if (_.has(private_user, "password") && password === user.password) {
      delete private_user.password;
    }

    ///Uploading dni_images
    if (dni_files) {
      try {
        await strapi.services.dni.update({ id_private: id }, {}, dni_files);
      } catch (error) {
        return error;
      }
    }

    let data;
    try {
      data = await strapi.plugins["users-permissions"].services.user.edit(
        { id },
        { ...private_user }
      );
    } catch (error) {
      console.log("error,", error);
      return error;
    }

    ctx.send(sanitizeUser(data));
  },
};
