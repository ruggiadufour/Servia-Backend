"use strict";
module.exports = () => {
  let io = require("socket.io")(strapi.server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
      allowedHeaders: ["my-custom-header"],
      credentials: true,
    },
  });

  var currentConnections = {};
  io.on("connection", function (socket) {
    console.log("user connected", io.engine.clientsCount);

    socket.on("setUser", (data) => {
      const parsed_data = JSON.parse(data);

      currentConnections[parsed_data.id] = { socket: socket };
      currentConnections[parsed_data.id].data = parsed_data;
    });

    socket.on("disconnect", () => {
      console.log("disconnected");
      Object.keys(currentConnections).map((value) => {
        if(currentConnections[value].socket===socket){
          delete currentConnections[value];
        }
      });
    });

    require("./sockets/reports")(socket, currentConnections);
    require("./sockets/verift-id")(socket, currentConnections);
    require("./sockets/contact")(socket, currentConnections);
  });
};