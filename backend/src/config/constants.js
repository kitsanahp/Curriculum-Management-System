// ─── สิทธิ์ผู้ใช้งาน ────────────────────────────────────────────────────────
const ROLES = {
  ADMIN:     'admin',      // เจ้าหน้าที่หลักสูตรคณะ
  FACULTY:   'faculty',   // อาจารย์ผู้รับผิดชอบหลักสูตร
  STAFF:     'staff',     // เจ้าหน้าที่สาขาวิชา
  REGISTRAR: 'registrar', // เจ้าหน้าที่กองบริการการศึกษา
  EXECUTIVE: 'executive'  // ผู้บริหารคณะ (view-only)
};

// ─── ระดับปริญญา ────────────────────────────────────────────────────────────
const DEGREE_LEVELS = {
  BACHELOR: 'bachelor',
  MASTER:   'master',
  DOCTORAL: 'doctoral'
};

const DEGREE_LEVEL_LABELS = {
  bachelor: 'ปริญญาตรี',
  master:   'ปริญญาโท',
  doctoral: 'ปริญญาเอก'
};

// ─── ประเภทหลักสูตร ─────────────────────────────────────────────────────────
const CURRICULUM_TYPES = {
  NEW:     'new',
  REVISED: 'revised'
};

const CURRICULUM_TYPE_LABELS = {
  new:     'หลักสูตรใหม่',
  revised: 'หลักสูตรปรับปรุง'
};

// ─── สถานะหลักสูตร ──────────────────────────────────────────────────────────
const CURRICULUM_STATUS = {
  DRAFT:                  'draft',
  PENDING_DEPARTMENT:     'pending_department',     // รอภาควิชาดำเนินการ
  DEPARTMENT_SUBMITTED:   'department_submitted',   // ภาควิชาส่งแล้ว รอตรวจสอบครั้งแรก
  UNDER_COMMITTEE:        'under_committee',        // อยู่ระหว่างพิจารณาคณะกรรมการ
  REVISION:               'revision',               // ส่งกลับแก้ไข (จาก admin หรือคณะกรรมการ)
  PENDING_ADMIN_RECHECK:  'pending_admin_recheck',  // สาขาส่งคืนแล้ว รองานหลักสูตรตรวจสอบก่อนนำเข้าคณะกรรมการ
  APPROVED:               'approved'                // อว. อนุมัติแล้ว
};

const CURRICULUM_STATUS_LABELS = {
  draft:                 'ร่างหลักสูตร',
  pending_department:    'รอภาควิชา/สาขาดำเนินการ',
  department_submitted:  'รองานหลักสูตร คณะวิทยาศาสตร์ตรวจสอบ',
  under_committee:       'อยู่ระหว่างการพิจารณา',
  revision:              'ส่งกลับแก้ไข',
  pending_admin_recheck: 'รองานหลักสูตรตรวจสอบ (หลังแก้ไขตามมติคณะกรรมการ)',
  approved:              'หลักสูตรอนุมัติโดย อว.'
};

// ─── ประเภทคณะกรรมการ 8 ชุด ────────────────────────────────────────────────
const COMMITTEE_TYPES = {
  FACULTY_ACADEMIC:          'faculty_academic',
  FACULTY_BOARD:             'faculty_board',
  GENERAL_EDUCATION:         'general_education',        // เฉพาะปริญญาตรี
  UNIVERSITY_ACADEMIC:       'university_academic',
  GRADUATE_SCHOOL:           'graduate_school',          // เฉพาะโท/เอก
  UNIVERSITY_COUNCIL_ACADEMIC:'university_council_academic',
  UNIVERSITY_COUNCIL:        'university_council',
  CISA:                      'cisa'
};

const COMMITTEE_LABELS = {
  faculty_academic:           'คณะกรรมการวิชาการประจำคณะวิทยาศาสตร์',
  faculty_board:              'คณะกรรมการประจำคณะวิทยาศาสตร์',
  general_education:          'คณะกรรมการตรวจวิชาศึกษาทั่วไป',
  university_academic:        'คณะกรรมการวิชาการ มหาวิทยาลัยนเรศวร',
  graduate_school:            'คณะกรรมการประจำบัณฑิตวิทยาลัย',
  university_council_academic:'คณะกรรมการสภาวิชาการ มหาวิทยาลัยนเรศวร',
  university_council:         'คณะกรรมการสภามหาวิทยาลัย',
  cisa:                       'CISA (Curriculum Information System for Higher Education Accreditation)'
};

const COMMITTEE_LEVELS = {
  faculty_academic:           'ระดับคณะ',
  faculty_board:              'ระดับคณะ',
  general_education:          'ระดับคณะ',
  university_academic:        'ระดับมหาวิทยาลัย',
  graduate_school:            'ระดับมหาวิทยาลัย',
  university_council_academic:'ระดับมหาวิทยาลัย',
  university_council:         'ระดับมหาวิทยาลัย',
  cisa:                       'ระดับอุดมศึกษา'
};

// ─── ลำดับขั้นการพิจารณา แยกตามระดับปริญญา ────────────────────────────────
// ปริญญาตรีมี general_education (ขั้น 3), โท/เอกมี graduate_school แทน
const COMMITTEE_FLOW = {
  bachelor: [
    { type: 'faculty_academic',          order: 1 },
    { type: 'faculty_board',             order: 2 },
    { type: 'general_education',         order: 3 }, // เฉพาะตรี
    { type: 'university_academic',       order: 4 },
    { type: 'university_council_academic',order: 5 },
    { type: 'university_council',        order: 6 },
    { type: 'cisa',                      order: 7 }
  ],
  master: [
    { type: 'faculty_academic',          order: 1 },
    { type: 'faculty_board',             order: 2 },
    { type: 'university_academic',       order: 3 },
    { type: 'graduate_school',           order: 4 }, // เฉพาะโท/เอก
    { type: 'university_council_academic',order: 5 },
    { type: 'university_council',        order: 6 },
    { type: 'cisa',                      order: 7 }
  ],
  doctoral: [
    { type: 'faculty_academic',          order: 1 },
    { type: 'faculty_board',             order: 2 },
    { type: 'university_academic',       order: 3 },
    { type: 'graduate_school',           order: 4 },
    { type: 'university_council_academic',order: 5 },
    { type: 'university_council',        order: 6 },
    { type: 'cisa',                      order: 7 }
  ]
};

// ─── สถานะมติคณะกรรมการ ────────────────────────────────────────────────────
const COMMITTEE_STATUS = {
  PENDING:  'pending',
  APPROVED: 'approved',
  REVISION: 'revision' // มีมติให้แก้ไข
};

// ─── บทบาทในทีมหลักสูตร ────────────────────────────────────────────────────
const TEAM_ROLES = {
  PRESIDENT:   'president',
  SECRETARY:   'secretary',
  RESPONSIBLE: 'responsible'
};

const TEAM_ROLE_LABELS = {
  president:   'ประธานหลักสูตร',
  secretary:   'เลขาธิการหลักสูตร',
  responsible: 'อาจารย์ผู้รับผิดชอบหลักสูตร'
};

module.exports = {
  ROLES,
  DEGREE_LEVELS,
  DEGREE_LEVEL_LABELS,
  CURRICULUM_TYPES,
  CURRICULUM_TYPE_LABELS,
  CURRICULUM_STATUS,
  CURRICULUM_STATUS_LABELS,
  COMMITTEE_TYPES,
  COMMITTEE_LABELS,
  COMMITTEE_LEVELS,
  COMMITTEE_FLOW,
  COMMITTEE_STATUS,
  TEAM_ROLES,
  TEAM_ROLE_LABELS
};
