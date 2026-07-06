const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// สาขาวิชาในภาควิชา (master data) — แยกตามระดับปริญญา ใช้เป็นตัวเลือกตอนสร้างหลักสูตร
const Major = sequelize.define('Major', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  department_id: { type: DataTypes.INTEGER, allowNull: false },
  degree_level: {
    type: DataTypes.ENUM('bachelor', 'master', 'doctoral'),
    allowNull: false
  },
  name: { type: DataTypes.STRING(255), allowNull: false }   // เช่น คณิตศาสตร์, สถิติ
}, {
  tableName: 'majors',
  timestamps: true
});

module.exports = Major;
