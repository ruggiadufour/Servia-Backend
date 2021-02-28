module.exports = function (socket) {
    socket.emit("hello", JSON.stringify({ connection: "succesfully" }));
};
