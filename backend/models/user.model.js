import mongoose from "mongoose";

const Schema = mongoose.Schema;

const userSchema = new Schema({
  
  email: {type: String,
    required: true,
    unique: true,
    trim: true,
    validate: {
      validator: function (value) {
        // Custom validation logic
        return value.endsWith('iitdh.ac.in');
      },
      message: 'Email must have the suffix "iitdh.ac.in"',
        },
    },
  password: {type: String, required: false},
  name: { type: String, required: false },
  role: {type: String, default: "club-secretary",enum: ["club-secretary", "general-secretary", "treasurer", "president", "faculty-in-charge", "associate-dean"]},
  eventApproval: {type: String, default: "",required: false},
  category: {type: String, default: "",required: false},
  phnumber: {type: String, default: "", required:false},
  image: {type: String, required: false},
}, 
);

const User = mongoose.model('User', userSchema);
export default User;