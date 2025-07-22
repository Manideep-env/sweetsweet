// models/OrderDiscount.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../lib/db.js';

export const OrderDiscount = sequelize.define('OrderDiscount', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  discountId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'OrderDiscount',
  timestamps: true,
});
