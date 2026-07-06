const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AnnouncementAttachment = sequelize.define('AnnouncementAttachment', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  announcement_id: { type: DataTypes.INTEGER, allowNull: false },
  original_name: { type: DataTypes.STRING(500), allowNull: false },
  stored_name: { type: DataTypes.STRING(500), allowNull: false },
  file_type: { type: DataTypes.STRING(20), allowNull: true },
  file_size: { type: DataTypes.INTEGER, allowNull: true },
}, {
  tableName: 'announcement_attachments',
  timestamps: true,
  indexes: [
    { fields: ['announcement_id'] },
  ]
});

module.exports = AnnouncementAttachment;
