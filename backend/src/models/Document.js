const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Document = sequelize.define('Document', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  curriculum_id: { type: DataTypes.INTEGER, allowNull: false },
  original_name: { type: DataTypes.STRING(500), allowNull: false },
  stored_name: { type: DataTypes.STRING(500), allowNull: false },
  file_type: { type: DataTypes.ENUM('pdf', 'docx'), allowNull: false },
  file_size: { type: DataTypes.INTEGER, allowNull: true },
  uploaded_by: { type: DataTypes.INTEGER, allowNull: false },
  document_type: { type: DataTypes.ENUM('tqf2', 'reference'), allowNull: false, defaultValue: 'reference' },
  is_deleted: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  tableName: 'documents',
  timestamps: true,
  indexes: [
    { fields: ['curriculum_id', 'is_deleted'] },
    { fields: ['curriculum_id', 'original_name'] },
    { fields: ['uploaded_by'] },
  ]
});

module.exports = Document;
