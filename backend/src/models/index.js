const sequelize = require('../config/database');
const User = require('./User');
const Department = require('./Department');
const Curriculum = require('./Curriculum');
const CurriculumTeam = require('./CurriculumTeam');
const Document = require('./Document');
const DocumentVersion = require('./DocumentVersion');
const TQF2Document = require('./TQF2Document');
const DocumentAnnotation = require('./DocumentAnnotation');
const CommitteeStep = require('./CommitteeStep');
const CommitteeDocument = require('./CommitteeDocument');
const AuditLog = require('./AuditLog');
const Announcement = require('./Announcement');
const AnnouncementAttachment = require('./AnnouncementAttachment');
const Notification = require('./Notification');
const Resource = require('./Resource');
const CalendarEvent = require('./CalendarEvent');
const DegreeTitle = require('./DegreeTitle');
const Major = require('./Major');

// Department <-> User
Department.hasMany(User, { foreignKey: 'department_id', as: 'users' });
User.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });

// Department <-> Major (สาขาวิชาในภาควิชา แยกระดับปริญญา)
Department.hasMany(Major, { foreignKey: 'department_id', as: 'majors' });
Major.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });

// Department <-> Curriculum
Department.hasMany(Curriculum, { foreignKey: 'department_id', as: 'curricula' });
Curriculum.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });

// User (creator) <-> Curriculum
User.hasMany(Curriculum, { foreignKey: 'created_by', as: 'created_curricula' });
Curriculum.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Curriculum <-> CurriculumTeam
Curriculum.hasMany(CurriculumTeam, { foreignKey: 'curriculum_id', as: 'team' });
CurriculumTeam.belongsTo(Curriculum, { foreignKey: 'curriculum_id', as: 'curriculum' });

// Curriculum <-> Document
Curriculum.hasMany(Document, { foreignKey: 'curriculum_id', as: 'documents' });
Document.belongsTo(Curriculum, { foreignKey: 'curriculum_id', as: 'curriculum' });

// User (uploader) <-> Document
User.hasMany(Document, { foreignKey: 'uploaded_by', as: 'uploaded_documents' });
Document.belongsTo(User, { foreignKey: 'uploaded_by', as: 'uploader' });

// Document <-> DocumentVersion
Document.hasMany(DocumentVersion, { foreignKey: 'document_id', as: 'versions' });
DocumentVersion.belongsTo(Document, { foreignKey: 'document_id', as: 'document' });

// User (uploader) <-> DocumentVersion
User.hasMany(DocumentVersion, { foreignKey: 'uploaded_by', as: 'uploaded_versions' });
DocumentVersion.belongsTo(User, { foreignKey: 'uploaded_by', as: 'uploader' });

// Curriculum <-> TQF2Document
Curriculum.hasMany(TQF2Document, { foreignKey: 'curriculum_id', as: 'tqf2_documents' });
TQF2Document.belongsTo(Curriculum, { foreignKey: 'curriculum_id', as: 'curriculum' });

// User (uploader) <-> TQF2Document
User.hasMany(TQF2Document, { foreignKey: 'uploaded_by', as: 'uploaded_tqf2' });
TQF2Document.belongsTo(User, { foreignKey: 'uploaded_by', as: 'uploader' });

// User (author) <-> DocumentAnnotation
User.hasMany(DocumentAnnotation, { foreignKey: 'author_id', as: 'annotations' });
DocumentAnnotation.belongsTo(User, { foreignKey: 'author_id', as: 'author' });

// Curriculum <-> CommitteeStep
Curriculum.hasMany(CommitteeStep, { foreignKey: 'curriculum_id', as: 'committee_steps' });
CommitteeStep.belongsTo(Curriculum, { foreignKey: 'curriculum_id', as: 'curriculum' });

// CommitteeStep <-> CommitteeDocument
CommitteeStep.hasMany(CommitteeDocument, { foreignKey: 'committee_step_id', as: 'documents' });
CommitteeDocument.belongsTo(CommitteeStep, { foreignKey: 'committee_step_id', as: 'step' });

// CommitteeDocument -> Document (workspace link)
CommitteeDocument.belongsTo(Document, { foreignKey: 'document_id', as: 'source_document' });

// User <-> AuditLog
User.hasMany(AuditLog, { foreignKey: 'user_id', as: 'audit_logs' });
AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User <-> Notification
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User (creator) <-> Announcement
User.hasMany(Announcement, { foreignKey: 'created_by', as: 'announcements' });
Announcement.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Announcement <-> AnnouncementAttachment
Announcement.hasMany(AnnouncementAttachment, { foreignKey: 'announcement_id', as: 'attachments' });
AnnouncementAttachment.belongsTo(Announcement, { foreignKey: 'announcement_id', as: 'announcement' });

// User (creator) <-> Resource
User.hasMany(Resource, { foreignKey: 'created_by', as: 'resources' });
Resource.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// User <-> CalendarEvent
User.hasMany(CalendarEvent, { foreignKey: 'user_id', as: 'calendar_events' });
CalendarEvent.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
  sequelize,
  User,
  Department,
  Curriculum,
  CurriculumTeam,
  Document,
  DocumentVersion,
  TQF2Document,
  DocumentAnnotation,
  CommitteeStep,
  CommitteeDocument,
  AuditLog,
  Announcement,
  AnnouncementAttachment,
  Notification,
  Resource,
  CalendarEvent,
  DegreeTitle,
  Major
};
