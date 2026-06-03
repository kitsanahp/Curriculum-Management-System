const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { DEGREE_LEVELS, CURRICULUM_TYPES, CURRICULUM_STATUS } = require('../config/constants');

const Curriculum = sequelize.define('Curriculum', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  department_id: { type: DataTypes.INTEGER, allowNull: false },
  degree_level: {
    type: DataTypes.ENUM(...Object.values(DEGREE_LEVELS)),
    allowNull: false
  },
  curriculum_type: {
    type: DataTypes.ENUM(...Object.values(CURRICULUM_TYPES)),
    allowNull: false
  },
  curriculum_year: { type: DataTypes.STRING(10), allowNull: false },
  degree_name: { type: DataTypes.STRING(255), allowNull: true },
  degree_name_abbr: { type: DataTypes.STRING(100), allowNull: true },
  field_of_study: { type: DataTypes.STRING(255), allowNull: true },
  status: {
    type: DataTypes.ENUM(...Object.values(CURRICULUM_STATUS)),
    allowNull: false,
    defaultValue: CURRICULUM_STATUS.PENDING_DEPARTMENT
  },
  status_changed_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  current_committee_step_id: { type: DataTypes.INTEGER, allowNull: true },
  deadline: { type: DataTypes.DATEONLY, allowNull: true },
  revision_deadline: { type: DataTypes.DATEONLY, allowNull: true },
  is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  parent_curriculum_id: { type: DataTypes.INTEGER, allowNull: true },
  created_by: { type: DataTypes.INTEGER, allowNull: false }
}, {
  tableName: 'curricula',
  timestamps: true,
  paranoid: true,
  deletedAt: 'deleted_at',
  hooks: {
    beforeSave: (curriculum, options) => {
      if (curriculum.changed('status')) {
        curriculum.status_changed_at = new Date();
      }
    }
  },
  indexes: [
    { fields: ['department_id'] },
    { fields: ['status'] },
    { fields: ['created_by'] },
    { fields: ['current_committee_step_id'] },
    { fields: ['is_active'] },
    { fields: ['curriculum_year', 'is_active'] },
  ]
});

// Virtual field for Aging Analysis (SLA)
Curriculum.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  const start = new Date(values.status_changed_at || values.updatedAt);
  const now = new Date();
  const diffTime = Math.abs(now - start);
  // Calculate days difference
  values.days_in_status = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  return values;
};

module.exports = Curriculum;
