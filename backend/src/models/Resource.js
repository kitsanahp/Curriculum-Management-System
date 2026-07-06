const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Resource = sequelize.define('Resource', {
  id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title:       { type: DataTypes.STRING(500), allowNull: false },
  type:        { type: DataTypes.ENUM('file', 'link'), defaultValue: 'file' },
  file_url:    { type: DataTypes.STRING(1000), allowNull: true },
  link_url:    { type: DataTypes.STRING(1000), allowNull: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  category:    { type: DataTypes.STRING(100), allowNull: true },
  created_by:  { type: DataTypes.INTEGER, allowNull: false },
  is_active:   { type: DataTypes.BOOLEAN, defaultValue: true },
  is_pinned:   { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  tableName: 'resources',
  timestamps: true,
  indexes: [
    { fields: ['is_active', 'created_at'] },
    { fields: ['created_by'] }
  ]
});

module.exports = Resource;
