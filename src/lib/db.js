// db.js
import { Sequelize } from 'sequelize';
import mysql2 from 'mysql2'; // 👈 add this line

export const sequelize = new Sequelize(
  process.env.DB_NAME || 'sweetshop',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    dialectModule: mysql2, // 👈 force usage of mysql2 explicitly
  }
);