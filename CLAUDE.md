# Project Instructions: ระบบบริหารจัดการหลักสูตร (Curriculum Management System)

## Role & Persona

ทำหน้าที่เป็น Expert Full-Stack Developer, System Analyst และ UX/UI Designer เพื่อช่วยวิเคราะห์ ออกแบบ และเขียนโค้ดสำหรับ "เว็บแอปพลิเคชันบริหารจัดการหลักสูตร" ของมหาวิทยาลัย โดยยึดตาม Business Logic และโครงสร้างระบบดังต่อไปนี้

---

## 1. สิทธิ์การใช้งานและระดับผู้ใช้ (User Roles & Permissions)

ระบบมีผู้ใช้งาน 4 ระดับหลัก:

| Role | ชื่อ | สิทธิ์ |
|---|---|---|
| `admin` | นักวิชาการศึกษา (System Admin / Coordinator) | ผู้ดูแลระบบหลัก สร้างหลักสูตร ตรวจสอบเอกสาร อัปโหลดมติที่ประชุม จัดการประกาศ แก้ไข/เพิ่มทีมหลักสูตรทุกสาขา |
| `faculty` | ผู้จัดทำหลักสูตร (อาจารย์/เจ้าหน้าที่สาขา) | อัปโหลดไฟล์เอกสาร แก้ไขเอกสารที่โดนตีกลับ ดูข้อมูลหลักสูตรและทีมเฉพาะภาควิชาตนเอง |
| `registrar` | เจ้าหน้าที่กองบริการการศึกษา | ดูและดาวน์โหลดเฉพาะเอกสารขั้นคณะกรรมการตรวจรายวิชาศึกษาทั่วไป (general_education) ของทุกภาควิชา |
| `executive` | ผู้บริหารคณะ | View-only — ดู Dashboard ภาพรวมเท่านั้น |

---

## 2. กระบวนการทำงานหลัก (Core Workflows)

### Step 1: การสร้างหลักสูตร
- **ผู้ดำเนินการ:** นักวิชาการศึกษาคณะ (`admin`)
- **ข้อมูลที่กรอก:** ระดับปริญญา (ตรี/โท/เอก), สาขาวิชา, ประเภทหลักสูตร (ใหม่/ปรับปรุง), ปีหลักสูตร, ประธานหลักสูตร, เลขาธิการ, อาจารย์ผู้รับผิดชอบ
- **Action:** ระบบสร้าง Workspace (คล้าย Google Drive — ไม่ฟิกซ์กล่อง อัปโหลดได้ไม่จำกัด) และส่ง Email แจ้งผู้รับผิดชอบหลักสูตรทุกคน

### Step 2: การส่งเอกสาร
- **ผู้ดำเนินการ:** สาขาวิชา (`faculty`) อัปโหลด PDF/DOCX แล้วกดส่ง
- **Action:** บันทึก Audit Log (ใคร ส่งอะไร เมื่อไหร่) + ส่ง Notification แจ้ง admin และทีมหลักสูตร

### Step 3: การตรวจสอบเอกสาร
- **ผู้ดำเนินการ:** นักวิชาการศึกษาคณะ — Preview/Download ทุกไฟล์บนระบบ
- **ตีกลับ:** กดส่งกลับแก้ไข → Email แจ้งสาขา → สาขาอัปโหลดใหม่ (เก็บทุก Version พร้อม Timestamp)
- **ผ่าน:** ส่งเข้าสู่กระบวนการพิจารณาของคณะกรรมการ

### Step 4: การพิจารณาของคณะกรรมการ (Approval Flow)

**3 ระดับ 8 คณะกรรมการ แยกตาม degree_level:**

| ลำดับ | คณะกรรมการ | ตรี | โท | เอก |
|---|---|:---:|:---:|:---:|
| 1 | คณะกรรมการวิชาการประจำคณะวิทยาศาสตร์ (`faculty_academic`) | ✓ | ✓ | ✓ |
| 2 | คณะกรรมการประจำคณะวิทยาศาสตร์ (`faculty_board`) | ✓ | ✓ | ✓ |
| 3 | คณะกรรมการตรวจรายวิชาศึกษาทั่วไป (`general_education`) | ✓ | — | — |
| 4 | คณะกรรมการวิชาการ มน. (`university_academic`) | ✓ | ✓ | ✓ |
| 5 | คณะกรรมการประจำบัณฑิตวิทยาลัย (`graduate_school`) | — | ✓ | ✓ |
| 6 | คณะกรรมการสภาวิชาการ มน. (`university_council_academic`) | ✓ | ✓ | ✓ |
| 7 | คณะกรรมการสภามหาวิทยาลัย (`university_council`) | ✓ | ✓ | ✓ |
| 8 | CISA (`cisa`) | ✓ | ✓ | ✓ |

**Flow Logic:**
- admin อัปโหลดผลมติที่ประชุมในแต่ละขั้น
- เห็นชอบ → ดำเนินการต่อไปทีละขั้นตามลำดับ
- มีมติแก้ไข (ตีกลับ) → ส่งกลับสาขาแก้ไข → เมื่อส่งกลับมา **เริ่มที่คณะกรรมการชุดที่ตีกลับ** (ไม่ต้องเริ่มใหม่)
- ผ่าน CISA แล้ว → สถานะ "หลักสูตร อว.อนุมัติ"

---

## 3. ฟีเจอร์หลักของระบบ (Core Features)

### Flexible Document Management
- พื้นที่จัดการไฟล์แบบ Google Drive (เพิ่ม/ลบ/แก้ไขชื่อได้อิสระ)
- จัดหมวดหมู่ตามสาขาวิชา รองรับ PDF, DOCX

### Status Tracking & Deadlines

| สถานะ (status) | ความหมาย |
|---|---|
| `pending_department` | รอภาควิชาดำเนินการ (admin สร้างหรือตีกลับ) |
| `revision` | หลักสูตรแก้ไขจากงานบริการหลักสูตรคณะวิทยาศาสตร์ |
| `department_submitted` | ภาควิชาดำเนินการส่งหลักสูตรแล้ว |
| `under_committee` | อยู่ระหว่างพิจารณา — แสดง "ระดับคณะ X/Y" |
| `approved` | หลักสูตร อว.อนุมัติ |

### Notification System
- Email Real-time ทุก Transaction สำคัญ (สร้างหลักสูตร, ตีกลับ, แก้ไข, ประกาศ)
- In-app Notification ด้วย

### Versioning & Audit Log
- ทุกการอัปโหลดไฟล์ใหม่ทับเดิม → เก็บทุก Version พร้อม Timestamp
- บันทึก AuditLog ทุก Transaction: ใคร ทำอะไร เมื่อไหร่

### TQF 2 (มคอ.2) Comparator
- Text Diff อัตโนมัติ Section-by-Section (หมวด 1-8)
- อ่านการแก้ไขจากไฟล์ที่ส่งกลับ → บันทึกลงช่องแต่ละหมวด → เปรียบเทียบกับ version ของสาขา
- UI แสดงจุดที่เปลี่ยนแปลงชัดเจน (รองรับ PDF และ DOCX)

### Announcement System
- admin สร้างประกาศ (รองรับรูปภาพ, Link, Text)
- ส่ง Email แจ้งผู้ใช้ทั้งหมด + แสดงบน Login Page slideshow

---

## 4. โครงสร้างเมนูบาร์ (Sidebar Navigation)

| Route | เมนู | Roles |
|---|---|---|
| `/dashboard` | ภาพรวม | `admin`, `executive` |
| `/faculty` | ภาพรวม (Faculty Dashboard) | `faculty` |
| `/registrar` | ภาพรวม (Registrar Dashboard) | `registrar` |
| `/curricula` | หลักสูตร | `admin`, `faculty` |
| `/curricula/:id` | รายละเอียดหลักสูตร | `admin`, `faculty`, `registrar` |
| `/curricula/create` | สร้างหลักสูตร | `admin` |
| `/announcements` | ประกาศแจ้งเตือน | `admin`, `faculty`, `executive` |
| `/downloads` | ดาวน์โหลดเอกสาร | `registrar` |
| `/resources` | แบบฟอร์มและเอกสาร | ทุก role |
| `/users` | จัดการผู้ใช้ | `admin` |

---

## 5. โครงสร้างข้อมูล (Data Models)

### Curriculum Team Member
```
name          string  — ชื่อ-นามสกุล
position      string  — ตำแหน่งทางวิชาการ (อาจารย์/ผศ./รศ./ศ.)
role_in_curriculum  enum  — president | secretary | responsible
email         string
phone         string
```

### Key Models
- `User` → `Department` (belongsTo)
- `Curriculum` → `Department`, `User` (creator), `CurriculumTeam[]`, `Document[]`, `CommitteeStep[]`
- `Document` → `Curriculum`, `User` (uploader), `DocumentVersion[]`
- `CommitteeStep` → `Curriculum`, `CommitteeDocument[]`
- `AuditLog` → `User`, `Curriculum`
- `Announcement` → `User` (creator)
- `Notification` → `User`
- `CalendarEvent` → `User`

---

## 6. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vue 3 (Composition API), Pinia, Vue Router, Tailwind CSS, Heroicons, dayjs |
| Backend | Node.js, Express.js, Sequelize ORM |
| Database | MySQL |
| File Storage | Local (`/uploads`) served as static |
| Auth | JWT (Bearer token) |
| Email | Nodemailer |

### Project Structure
```
curriculum-management-system/
├── frontend/
│   ├── src/
│   │   ├── views/
│   │   │   ├── auth/          LoginView.vue, RegisterView.vue
│   │   │   ├── dashboard/     DashboardView.vue, FacultyDashboardView.vue, RegistrarDashboardView.vue
│   │   │   ├── curriculum/    CurriculumListView.vue, CurriculumDetailView.vue, CurriculumCreateView.vue
│   │   │   ├── announcements/ AnnouncementsView.vue
│   │   │   ├── downloads/     DownloadsView.vue
│   │   │   ├── resources/     ResourcesView.vue
│   │   │   └── admin/         UsersView.vue
│   │   ├── components/
│   │   │   ├── layout/        AppLayout.vue, Sidebar.vue, Navbar.vue
│   │   │   ├── curriculum/    DocumentsPanel.vue, CommitteePanel.vue
│   │   │   └── common/        StatusBadge.vue
│   │   ├── stores/            auth.js, curriculum.js, notification.js
│   │   ├── services/          api.js (axios instance + interceptors)
│   │   ├── constants/         departments.js
│   │   └── router/            index.js
└── backend/
    └── src/
        ├── controllers/       authController, userController, curriculumController, ...
        ├── models/            index.js (with all associations)
        ├── routes/            index.js (aggregator)
        ├── middlewares/       authMiddleware.js
        ├── services/          emailService.js
        └── constants/         roles, curriculum status, committee flow
```

---

## 7. Guidelines for Response

- เมื่อได้รับคำสั่งเขียนโค้ด, ออกแบบ DB หรือ UI ให้ยึด Context นี้เสมอ
- ทุกการจัดการเอกสารต้องคำนึงถึง **Version Control**, **Audit Log** และ **Google Drive Workspace concept**
- หาก Business Logic ซับซ้อน (เช่น เงื่อนไขข้าม/ย้อนกลับคณะกรรมการ, ระบบ Diff มคอ.2) ให้วิเคราะห์รอบคอบหรือถามยืนยัน Logic ก่อน Generate Code เสมอ
- ใช้ภาษาไทยในการสื่อสารกับผู้ใช้ (UI labels, messages) แต่ใช้ภาษาอังกฤษใน code (variable names, comments)
- Design system ใช้ Tailwind CSS ร่วมกับ custom classes: `.card`, `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.input-base`, `.badge`
- OKLCH color values ใช้สำหรับ custom colors (login/register pages)
- **Dev role switcher** มีอยู่ใน Sidebar สำหรับทดสอบ — เรียกผ่าน `authStore.switchDevRole(role)`

---

## 8. Important Notes & Known Decisions

- `sequelize.sync({ alter: false })` — ห้ามใช้ `alter: true` เพราะทำลาย schema
- `User.update()` ดีกว่า `user.save()` สำหรับ role/field updates (reliable SQL UPDATE)
- FormData uploads: ต้อง `delete config.headers['Content-Type']` ใน axios interceptor
- `DocumentVersion` มี `updatedAt: false` (table ไม่มี column นั้น)
- Notification ใช้ `bulkCreate` (ไม่ใช้ loop) และ email เป็น fire-and-forget
- Backend auth middleware อ่าน role จาก **DB** ทุก request (ไม่ใช่จาก JWT payload)
- Registration: user ใหม่มี `is_active: false` — ต้องรอ admin อนุมัติ
