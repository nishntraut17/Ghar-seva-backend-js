import mongoose, { Schema } from "mongoose";

const orderSchema = new Schema({
    status: { type: String, default: 'user requests' },
    groupId: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    serviceProvider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    disableReview: { type: Boolean, default: false },
    fees: { type: Number, default: 0 },
    subServices: [{ type: String }]
});

export default mongoose.model('Order', orderSchema);