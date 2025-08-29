// src/models/StoreCustomization.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../lib/db.js';

export const StoreCustomization = sequelize.define('StoreCustomization', {
  sellerId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
    references: {
      model: 'Sellers',
      key: 'id',
    },
  },
  primaryColor: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '#4F46E5', // A default modern purple
  },
  backgroundColor: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '#F9FAFB', // A default light gray
  },
  bannerImageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'StoreCustomizations',
  timestamps: true,
});
