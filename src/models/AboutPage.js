// src/models/AboutPage.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../lib/db.js';

export const AboutPage = sequelize.define('AboutPage', {
  sellerId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
    references: {
      model: 'Sellers',
      key: 'id',
    },
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'About Our Store',
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'AboutPages',
  timestamps: true,
});
