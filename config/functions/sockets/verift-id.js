module.exports = function (socket, currentConnections) {
  socket.on("setVerification", async (data) => {
    const { id, description, isAccepted, jwt } = JSON.parse(data);

    //Validate jwt
    let isValid;
    try {
      isValid = await strapi.plugins["users-permissions"].services.jwt.verify(
        jwt
      );
    } catch (error) {
      return error;
    }

    //Find the admin user
    const user_admin = await strapi.plugins[
      "users-permissions"
    ].services.user.fetch({
      id: isValid.id,
    });

    //Validate if has the role to modify users
    if (user_admin?.role.id === 3) {
      if (isAccepted)
        await strapi.services["public-user"].update(
          { id_private: id },
          { verified: isAccepted }
        );

      //Update the user state
      let updated_user = await strapi.plugins[
        "users-permissions"
      ].services.user.edit({ id }, { waiting_verification: false });

      //If the verification wasn't successful, then we delete the dni images
      if (!isAccepted) {
        updated_user.dni_image.photos.map(async (image) => {
          const file = await strapi.plugins["upload"].services.upload.fetch({
            id: image.id,
          });
          await strapi.plugins["upload"].services.upload.remove(file);
        });
      }

      //Setting the message to notify the user
      let message_notify = isAccepted
        ? `## ✅ Perfil verificado \n ### Su perfil ha sido verificado, ahora en su tarjeta de perfil aparecerá un ícono que demostrará que usted es un proveedor verificado en Servia.`
        : `## ❗ Solicitud de verificación de perfil rechazada \n ### Su solicitud ha sido rechazada ya que no cumple con ciertos requisitos. \n **Mensaje del administrador:** ${description}`;
      let notification;
      try {
        const body = {
          type: 1,
          description: message_notify,
          sender: user_admin.id,
          receiver: id,
          publication: null,
        };

        //Create notification
        notification = await strapi.services.notifications.create(body);
      } catch (error) {
        console.log(error);
      }

      //If the user is online, then we send a real time notification and update the state
      if (currentConnections[id]) {
        updated_user = await strapi.plugins[
          "users-permissions"
        ].services.user.fetch({
          id: id,
        });

        currentConnections[id].socket.emit(
          "updateUserData",
          JSON.stringify(updated_user)
        );

        currentConnections[id].socket.emit(
          "push_notification",
          JSON.stringify(notification)
        );
      }
    }
  });
};
