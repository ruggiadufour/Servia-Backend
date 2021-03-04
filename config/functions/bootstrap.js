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
  });
};

//   module.exports = async () => {
//     process.nextTick(() =>{
//       var io = require('socket.io')(strapi.server);
//       io.on('connection', async function(socket) {

//         console.log(`a user connected`)
//         // send message on user connection
//         socket.emit('hello', JSON.stringify({connection: "succesfully"}))

//         //JSON.stringify({message: await strapi.services.profile.update({"posted_by"})})

//         // listen for user diconnect
//         socket.on('disconnect', () =>{
//           console.log('a user disconnected')
//         })
//       });

//       strapi.io = io; // register socket io inside strapi main object to use it globally anywhere
//     })

//   };
