const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CommitteeDocument = sequelize.define('CommitteeDocument', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  committee_step_id: { type: DataTypes.INTEGER, allowNull: false },
  original_name: { type: DataTypes.STRING(500), allowNull: false },
  stored_name: { type: DataTypes.STRING(500), allowNull: false },
  uploaded_by: { type: DataTypes.INTEGER, allowNull: false },
  source_type: { type: DataTypes.ENUM('upload', 'workspace'), allowNull: false, defaultValue: 'upload' },
  document_id: { type: DataTypes.INTEGER, allowNull: true },
  round: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 }
}, {
  tableName: 'committee_documents',
  timestamps: true,
  indexes: [
    { fields: ['committee_step_id'] },
    { fields: ['document_id'] },
  ]
});

module.exports = CommitteeDocument;
