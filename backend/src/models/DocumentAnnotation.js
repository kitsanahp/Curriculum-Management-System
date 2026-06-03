const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DocumentAnnotation = sequelize.define('DocumentAnnotation', {
  id:             { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  document_id:    { type: DataTypes.INTEGER, allowNull: false },
  document_type:  { type: DataTypes.ENUM('document', 'tqf2'), allowNull: false },
  selected_text:  { type: DataTypes.TEXT, allowNull: false },
  context_before: { type: DataTypes.STRING(150), allowNull: true },
  context_after:  { type: DataTypes.STRING(150), allowNull: true },
  comment:        { type: DataTypes.TEXT, allowNull: false },
  color:          { type: DataTypes.ENUM('yellow', 'green', 'blue', 'pink'), defaultValue: 'yellow' },
  author_id:      { type: DataTypes.INTEGER, allowNull: false },
  is_resolved:    { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  tableName: 'document_annotations',
  updatedAt: false,
});

module.exports = DocumentAnnotation;
