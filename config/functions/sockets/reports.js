module.exports = function (socket, currentConnections) {
  socket.on("reports", async (data) => {
    const {
      id,
      idP_P,
      title,
      isAccepted,
      type,
      action,
      desc,
      jwt,
    } = JSON.parse(data);
    //let res = await strapi.query("publications").find();

    //const [token] = await strapi.query('token').find({token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaWF0IjoxNjE0Njk3MDE4LCJleHAiOjE2MTcyODkwMTh9.ZyXhnPVZ3Iqf3fOh0dzkbOienDdxnNTiUufS1hOIP10"});
    let isValid;
    try {
      isValid = await strapi.plugins["users-permissions"].services.jwt.verify(
        jwt
      );
    } catch (error) {
      return error;
    }

    const user = await strapi.plugins["users-permissions"].services.user.fetch({
      id: isValid.id,
    });

    const [report] = await strapi.services.reports.find({ id });
    let message_notify = "";

    if (user?.role.id === 3 && report) {
      if (isAccepted) {
        if (action) {
          newState = 1;

          message_notify += `## ⛔ Bloqueo de ${
            type ? "perfil" : "publicación"
          } \n ### Su ${
            type ? "perfil" : "publicación " + title
          } ha sido bloqueado/a ya que incumple ciertas reglas. \n **Administrador:** ${desc}`;
        } else {
          newState = 3;

          if (report.state === -1) {
            message_notify += `## ✅ ${
              type ? "Perfil" : "Publicación " + title
            } desbloqueado/a. \n ### Los datos modificados están bien, puede seguir disfrutando de Servia. ${
              desc !== "" ? " **Administrador:** " + desc : ""
            }`;
          } else {
            message_notify += `## ⚠ Sugerencia \n ### Su ${
              type ? "perfil" : "publicación " + title
            } está bien diseñada/o, sin embargo, puede mejorar aun más. \n **Administrador:** ${desc}`;
          }
        }
      } else {
        newState = 2;
      }

      //If the report is rejected, then we don't send notifications
      if (newState === 2) {
        return;
      }

      let blocked = newState === 1;

      //We block or unblock de publication/profile depending on actions
      if (type) {
        await strapi.services["public-user"].update(
          { id: idP_P },
          { blocked: blocked }
        );
      } else {
        await strapi.services.publications.update(
          { id: idP_P },
          { blocked: blocked }
        );
      }

      //Update the report
      await strapi.services.reports.update({ id }, { state: newState });

      //Get the user to notify
      let user_notify = null;
      if (type) {
        user_notify = await strapi.plugins[
          "users-permissions"
        ].services.user.fetch({
          public_user: idP_P,
        });
      } else {
        user_notify = await strapi.plugins[
          "users-permissions"
        ].services.user.fetch({
          "public_user.publications": idP_P,
        });
      }

      //Notifing the user
      if (user_notify) {
        let notification;
        try {
          const body = {
            type: 0,
            description: message_notify,
            sender: user.id,
            receiver: user_notify.id,
            publication: !type ? idP_P : null,
            type: newState,
          };
          notification = await strapi.services.notifications.create(body);
        } catch (error) {
          console.log(error);
        }

        if (currentConnections[user_notify.id])
          currentConnections[user_notify.id].socket.emit(
            "push_notification",
            JSON.stringify(notification)
          );
      }
    }
  });
};
