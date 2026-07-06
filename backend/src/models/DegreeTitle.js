const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// ชื่อวุฒิ/ชื่อปริญญา (master data) — ใช้เป็นตัวเลือกตอนสร้าง/แก้ไขหลักสูตร
const DegreeTitle = sequelize.define('DegreeTitle', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  degree_level: {
    type: DataTypes.ENUM('bachelor', 'master', 'doctoral'),
    allowNull: false
  },
  name: { type: DataTypes.STRING(255), allowNull: false },   // เช่น วิทยาศาสตรบัณฑิต
  abbr: { type: DataTypes.STRING(50), allowNull: true }      // เช่น วท.บ.
}, {
  tableName: 'degree_titles',
  timestamps: true
});

module.exports = DegreeTitle;
