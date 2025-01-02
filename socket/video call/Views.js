const {
    handleConnection,
    handleDisconnection,
    handleRoomJoin,
    handleRoomLeave,
    handleSendMessage
} = require('./Controllers');

module.exports = (io) => {
    io.on('connection', (socket) => {
        handleConnection(socket);

        socket.on('disconnect', async () => {
            handleDisconnection(socket);
        });

        socket.on('sending_signal', (data) => {
            io.to(data.socket_id).emit('user_joined_signal', {
                username: data.username,
                signal: data.signal,
                new_user_socket_id: data.new_user_socket_id
            });
        });

        socket.on("returning_signal", data => {
            io.to(data.new_user_socket_id).emit('receiving_returned_signal', {
                username: data.new_user_name,
                signal: data.signal,
                socket_id: socket.id
            });
        });

        // Handle room joining
        socket.on('join_room', (data, callback) => {
            handleRoomJoin(io, socket, data, callback);
        });

        socket.on('leave_room', (data, callback) => {
            handleRoomLeave(io, socket, data, callback);
        });

        socket.on('send_message', (data, callback) => {
            handleSendMessage(io, socket, data, callback);
        });
    });
};