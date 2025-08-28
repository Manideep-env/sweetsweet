// models/Discount.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../lib/db.js';

export const Discount = sequelize.define('Discount', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Products',
      key: 'id',
    },
  },
  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Categories',
      key: 'id',
    },
  },
  sellerId: { // Tenant Foreign Key
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Sellers',
      key: 'id',
    },
  },
  percentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
}, {
  tableName: 'Discounts',
  timestamps: true,
});