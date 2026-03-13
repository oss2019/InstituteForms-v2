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
  role: {type: String, default: "club-secretary",enum: ["student", "club-secretary", "general-secretary", "treasurer", "president", "vice-president", "ARSW", "associate-dean", "dean", "mess-secretary", "canteen-secretary", "fic-mess-canteen", "gen-sec-hostel", "hostel-manager", "warden", "adean-hostel", "transit-facility", "sw-office"]},
  type: {
    type: String,
    enum: ["Technical", "Cultural", "Sports"],
    required: function () {
      return this.role === "club-secretary";
    },
    default: undefined
  },
  eventApproval: {type: String, default: "",required: false},
  category: {type: String, default: "",required: false},
  phnumber: {type: String, default: "", required:false},
  image: {type: String, required: false},
}, 
);

const User = mongoose.model('User', userSchema);
export default User;