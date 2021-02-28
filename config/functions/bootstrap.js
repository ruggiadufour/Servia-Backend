"use strict";
module.exports = () => {
  // let io = require("socket.io")(strapi.server, {
  //   cors: {
  //     origin: "http://localhost:3000",
  //     methods: ["GET", "POST"],
  //     allowedHeaders: ["my-custom-header"],
  //     credentials: true,
  //   },
  // });

  // io.on("connection", function (socket) {
  //   //console.log("user connected");

  //   require("./socket_connection")(socket)
  // });

  
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
