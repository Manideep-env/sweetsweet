// src/models/Order.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../lib/db.js';

export const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  customerName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  totalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Confirmed'),
    defaultValue: 'Pending',
  },
  sellerId: { // Tenant Foreign Key
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Sellers',
      key: 'id',
    },
  },
}, {
  tableName: 'Orders',
  timestamps: true,
});