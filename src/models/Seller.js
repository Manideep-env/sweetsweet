// models/Seller.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../lib/db.js';

export const Seller = sequelize.define('Seller', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },
  password_hash: { // Keep this from your Admin model
    type: DataTypes.STRING,
    allowNull: false,
  },
  storeName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  storeSlug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true, // e.g., "jays-sweet-shop"
  },
}, {
  tableName: 'Sellers', // Changed from 'Admins'
  timestamps: true,
});