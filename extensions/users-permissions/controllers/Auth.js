"use strict";

/**
 * Auth.js controller
 *
 * @description: A set of functions called "actions" for managing `Auth`.
 */

/* eslint-disable no-useless-escape */
const crypto = require("crypto");
const _ = require("lodash");
const grant = require("grant-koa");
const { sanitizeEntity, parseMultipartData } = require("strapi-utils");

const emailRegExp = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const formatError = (error) => [
  { messages: [{ id: error.id, message: error.message, field: error.field }] },
];

module.exports = {
  async register(ctx) {
    const pluginStore = await strapi.store({
      environment: "",
      type: "plugin",
      name: "users-permissions",
    });

    const settings = await pluginStore.get({
      key: "advanced",
    });

    if (!settings.allow_register) {
      return ctx.badRequest(
        null,
        formatError({
          id: "Auth.advanced.allow_register",
          message: "Register action is currently disabled.",
        })
      );
    }
    //************************************************************************* */
    //Profile image to public_user
    let body, files;
    if (ctx.is("multipart")) {
      let data = parseMultipartData(ctx).data;
      files = parseMultipartData(ctx).files;

      body = data;
    } else {
      body = ctx.request.body;
    }
    console.log("Body:",body)

    const public_user = body.public_usr;
    const location = body.location; 
    //************************************************************************* */

    const params = {
      ..._.omit(body.private_usr, [
        "confirmed",
        "confirmationToken",
        "resetPasswordToken",
      ]),
      provider: "local",
    };

    // Password is required.
    if (!params.password) {
      return ctx.badRequest(
        null,
        formatError({
          id: "Auth.form.error.password.provide",
          message: "Please provide your password.",
        })
      );
    }

    // Email is required.
    if (!params.email) {
      return ctx.badRequest(
        null,
        formatError({
          id: "Auth.form.error.email.provide",
          message: "Please provide your email.",
        })
      );
    }

    // Throw an error if the password selected by the user
    // contains more than three times the symbol '$'.
    if (
      strapi.plugins["users-permissions"].services.user.isHashed(
        params.password
      )
    ) {
      return ctx.badRequest(
        null,
        formatError({
          id: "Auth.form.error.password.format",
          message:
            "Your password cannot contain more than three times the symbol `$`.",
        })
      );
    }

    const role = await strapi
      .query("role", "users-permissions")
      .findOne({ type: settings.default_role }, []);

    if (!role) {
      return ctx.badRequest(
        null,
        formatError({
          id: "Auth.form.error.role.notFound",
          message: "Impossible to find the default role.",
        })
      );
    }

    // Check if the provided email is valid or not.
    const isEmail = emailRegExp.test(params.email);

    if (isEmail) {
      params.email = params.email.toLowerCase();
    } else {
      return ctx.badRequest(
        null,
        formatError({
          id: "Auth.form.error.email.format",
          message: "Please provide valid email address.",
        })
      );
    }

    params.role = role.id;
    params.password = await strapi.plugins[
      "users-permissions"
    ].services.user.hashPassword(params);

    const user = await strapi.query("user", "users-permissions").findOne({
      email: params.email,
    });

    if (user && user.provider === params.provider) {
      return ctx.badRequest(
        null,
        formatError({
          id: "Auth.form.error.email.taken",
          message: "Email is already taken.",
        })
      );
    }

    if (user && user.provider !== params.provider && settings.unique_email) {
      return ctx.badRequest(
        null,
        formatError({
          id: "Auth.form.error.email.taken",
          message: "Email is already taken.",
        })
      );
    }

    //************************************************************************* */
    let id_location = null
    if(location?.province && location?.city){
      try{
        let [loc_exists] = await strapi.query("location").find(location);

        if(!loc_exists){
          loc_exists = await strapi.query("location").create(location);
        }
        id_location = loc_exists.id
      }catch(error){
        return error
      }
    }

    //Creating public user
    let p_user;
    if (files) {
      try {
        p_user = await strapi.services["public-user"].create({...public_user, location: id_location}, {
          files,
        });
      } catch (error) {
        return error;
      }
    } else {
      p_user = await strapi.query("public-user").create({...public_user, location: id_location});
    }

    try {
      if (!settings.email_confirmation) {
        params.confirmed = true;
      }

      //private user is created
      const user = await strapi
        .query("user", "users-permissions")
        .create({ ...params, public_user: p_user.id });

      const sanitizedUser = sanitizeEntity(user, {
        model: strapi.query("user", "users-permissions").model,
      });

      //update public_user id_private field
      await strapi
        .query("public-user")
        .update({ id: p_user.id }, { id_private: sanitizedUser.id });
      //************************************************************************* */

      if (settings.email_confirmation) {
        try {
          await strapi.plugins[
            "users-permissions"
          ].services.user.sendConfirmationEmail(user);
        } catch (err) {
          return ctx.badRequest(null, err);
        }

        return ctx.send({ user: sanitizedUser });
      }

      const jwt = strapi.plugins["users-permissions"].services.jwt.issue(
        _.pick(user, ["id"])
      );

      return ctx.send({
        jwt,
        user: sanitizedUser,
      });
    } catch (err) {
      const adminError = _.includes(err.message, "username")
        ? {
            id: "Auth.form.error.username.taken",
            message: "Username already taken",
          }
        : { id: "Auth.form.error.email.taken", message: "Email already taken" };

      ctx.badRequest(null, formatError(adminError));
    }
  },
};
