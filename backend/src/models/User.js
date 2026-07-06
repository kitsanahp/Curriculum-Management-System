const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');
const { ROLES } = require('../config/constants');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(255), allowNull: false },
  phone: { type: DataTypes.STRING(20), allowNull: true },
  position: { type: DataTypes.STRING(100), allowNull: true },
  academic_position: { type: DataTypes.STRING(100), allowNull: true },
  email: { type: DataTypes.STRING(255), allowNull: false, unique: true, validate: { isEmail: true } },
  password: { type: DataTypes.STRING(255), allowNull: false },
  role: {
    type: DataTypes.ENUM(...Object.values(ROLES)),
    allowNull: false
  },
  department_id: { type: DataTypes.INTEGER, allowNull: true },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  failed_login_count: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false },
  locked_until: { type: DataTypes.DATE, allowNull: true },
  // ใช้เพิกถอน JWT แบบ stateless: token ฝัง tv ไว้ — ถ้า tv ใน token ≠ ค่านี้ใน DB = token ตาย
  // เพิ่มค่าเมื่อ logout / เปลี่ยนรหัส / reset → token เก่าทุกใบใช้ไม่ได้ทันที
  token_version: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false }
}, {
  tableName: 'users',
  indexes: [
    { fields: ['is_active', 'role'] },
    { fields: ['department_id'] }
  ],
  hooks: {
    beforeCreate: async (user) => {
      user.password = await bcrypt.hash(user.password, 10);
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    }
  }
});

User.prototype.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

User.prototype.toJSON = function () {
  const values = Object.assign({}, this.get());
  delete values.password;
  return values;
};

module.exports = User;
