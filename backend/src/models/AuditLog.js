const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  curriculum_id: { type: DataTypes.INTEGER, allowNull: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  action: { type: DataTypes.STRING(255), allowNull: false },
  details: { type: DataTypes.JSON, allowNull: true },
  ip_address: { type: DataTypes.STRING(50), allowNull: true },
  user_agent: { type: DataTypes.STRING(512), allowNull: true }
}, {
  tableName: 'audit_logs',
  timestamps: true,
  updatedAt: false,
  indexes: [
    { fields: ['curriculum_id'] },
    { fields: ['user_id'] },
    { fields: ['curriculum_id', 'created_at'] },
    { fields: ['action'] },
  ]
});

module.exports = AuditLog;
