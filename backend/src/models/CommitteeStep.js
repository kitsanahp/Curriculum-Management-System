const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { COMMITTEE_TYPES, COMMITTEE_STATUS } = require('../config/constants');

const CommitteeStep = sequelize.define('CommitteeStep', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  curriculum_id: { type: DataTypes.INTEGER, allowNull: false },
  committee_type: {
    type: DataTypes.ENUM(...Object.values(COMMITTEE_TYPES)),
    allowNull: false
  },
  step_order: { type: DataTypes.INTEGER, allowNull: false },
  status: {
    type: DataTypes.ENUM(...Object.values(COMMITTEE_STATUS)),
    allowNull: false,
    defaultValue: COMMITTEE_STATUS.PENDING
  },
  decision_date: { type: DataTypes.DATEONLY, allowNull: true },
  meeting_number: { type: DataTypes.STRING(100), allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true },
  uploaded_by: { type: DataTypes.INTEGER, allowNull: true }
}, {
  tableName: 'committee_steps',
  timestamps: true,
  indexes: [
    { fields: ['curriculum_id'] },
    { unique: true, fields: ['curriculum_id', 'step_order'] },
  ]
});

module.exports = CommitteeStep;
