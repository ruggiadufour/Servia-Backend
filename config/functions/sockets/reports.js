module.exports = function (socket) {
  socket.on("reports", async (data) => {
    const { id, idP_P, isAccepted, type, action, desc, jwt } = JSON.parse(data);
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

    if (user?.role.id === 3 && report) {
      console.log("26");
      let newState = 1;

      if (isAccepted) {
        if (action) {
          newState = 1;
        } else {
          newState = 3;
        }
      } else {
        newState = 2;
      }

      if (type && (newState === 2 || newState === 3)) {
        await strapi.services["public-user"].update(
          { id: idP_P },
          { blocked: false }
        );
      }
      if (!type && (newState === 2 || newState === 3)) {
        await strapi.services.publications.update(
          { id: idP_P },
          { blocked: false }
        );
      }

      await strapi.services.reports.update(
        { id },
        { state: newState }
      );

      const allReports = await strapi.services.reports.find()

      socket.emit("updated_report", JSON.stringify(allReports));
    }
  });
};
