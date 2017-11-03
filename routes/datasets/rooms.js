var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const RoomSchema = new Schema({
    name: String,
    description: String,
    items: [{item: String, weight: Number}],
    color: String,
    doors: [{door: String}]
});

const Room = mongoose.model('Room', RoomSchema);

module.exports = Room;