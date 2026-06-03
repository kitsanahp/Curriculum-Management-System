const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING(500), allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  type: {
    type: DataTypes.ENUM('info', 'warning', 'success', 'error'),
    defaultValue: 'info'
  },
  curriculum_id: { type: DataTypes.INTEGER, allowNull: true },
  announcement_id: { type: DataTypes.INTEGER, allowNull: true },
  is_read: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  tableName: 'notifications',
  timestamps: true,
  updatedAt: false,
  indexes: [
    { fields: ['user_id', 'is_read'] },
    { fields: ['curriculum_id'] },
  ]
});

module.exports = Notification;
