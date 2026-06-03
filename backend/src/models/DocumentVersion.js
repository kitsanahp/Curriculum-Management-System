const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DocumentVersion = sequelize.define('DocumentVersion', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  document_id: { type: DataTypes.INTEGER, allowNull: false },
  version_number: { type: DataTypes.INTEGER, allowNull: false },
  stored_name: { type: DataTypes.STRING(500), allowNull: false },
  original_name: { type: DataTypes.STRING(500), allowNull: false },
  file_size: { type: DataTypes.INTEGER, allowNull: true },
  uploaded_by: { type: DataTypes.INTEGER, allowNull: false },
  note: { type: DataTypes.TEXT, allowNull: true }
}, {
  tableName: 'document_versions',
  timestamps: true,
  updatedAt: false,
  indexes: [
    { fields: ['document_id'] },
    { unique: true, fields: ['document_id', 'version_number'] },
  ]
});

module.exports = DocumentVersion;
