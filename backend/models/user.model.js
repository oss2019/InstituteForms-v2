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
  password: {type: String, required: true},
  name: { type: String, required: false },
  rollNumber: { type: String, required: false },
  role: {type: String, default: "student",enum: ["student", "warden","security"]},
  phnumber: {type:String, default: "", required:false},
  leaveApplication: {type: String, default: "",required: false},
  outingRequest: {type: String, default: "",required: false},
  hostel: {type: String, default: "", required:false},
  roomNumber: {type: String, required: false},
  branch: {type: String, required: false},
  year: {type: String, required: false},
  course: {type: String, required: false}
}, 
);

const User = mongoose.model('User', userSchema);
export default User;