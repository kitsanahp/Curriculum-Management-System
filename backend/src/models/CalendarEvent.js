const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CalendarEvent = sequelize.define('CalendarEvent', {
  id:         { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id:    { type: DataTypes.INTEGER, allowNull: false },
  title:      { type: DataTypes.STRING(255), allowNull: false },
  event_date: { type: DataTypes.DATEONLY, allowNull: false },
  event_time: { type: DataTypes.STRING(5), allowNull: true },
  color:      { type: DataTypes.STRING(20), defaultValue: 'blue' }
}, {
  tableName: 'calendar_events',
  timestamps: true,
  updatedAt: false
});

module.exports = CalendarEvent;
