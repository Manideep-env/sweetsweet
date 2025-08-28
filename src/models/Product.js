// src/models/Product.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../lib/db.js';

export const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
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
  pricePerKg: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  pricePerUnit: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  unitLabel: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  isAvailable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'Products',
  timestamps: true,
});