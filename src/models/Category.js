// src/models/Category.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../lib/db.js';

export const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false, // Note: unique constraint removed to allow different sellers to have same category name
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true,
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
  tableName: 'Categories',
  timestamps: true,
});