const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TQF2Document = sequelize.define('TQF2Document', {
  id:              { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  curriculum_id:   { type: DataTypes.INTEGER, allowNull: false },
  version_number:  { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  stored_name:     { type: DataTypes.STRING(500), allowNull: false },
  original_name:   { type: DataTypes.STRING(500), allowNull: false },
  file_type:       { type: DataTypes.ENUM('pdf', 'docx'), allowNull: false },
  file_size:       { type: DataTypes.INTEGER, allowNull: true },
  uploaded_by:     { type: DataTypes.INTEGER, allowNull: false },
  note:            { type: DataTypes.TEXT, allowNull: true },
  academic_year:   { type: DataTypes.STRING(10), allowNull: true },
  is_deleted:      { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  tableName: 'tqf2_documents',
  updatedAt: false,
  indexes: [
    { fields: ['curriculum_id', 'is_deleted'] },
    { fields: ['curriculum_id', 'version_number'] },
    { fields: ['academic_year'] },
    { fields: ['curriculum_id', 'academic_year'] },
  ]
});

module.exports = TQF2Document;
