module.exports = function (socket, currentConnections) {
  socket.on("read-messages", async (data) => {
    const { id, who } = JSON.parse(data);

    let param = {};
    if (who) {
      param["noread_sender"] = 0;
      console.log(true);
    } else {
      param["noread_receiver"] = 0;
      console.log(false);
    }
    await strapi.services.chats.update({ id: id }, param);
  });
  socket.on("send-message", async (data) => {
    const { chat_id, sender_id, receiver_id, content, jwt } = JSON.parse(data);
    //Validate jwt
    let isValid;
    try {
      isValid = await strapi.plugins["users-permissions"].services.jwt.verify(
        jwt
      );
    } catch (error) {
      return error;
    }

    if (isValid.id === sender_id) {
      const new_message = await strapi.services.message.create({
        content: content,
        chat: chat_id,
        sent_by: sender_id,
      });
      const this_chat = await strapi.services.chats.findOne({ id: chat_id });
      const who_sent = sender_id == this_chat.who_start_it;
      await strapi.services.chats.update(
        { id: chat_id },
        {
          noread_sender: who_sent
            ? this_chat.noread_sender
            : this_chat.noread_sender + 1,
          noread_receiver: !who_sent
            ? this_chat.noread_receiver
            : this_chat.noread_receiver + 1,
        }
      );

      if (currentConnections[sender_id]) {
        currentConnections[sender_id].socket.emit(
          "push_message",
          JSON.stringify(new_message)
        );
      }
      if (currentConnections[receiver_id]) {
        currentConnections[receiver_id].socket.emit(
          "push_message",
          JSON.stringify(new_message)
        );
      }
    }
  });

  socket.on("contact-provider", async (data) => {
    const {
      id_provider_public,
      type,
      message,
      id_sender_private,
      name,
      jwt,
    } = JSON.parse(data);

    //Validate jwt
    let isValid;
    try {
      isValid = await strapi.plugins["users-permissions"].services.jwt.verify(
        jwt
      );
    } catch (error) {
      return error;
    }

    if (isValid.id === id_sender_private) {
      const user_contacting = await strapi.plugins[
        "users-permissions"
      ].services.user.fetch({
        id: isValid.id,
      });

      // let chat_is_created = await strapi.services.chats.findOne({
      //   public_users: [user_contacting.public_user.id, id_provider_public],
      // });

      // let id_chat;
      // if (chat_is_created) {
      //   id_chat = chat_is_created.id;
      //   console.log("Old chat");
      // } else {
      //   const new_chat = await strapi.services.chats.create({
      //     public_users: [id_provider_public, user_contacting.public_user.id],
      //   });

      //   console.log("New chat");
      //   id_chat = new_chat.id;
      // }

      const new_chat = await strapi.services.chats.create({
        public_users: [id_provider_public, user_contacting.public_user.id],
        who_start_it: Number(user_contacting.public_user.id),
        type: type,
      });
      console.log(new_chat);

      const new_message = await strapi.services.message.create({
        content: message,
        chat: new_chat.id,
        sent_by: user_contacting.public_user.id,
      });

      new_chat.messages = [new_message];

      //Setting the message to notify the user
      let message_notify = `## ✉ Nuevo mensaje \n ### Tiene un nuevo mensaje de ${name}.`;
      const user_to_notify = await strapi.plugins[
        "users-permissions"
      ].services.user.fetch({
        public_user: id_provider_public,
      });

      const body = {
        type: 2,
        description: message_notify,
        sender: user_contacting.id,
        receiver: user_to_notify.id,
        publication: null,
      };
      //Create notification
      const notification = await strapi.services.notifications.create(body);

      //If the user is online, then we send a real time notification and update the state
      if (currentConnections[user_to_notify.id]) {
        currentConnections[user_to_notify.id].socket.emit(
          "push_chat",
          JSON.stringify(new_chat)
        );
        currentConnections[user_to_notify.id].socket.emit(
          "push_notification",
          JSON.stringify(notification)
        );
      }

      if (currentConnections[user_contacting.id]) {
        currentConnections[user_contacting.id].socket.emit(
          "push_chat",
          JSON.stringify(new_chat)
        );
        currentConnections[user_contacting.id].socket.emit(
          "received",
          JSON.stringify({
            desc:
              "Su mensaje ha sido enviado. Se ha generado un chat (✉) en donde podrá seguir hablando con el proveedor.",
            type: "success",
          })
        );
      }
    }
  });
};
