import mongoose, { Schema } from "mongoose";

const serviceSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String },
    image: { type: String },
    subServices: [{ type: String }],
    serviceProviders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
})

export default mongoose.model('Service', serviceSchema);