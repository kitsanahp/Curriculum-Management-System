const { Op } = require('sequelize');
const { User } = require('../models');

/**
 * รวบรวม email ของทีมหลักสูตรจาก 2 แหล่ง:
 * 1. email ที่เก็บไว้ใน CurriculumTeam โดยตรง
 * 2. lookup จาก User table ด้วยชื่อ (สำหรับ member ที่ไม่มี email บันทึกไว้)
 *
 * @param {Array} team - array ของ CurriculumTeam instances
 * @param {string[]} [extra=[]] - email เพิ่มเติม (เช่น admin ผู้สร้าง)
 * @returns {Promise<string[]>} unique email array พร้อมส่ง
 */
async function resolveTeamEmails(team = [], extra = []) {
  const stored = team.filter(m => m.email).map(m => m.email);
  const namesToLookup = team.filter(m => !m.email && m.name).map(m => m.name);

  let lookedUp = [];
  if (namesToLookup.length > 0) {
    const found = await User.findAll({
      where: { name: { [Op.in]: namesToLookup }, is_active: true },
      attributes: ['email'],
    });
    lookedUp = found.filter(u => u.email).map(u => u.email);
  }

  return [...new Set([...extra, ...stored, ...lookedUp])];
}

/**
 * Resolve user IDs for in-app notifications from team members.
 * Matches by email (primary) then by name (fallback).
 * @param {Array} team - CurriculumTeam instances
 * @param {number[]} [extra=[]] - additional user IDs to include (e.g. creator)
 * @returns {Promise<number[]>} unique user_id array
 */
async function resolveTeamUserIds(team = [], extra = []) {
  const emails = team.map(m => m.email).filter(Boolean);
  const names  = team.filter(m => !m.email && m.name).map(m => m.name);

  const conditions = [];
  if (emails.length) conditions.push({ email: { [Op.in]: emails } });
  if (names.length)  conditions.push({ name:  { [Op.in]: names  } });

  if (!conditions.length) return [...new Set(extra)];

  const found = await User.findAll({
    where: { [Op.or]: conditions, is_active: true },
    attributes: ['id'],
  });

  return [...new Set([...extra, ...found.map(u => u.id)])];
}

module.exports = { resolveTeamEmails, resolveTeamUserIds };
