const { VChat_RoomIDs } = require("../model/roomIDs");

exports.CreateRoom = async (roomID) => {
  const room = await VChat_RoomIDs.findOne({ roomID });
  if (!room) {
    const response = await VChat_RoomIDs.create({ roomID, users: [] });
  }
};
exports.RemoveUser = async (roomID, userID) => {
  const currentRoom = await VChat_RoomIDs.findOne({
    roomID,
  });
  const userLength = currentRoom.users.length;
  if (userLength == 1) {
    const response = await VChat_RoomIDs.findByIdAndDelete(currentRoom._id);
  } else {
    const filteredUser = currentRoom.users.filter((i) => i.userID !== userID);
    const response = await VChat_RoomIDs.findByIdAndUpdate(currentRoom._id, {
      roomID: currentRoom.roomID,
      users: filteredUser,
    });
  }
};
exports.AddUser = async (roomID, data) => {
  const currentRoom = await VChat_RoomIDs.findOne({
    roomID,
  });
  if (currentRoom) {
    const userFound = currentRoom.users.some((i) => i.userID == data.userID);
    if (currentRoom && !userFound) {
      currentRoom.users.push(data);
      const updatedUsers = currentRoom.users;
      const addedUser = await VChat_RoomIDs.findByIdAndUpdate(currentRoom._id, {
        roomID: currentRoom.roomID,
        users: updatedUsers,
      });
    }
  }
};
exports.GetOtherUsers = async (roomID, userID) => {
  const currentRoom = await VChat_RoomIDs.findOne({
    roomID,
  });
  const filteredUser = currentRoom.users.filter((i) => i.userID !== userID);
  return filteredUser;
};
exports.GetUser = async (roomID, userID) => {
  const currentRoom = await VChat_RoomIDs.findOne({
    roomID,
  });
  const filteredUser = currentRoom.users.find((i) => i.userID == userID);

  return filteredUser;
};
exports.GetRoomID = async (userID) => {
  const rooms = await VChat_RoomIDs.find({});
  for (let i = 0; i < rooms.length; i++) {
    const room = rooms[i];
    if (room.length !== 0) {
      const userFound = room.users.some((user) => user.userID == userID);
      if (userFound) {
        return room.roomID;
      }
    }
  }
  return null;
};
