const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { TEAM_ROLES } = require('../config/constants');

const CurriculumTeam = sequelize.define('CurriculumTeam', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  curriculum_id: { type: DataTypes.INTEGER, allowNull: false },
  user_id: { type: DataTypes.INTEGER, allowNull: true },  // FK ไปยัง users.id (ถ้าเลือกจากระบบ)
  name: { type: DataTypes.STRING(255), allowNull: false },
  position: { type: DataTypes.STRING(255), allowNull: true },
  role_in_curriculum: {
    type: DataTypes.ENUM(...Object.values(TEAM_ROLES)),
    allowNull: false
  },
  email: { type: DataTypes.STRING(255), allowNull: true, validate: { isEmail: true } },
  phone: { type: DataTypes.STRING(50), allowNull: true }
}, {
  tableName: 'curriculum_team',
  timestamps: true,
  indexes: [
    { fields: ['curriculum_id'] },
    { fields: ['user_id'] },
  ]
});

module.exports = CurriculumTeam;
