// models/OrderItem.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../lib/db.js';

export const OrderItem = sequelize.define('OrderItem', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Orders', key: 'id' },
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Products', key: 'id' },
  },
  weight: {
    type: DataTypes.DECIMAL(4, 1),
    allowNull: true,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  pricePerKg: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  pricePerUnit: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  totalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
}, {
  tableName: 'OrderItems',
  timestamps: true,
});
