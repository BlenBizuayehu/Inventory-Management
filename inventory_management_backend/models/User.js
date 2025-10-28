// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  profileImage: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['owner', 'admin', 'staff'],
    default: 'staff'
  },
  showInTeam: {
    type: Boolean,
    default: true
  },
  permissions: {
    inventoryManagement: {
      view: Boolean,
      edit: Boolean,
      delete: Boolean
    },
    priceManagement: {
      view: Boolean,
      edit: Boolean
    },
    settings: {
      view: Boolean,
      edit: Boolean
    },
    suppliers: {
      view: Boolean,
      add: Boolean,
      edit: Boolean,
      delete: Boolean
    },
    purchases: {
      view: Boolean,
      create: Boolean,
      edit: Boolean,
      delete: Boolean
    },
    sales: {
      view: Boolean,
      create: Boolean,
      edit: Boolean,
      delete: Boolean
    },
    userManagement: {
      view: Boolean,
      editSelf: Boolean,
      editOthers: Boolean,
      deleteSelf: Boolean,
      deleteOthers: Boolean
    },
    categories: {
      view: Boolean,
      add: Boolean,
      edit: Boolean,
      delete: Boolean
    },
    products: {
      view: Boolean,
      add: Boolean,
      edit: Boolean,
      delete: Boolean
    },
    shops: {
      view: Boolean,
      add: Boolean,
      edit: Boolean,
      delete: Boolean
    },
    transfers: {
      view: Boolean,
      create: Boolean,
      edit: Boolean,
      delete: Boolean
    },
    reports: {
      view: Boolean,
      generate: Boolean,
      export: Boolean
    }
  },
  lastLogin: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Password hashing middleware
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

module.exports = mongoose.model('User', UserSchema);