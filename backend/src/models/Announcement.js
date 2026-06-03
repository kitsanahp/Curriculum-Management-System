const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Announcement = sequelize.define('Announcement', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING(500), allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: false },
  image_url: { type: DataTypes.STRING(1000), allowNull: true },
  link_url: { type: DataTypes.STRING(1000), allowNull: true },
  created_by: { type: DataTypes.INTEGER, allowNull: false },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
  tableName: 'announcements',
  timestamps: true,
  indexes: [
    { fields: ['is_active', 'created_at'] },
    { fields: ['created_by'] }
  ]
});

module.exports = Announcement;
