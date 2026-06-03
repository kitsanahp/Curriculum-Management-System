const { Op } = require('sequelize');
const {
  sequelize, Curriculum, Department,
  CurriculumTeam, CommitteeStep,
} = require('../models');
const { ROLES } = require('../config/constants');

exports.getSummary = async (req, res, next) => {
  try {
    const { role, department_id, email } = req.user;

    const where = {};
    const extraInclude = [];

    // Role-based data scope — done entirely at backend
    if (role === ROLES.FACULTY || role === ROLES.STAFF) {
      extraInclude.push({
        model: CurriculumTeam,
        as: 'team',
        attributes: [],
        required: false,
      });
      where[Op.or] = [
        { department_id },
        sequelize.where(sequelize.col('team.email'), email),
      ];
    }
    // ADMIN / EXECUTIVE: no filter → see everything

    const rows = await Curriculum.findAll({
      where,
      include: [
        { model: Department, as: 'department', attributes: ['id', 'name', 'code'] },
        ...extraInclude,
        {
          model: CommitteeStep,
          as: 'committee_steps',
          attributes: ['id', 'committee_type', 'step_order', 'status'],
        },
      ],
      order: [['updated_at', 'DESC']],
      distinct: true,
      subQuery: false,
    });

    // Stats computed from the SAME rows as the list — always in sync
    const stats = {
      total:         rows.length,
      approved:      rows.filter(c => c.status === 'approved').length,
      pending:       rows.filter(c => c.status === 'pending_department').length,
      in_committee:  rows.filter(c => c.status === 'under_committee').length,
      need_revision: rows.filter(c => c.status === 'revision').length,
      needs_action:  rows.filter(c =>
        ['department_submitted', 'pending_admin_recheck'].includes(c.status)
      ).length,
      approval_rate: rows.length
        ? Math.round((rows.filter(c => c.status === 'approved').length / rows.length) * 100)
        : 0,
    };

    res.json({
      success: true,
      data: {
        stats,
        curricula: rows,
      },
    });
  } catch (err) { next(err); }
};
