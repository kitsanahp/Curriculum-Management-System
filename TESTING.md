# รายงานการทดสอบระบบ + Test Cases

> จัดทำ 7 ก.ค. 2569 — ตรวจโค้ดทั้งระบบ (backend ~6,000 บรรทัด + frontend core) หาบัค แก้บัค และวาง test suite อัตโนมัติ

---

## 1. วิธีรัน Automated Tests

ใช้ `node:test` ที่มากับ Node.js — **ไม่ต้องติดตั้ง dependency เพิ่ม และไม่ต้องต่อ MySQL**

```bash
cd backend  && npm test   # 43 เคส — flow, สิทธิ์, guard, diff, upload signature, middleware
cd frontend && npm test   # 7 เคส — utils วันที่/ชื่อหลักสูตร/ชื่อผู้ใช้
```

| ไฟล์ | ครอบคลุม |
|---|---|
| `backend/tests/committeeFlow.test.js` | โครงสร้าง COMMITTEE_FLOW 7 ขั้น/ระดับ, GE เฉพาะตรี, บัณฑิตวิทยาลัยเฉพาะโท-เอก, จบที่ CISA, label ครบ |
| `backend/tests/access.test.js` | สิทธิ์ faculty (team email) / staff (ภาควิชา) / registrar (ตรี+งานบริการ) / listScope |
| `backend/tests/workflowGuards.test.js` | state machine ของหลักสูตร — ทุก transition ที่ผิดสถานะต้องได้ 409 รวมถึงบัคที่แก้ (submit ตอนถูกคณะกรรมการตีกลับ) |
| `backend/tests/htmlDiffThai.test.js` | TQF2 diff — ไม่ตัดกลาง grapheme ไทย, ทิศทาง ins/del, ตาราง HTML ไม่พัง |
| `backend/tests/middlewares.test.js` | authenticate/authorize, errorMiddleware mapping, magic-byte ตรวจไฟล์ปลอมนามสกุล |
| `backend/tests/tqf2.test.js` | symbol normalizer (PUA → ●/✓), cache มีทิศทาง + invalidation |
| `frontend/tests/utils.test.js` | วันที่ไทย พ.ศ., isOverdue ระดับวัน, ชื่อหลักสูตร, วงรอบ 5 ปี, ชื่อ+ยศวิชาการ |

---

## 2. บัคที่พบและแก้แล้ว (12 จุด)

### ร้ายแรง — ความถูกต้องของ Workflow

| # | บัค | ไฟล์ที่แก้ | อาการก่อนแก้ |
|---|---|---|---|
| 1 | **`/submit` รับสถานะ revision จากคณะกรรมการได้** | `backend/src/services/curriculumService.js` | ถ้าเรียก `/submit` (แทน `/resubmit`) ตอนถูกคณะกรรมการตีกลับ สถานะจะกลายเป็น `department_submitted` → admin กดอนุมัติแล้ว flow **รีเซ็ตกลับ step 1** ทั้งที่ตามสเปคต้อง "เริ่มที่คณะกรรมการชุดที่ตีกลับ" (เกิดได้จากหน้า UI ค้าง/เรียก API ตรง) — ตอนนี้ตอบ 409 พร้อมชี้ให้ใช้เส้นทาง resubmit |
| 2 | **บันทึกมติข้าม step ได้** | `backend/src/controllers/committeeController.js` | `uploadDecision` ไม่เช็คว่า step ที่ส่งมาเป็น step ปัจจุบัน — บันทึกมติ "เห็นชอบ" ให้ step 7 (CISA) ตอนอยู่ step 2 ได้ ทำให้หลักสูตร**อนุมัติทันที** — ตอนนี้บันทึกได้เฉพาะ step ที่ `current_committee_step_id` ชี้อยู่ |
| 3 | **faculty/staff ลบเอกสารได้ทุกสถานะ** | `backend/src/controllers/documentController.js` | อัปโหลดถูกเกตตามสถานะ แต่**ลบไม่ถูกเกต** — สาขาลบไฟล์ทิ้งได้ระหว่าง admin ตรวจ/อยู่ชั้นคณะกรรมการ/อนุมัติแล้ว — ตอนนี้ลบได้เฉพาะช่วง `pending_department` / `revision` (เกตเดียวกับอัปโหลด) |

### ปานกลาง — สิทธิ์การเข้าถึง / Race Condition

| # | บัค | ไฟล์ที่แก้ | อาการก่อนแก้ |
|---|---|---|---|
| 4 | **registrar ดูรายการ มคอ.2 นอกขอบเขตได้** | `backend/src/controllers/tqf2Controller.js` (`getAll`) | endpoint รายการ TQF2 ไม่เช็ค scope ของ registrar (ดาวน์โหลดถูกกันแล้ว แต่ metadata รั่ว) — ตอนนี้ใช้เงื่อนไขเดียวกับ `getDocuments` |
| 5 | **อัปโหลด มคอ.2 พร้อมกัน → เลขเวอร์ชันซ้ำ + ไฟล์ขยะ** | `backend/src/controllers/tqf2Controller.js` (`upload`) | คำนวณ `version_number` นอก transaction (ต่างจากฝั่ง documents ที่ล็อกแล้ว) และถ้า DB fail ไฟล์ที่ multer เขียนแล้วไม่ถูกลบ — ตอนนี้ครอบ transaction + row lock + cleanup ไฟล์เมื่อ fail |
| 6 | **กรอกรหัสผ่านผิดแล้วหน้า login โดน reload ทิ้ง** | `frontend/src/services/api.js` | interceptor redirect ไป `/login` เมื่อเจอ 401 **ทุกกรณี** รวมถึง 401 จากการ login ผิดเอง → ผู้ใช้ไม่เคยเห็นข้อความ "อีเมลหรือรหัสผ่านไม่ถูกต้อง (เหลืออีก X ครั้ง)" และไม่ล้าง `localStorage.user` → เสี่ยง redirect วนเมื่อ cookie หมดอายุ — ตอนนี้ยกเว้น endpoint auth สาธารณะ + ล้าง user ก่อน redirect |

### เล็ก — Validation / ความถูกต้องของข้อมูล

| # | บัค | ไฟล์ที่แก้ | อาการก่อนแก้ |
|---|---|---|---|
| 7 | เปลี่ยนรหัสผ่านโดยไม่กรอกรหัสเดิม → 500 | `authController.changePassword` | `bcrypt.compare(undefined)` โยน error — ตอนนี้ตอบ 400 พร้อมข้อความ |
| 8 | admin สร้างผู้ใช้ไม่กรอกข้อมูล/role มั่ว → 500 | `userController.create` | ไม่มี validation เลย — ตอนนี้เช็คฟิลด์บังคับ, รหัส ≥ 8 ตัว, role ต้องอยู่ในระบบ |
| 9 | สร้างประกาศไม่ใส่หัวข้อ/เนื้อหา → 500 + ไฟล์แนบค้าง | `announcementController.create` | `content.substring` พังก่อน validate — ตอนนี้ตอบ 400 และลบไฟล์ที่อัปโหลดแล้วทิ้ง |
| 10 | บัญชีที่ถูกลบ (soft delete) ยังตั้งรหัสผ่านใหม่ผ่านลิงก์เก่าได้ / admin ส่งลิงก์ reset ให้บัญชีที่ลบแล้วได้ | `authController.resetPassword`, `userController.sendPasswordReset` | ไม่เช็ค `deleted_at` — ตอนนี้ปัดตก |
| 11 | login ด้วยอีเมลที่มี space ติดมา (autofill/copy-paste) → ล้มเหลวแบบงง ๆ | `authController.login` | forgot-password trim ให้แต่ login ไม่ trim — ตอนนี้ trim เหมือนกัน |
| 12 | วันครบกำหนด "วันนี้" ขึ้นสถานะ "เลยกำหนด" ทั้งวัน | `frontend/src/utils/date.js` (`isOverdue`) | deadline เป็น DATEONLY ถูก parse เป็นเที่ยงคืน → เกินตั้งแต่ 00:01 — ตอนนี้เทียบระดับวัน (ครบกำหนดวันนี้ = ยังไม่เกิน) |
| 13 | **executive เข้าถึง endpoint หลักสูตร/เอกสารผ่าน API ได้** (ดูรายชื่อไฟล์/รายละเอียดหลักสูตร แม้เปิดไฟล์ไม่ได้) | `backend/src/routes/curriculumRoutes.js`, `frontend/src/router/index.js` | ตัดสินใจใช้แนวเข้มตามสเปค "executive = view-only Dashboard เท่านั้น" — ปัด executive ทุกเส้นใต้ `/api/curricula` ที่จุดเดียว (route-level whitelist) + ถอด executive ออกจาก route หน้ารายละเอียดหลักสูตรฝั่ง frontend (Dashboard ของ executive ใช้ `/api/dashboard/summary` ไม่กระทบ) |

### รอบ 2 — ระบบส่งอีเมล + มอนิเตอร์เมลของ admin (ตรวจ 8 ก.ค. 2569)

| # | บัค | ไฟล์ที่แก้ | อาการก่อนแก้ |
|---|---|---|---|
| 14 | **HTML injection ในอีเมล** (ร้ายแรง) | `backend/src/services/emailService.js` | ค่าที่ผู้ใช้พิมพ์ถูกฝังลง HTML ของเมลแบบดิบ — จุดอันตรายสุดคือ**ฟอร์มสมัครสมาชิกซึ่งเป็น public**: คนนอกกรอกชื่อ/ตำแหน่งเป็นแท็ก HTML (`<script>`, ลิงก์ phishing) แล้วแท็กนั้นถูก render จริงในเมลแจ้ง admin ทุกคน รวมถึงหัวข้อ/เนื้อหาประกาศ, ชื่อหลักสูตร, ชื่อภาควิชา — เพิ่ม `esc()` แล้ว escape ทุกจุดที่ข้อมูลผู้ใช้เข้าเทมเพลต (heroSection, userBlock, curriculumBlock, pGreeting, ctaButton href, announcement title/content/alt) |
| 15 | **เหตุผลการตีกลับไม่เคยแสดงในเมล** | `backend/src/services/emailService.js` | `sendRevisionRequired` / `sendCommitteeRevision` รับ `note` มาแต่ไม่ใช้เลย (dead param) — สาขาได้เมล "ต้องแก้ไข" แต่ไม่รู้ว่าแก้อะไร ต้องเข้าระบบไปหาเอง — เพิ่มกล่อง "ข้อเสนอแนะจากผู้ตรวจ" (escape + คง newline) ในเมลตีกลับทั้ง 2 แบบ |
| 16 | ผู้รับเป็น `undefined`/ค่าที่ไม่ใช่อีเมล → ระบบพยายามส่งหา "undefined" | `backend/src/services/emailService.js` (`send`) | ถ้า caller ส่ง `to` เป็น undefined จะกลายเป็น string `"undefined"` แล้วยิงจริงจน SMTP error — ตอนนี้กรองเฉพาะค่าที่มี `@` และจบเงียบเมื่อไม่มีผู้รับ |
| 17 | ตาราง `email_logs` โตไม่มีที่สิ้นสุด | `backend/src/services/reminderScheduler.js` | log ทุกฉบับถูกเก็บตลอดไป — เพิ่ม retention ลบ log เก่ากว่า 90 วันอัตโนมัติ (รันพร้อม scheduler รายวัน) |

### ข้อสังเกตที่ *ไม่ได้แก้* (จดไว้พิจารณา)

- **faculty แก้ไขข้อมูลหลักสูตร (รวม "กำหนดส่ง") ได้ทุกสถานะ** — UI เปิดให้โดยตั้งใจ (`canEdit`) แต่การให้สาขาแก้ deadline ของตัวเองอาจไม่ตรงเจตนา ควรถามเจ้าของระบบ
- `GET /curricula/:id/audit-logs` และ timeline — registrar/executive ดูของหลักสูตรใดก็ได้ (ข้อมูลประวัติการดำเนินการ ไม่ใช่ตัวเอกสาร)
- แจ้งเตือน deadline ยิงซ้ำทุกครั้งที่ server restart (scheduler รันทันทีตอน boot)
- เปลี่ยนรูปปกประกาศแล้วรูปเก่าค้างบน disk (orphan file)
- รายชื่อหลักสูตรของ faculty: ถ้ามีชื่อซ้ำ 2 แถวในทีมเดียวกัน หน้าที่แบ่ง page อาจแสดงจำนวนต่อหน้าน้อยกว่า limit เล็กน้อย (ข้อมูลไม่หาย)
- CLAUDE.md ระบุ "8 คณะกรรมการ" แต่ flow จริงมี 7 ขั้น/ระดับ (GE เฉพาะตรี, บัณฑิตวิทยาลัยเฉพาะโท-เอก) — เอกสารกับโค้ดไม่ตรงกัน โค้ดคือของจริง

---

## 3. Manual Test Cases (E2E) — รันกับระบบจริง

> เตรียม: ผู้ใช้ 5 role (admin, faculty, staff, registrar, executive) — ใช้ Dev role switcher ได้ใน development

### TC-A: Authentication & บัญชีผู้ใช้

| ID | ขั้นตอน | ผลที่คาดหวัง |
|---|---|---|
| A1 | login ถูกต้อง | เข้าหน้าแรกตาม role (admin→dashboard, faculty→curricula, staff→faculty, registrar→downloads) |
| A2 | login รหัสผิด | เห็นข้อความ "เหลืออีก X ครั้ง" **โดยหน้าไม่ reload** (บัค #6) |
| A3 | login ผิด 5 ครั้ง | บัญชีล็อก 15 นาที (423) แล้ว login ถูกก็ยังเข้าไม่ได้จนกว่าจะครบเวลา |
| A4 | login อีเมลมี space ท้าย | เข้าได้ปกติ (บัค #11) |
| A5 | สมัครสมาชิกใหม่ | สถานะรออนุมัติ, login ไม่ได้ (403), admin ได้เมล+เข้ากล่องระบบ |
| A6 | admin อนุมัติบัญชี | ผู้สมัครได้เมลแจ้ง, login ได้ |
| A7 | admin ลบผู้ใช้ pending | ผู้สมัครได้เมลปฏิเสธ, อีเมลนั้นสมัครใหม่แล้วระบบแจ้งให้ติดต่อเจ้าหน้าที่ |
| A8 | ลืมรหัสผ่าน → ตั้งรหัสใหม่ผ่านลิงก์ | ลิงก์ใช้ได้ครั้งเดียว หมดอายุ 1 ชม., ใช้ซ้ำ → "ลิงก์หมดอายุ", session เก่าทุกเครื่องหลุด |
| A9 | เปลี่ยนรหัสผ่าน (ไม่กรอกรหัสเดิม / รหัสใหม่ < 8 ตัว) | ได้ 400 พร้อมข้อความ ไม่ใช่ error 500 (บัค #7) |
| A10 | logout | token เดิมใช้ไม่ได้อีก (เรียก API ด้วย token เก่า → 401) |

### TC-B: สร้างหลักสูตร + Workflow เต็มวงจร (ทำ 3 รอบ: ตรี / โท / เอก)

| ID | ขั้นตอน | ผลที่คาดหวัง |
|---|---|---|
| B1 | admin สร้างหลักสูตร (กรอกครบ + ทีม) | สถานะ `pending_department`, มี committee steps 7 ขั้น — ตรีมี "ตรวจวิชาศึกษาทั่วไป", โท/เอกมี "บัณฑิตวิทยาลัย", ทีมได้อีเมลแจ้ง |
| B2 | สร้างซ้ำ (ภาค+ระดับ+ปี+สาขาเดิม) | 409 "หลักสูตรนี้มีอยู่แล้ว" |
| B3 | faculty ในทีมอัปโหลดเอกสาร แล้วกดส่ง | สถานะ → `department_submitted`, admin ได้แจ้งเตือน in-app + เมล, มี audit log |
| B4 | faculty กดส่งซ้ำ (สถานะไม่ใช่ pending/revision) | 409 |
| B5 | admin ตีกลับ (ใส่ note + deadline) | สถานะ → `revision`, ทีมได้เมล+แจ้งเตือน, faculty อัปโหลดใหม่ได้ → ไฟล์เดิมกลายเป็น version เก่า |
| B6 | admin อนุมัติ | สถานะ → `under_committee`, step ปัจจุบัน = ขั้น 1 |
| B7 | admin บันทึกมติ "เห็นชอบ" ทีละขั้นจนครบ | step เดินทีละขั้นตามลำดับ ปุ่มบันทึกมติแสดงเฉพาะ step ปัจจุบัน, ขั้นสุดท้าย (CISA) เห็นชอบ → สถานะ `approved` "หลักสูตรอนุมัติโดย อว." |
| B8 | เรียก API บันทึกมติให้ step อื่นที่ไม่ใช่ step ปัจจุบัน | 409 "บันทึกมติได้เฉพาะขั้นตอนที่กำลังพิจารณาอยู่" (บัค #2) |
| B9 | ระหว่างทาง บันทึกมติ "แก้ไข" ที่ step N | สถานะ → `revision`, ทีมได้เมล, faculty เห็นปุ่ม "ส่งให้งานหลักสูตรตรวจสอบ" (resubmit) |
| B10 | faculty แก้เอกสาร → กด resubmit | สถานะ → `pending_admin_recheck`, admin ได้แจ้งเตือน |
| B11 | เรียก API `/submit` ตรง ๆ ขณะถูกคณะกรรมการตีกลับ | 409 ชี้ให้ใช้เส้นทาง resubmit (บัค #1) |
| B12 | admin กด "ผ่านการตรวจสอบ" (approve-recheck) | กลับ `under_committee` **ที่ step N เดิม** (ไม่เริ่มใหม่จาก step 1) |
| B13 | admin กด "ตีกลับ" (reject-recheck) | กลับ `revision` โดย step N ยังค้างไว้ resume ได้ |
| B14 | ลบหลักสูตร → ดูหน้า "ที่ยกเลิก" → กู้คืน → ลบถาวร | soft delete หายจากรายการปกติ, กู้คืนได้, ลบถาวรแล้วเอกสาร/step/ทีม/มคอ.2 หายหมดแต่ audit ยังอยู่ |

### TC-C: เอกสาร (Workspace + Version Control)

| ID | ขั้นตอน | ผลที่คาดหวัง |
|---|---|---|
| C1 | อัปโหลด PDF/DOCX | สำเร็จ, preview ได้ (PDF inline, DOCX แปลง HTML), มี audit |
| C2 | อัปโหลดไฟล์ .exe เปลี่ยนนามสกุลเป็น .pdf | 400 "เนื้อไฟล์ไม่ตรงกับนามสกุล" |
| C3 | อัปโหลดไฟล์ > 50MB | 400 "ไฟล์มีขนาดใหญ่เกินไป" |
| C4 | อัปโหลดชื่อไฟล์เดิมซ้ำ | ทับ record เดิม + เก็บของเก่าเป็น version พร้อม timestamp, ดู/ดาวน์โหลดทุก version ได้ |
| C5 | faculty ลบไฟล์ตอนสถานะ `department_submitted` / `under_committee` | 403 (บัค #3) — admin ยังลบได้ |
| C6 | faculty สาขา A เดา id ไฟล์ของสาขา B (download/preview/annotation) | 403 ทุก endpoint (กัน IDOR) |
| C7 | admin อัปโหลดตอนยังไม่มีไฟล์ของสาขาเลย | 403 "กรุณารอให้อาจารย์...อัปโหลดก่อน" |

### TC-D: TQF2 (มคอ.2) Comparator

| ID | ขั้นตอน | ผลที่คาดหวัง |
|---|---|---|
| D1 | อัปโหลด มคอ.2 v1, v2 (DOCX) แล้วเปรียบเทียบ | แสดง diff แยกหมวด 1-8 + ส่วนนำ, สีเขียว=เพิ่ม แดง=ลบ, ตัวอักษรไทยไม่เพี้ยน (สระ/วรรณยุกต์ไม่ลอย) |
| D2 | สลับทิศ (เทียบ v2→v1) | ins/del สลับด้านถูกต้อง (ไม่ติด cache ทิศเดิม) |
| D3 | เทียบข้ามหลักสูตร / เทียบกับ PDF | 400 "เฉพาะหลักสูตรเดียวกัน" / 422 "เฉพาะ DOCX" |
| D4 | อัปโหลด 2 ไฟล์เทียบสด (compare-upload) | ได้ผล diff โดยไม่บันทึกไฟล์ |
| D5 | registrar เปิดรายการ มคอ.2 ของหลักสูตรโท ภาคอื่น | 403 (บัค #4) |

### TC-E: สิทธิ์ตาม Role (Permission Matrix)

| การกระทำ | admin | faculty (ในทีม) | faculty (นอกทีม) | staff (ภาคตน) | staff (ภาคอื่น) | registrar | executive |
|---|---|---|---|---|---|---|---|
| เห็นภาพรวมใน Dashboard | ✓ | ✓ | — | ✓ | — | — | ✓ (ทุกหลักสูตร) |
| เปิดหน้ารายละเอียด / รายการเอกสาร | ทุกอัน | ✓ | ✗ | ✓ | ✗ | ตาม scope | ✗ 403 (บัค #13) |
| สร้าง/ลบหลักสูตร | ✓ | ✗ 403 | ✗ | ✗ | ✗ | ✗ | ✗ |
| อัปโหลด/ส่งเอกสาร | ✓ (ตามสถานะ) | ✓ (ตามสถานะ) | ✗ | ✓ | ✗ | ✗ | ✗ |
| บันทึกมติคณะกรรมการ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| ดาวน์โหลดเอกสารหลักสูตร | ✓ | ✓ | ✗ | ✓ | ✗ | ตาม scope | ✗ 403 |
| หน้า Downloads (มติ GE) | — | — | — | — | — | ✓ | ✗ |
| จัดการผู้ใช้ / ประกาศ / แบบฟอร์ม | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

> วิธีทดสอบ: ยิง API ตรงด้วย token ของแต่ละ role (ไม่ใช่แค่ดู UI) — ทุกช่อง ✗ ต้องได้ 403

### TC-F: ประกาศ / แบบฟอร์ม / แจ้งเตือน / ปฏิทิน

| ID | ขั้นตอน | ผลที่คาดหวัง |
|---|---|---|
| F1 | admin สร้างประกาศ (รูป + ไฟล์แนบ + ลิงก์) | ทุก user ได้ in-app + เมล, แสดงบน slideshow หน้า login (ไม่ต้อง login) |
| F2 | สร้างประกาศไม่ใส่หัวข้อ/เนื้อหา | 400 ไม่ใช่ 500, ไม่มีไฟล์ขยะค้าง (บัค #9) |
| F3 | อัปโหลดรูปปกที่ไม่ใช่รูปจริง (rename) | 400 "ไฟล์รูปภาพไม่ถูกต้อง" (sharp re-encode fail) |
| F4 | แก้/ลบประกาศ | หน้า login อัปเดต (cache ถูก invalidate) |
| F5 | แจ้งเตือน: อ่านทีละอัน / อ่านทั้งหมด / ล้างทั้งหมด | badge นับถูก, เห็นเฉพาะของตัวเอง |
| F6 | ตั้ง revision_deadline ใกล้ครบ (≤3 วัน) | ทีมได้เมล+แจ้งเตือนเตือนกำหนดส่ง (scheduler 24 ชม.) |
| F7 | deadline = วันนี้ | UI แสดง "วันนี้" ไม่ใช่ "เลยกำหนด" (บัค #12) |
| F8 | ปฏิทิน: สร้าง/ลบ event | เห็นเฉพาะของตัวเอง, ลบ event ของคนอื่น → 404 |

### TC-H: ระบบส่งอีเมล + หน้ามอนิเตอร์ "การส่งอีเมล" (admin)

> Automated ครอบคลุมแล้วใน `backend/tests/emailPipeline.test.js` (8 เคส — mock Brevo ไม่ยิงจริง): ส่งแยกรายผู้รับ+dedupe, log sent/failed ถูกตัว, EMAIL_TEST_TO redirect, กันผู้รับ invalid, escape HTML injection, note ตีกลับแสดงในเมล, subject ถูกตัด 500 ตัว

| ID | ขั้นตอน | ผลที่คาดหวัง |
|---|---|---|
| H1 | ทำ action ที่ยิงเมล (เช่น admin ส่งลิงก์ reset รหัสผ่าน) | เมลถึงผู้รับ + รายการโผล่ในหน้า "การส่งอีเมล" สถานะเขียว "ส่งสำเร็จ" ภายในไม่กี่วินาที |
| H2 | ส่งไปอีเมลที่ไม่มีจริง (โดเมนผิด/mailbox ไม่มี) | รายการขึ้นแดง "ล้มเหลว" พร้อมสาเหตุจริงจาก SMTP/Brevo, ตัวเลข "ล้มเหลว 24 ชม." บน header เพิ่ม |
| H3 | สร้างประกาศถึงผู้ใช้ N คน | มี log N แถว (แยกรายผู้รับ) — ห้ามมีฉบับเดียวที่รวมทุกคน (privacy: ผู้รับต้องไม่เห็นอีเมลกันเอง) |
| H4 | ค้นหาอีเมลผู้รับ / กรอง "ล้มเหลว" / เปลี่ยนหน้า | ผลถูกต้อง, ตัวนับ "ทั้งหมด X รายการ" ตรง, กรองแล้วรีเซ็ตกลับหน้า 1 |
| H5 | login เป็น faculty/registrar/executive แล้วยิง `GET /api/email-logs` ตรง | 403 ทุก role (admin เท่านั้น) |
| H6 | สมัครสมาชิกโดยกรอกชื่อเป็น `<script>alert(1)</script>` | เมลแจ้ง admin แสดงเป็น "ข้อความ" ไม่ใช่แท็กจริง (บัค #14) |
| H7 | admin ตีกลับหลักสูตรพร้อม note | เมลที่ทีมได้รับมีกล่อง "ข้อเสนอแนะจากผู้ตรวจ" แสดง note ครบ (บัค #15) |
| H8 | ตรวจหลัง 90 วัน (หรือ mock วันที่) | log เก่ากว่า 90 วันถูกลบอัตโนมัติ (บัค #17) |

> ข้อจำกัด: log บอกว่า "ปลายทาง (SMTP/Brevo) ตอบรับ" — ไม่รู้ระดับ inbox/spam/bounce ภายหลัง ถ้าต้องการระดับนั้นดูคู่กับ Brevo dashboard

### TC-G: Dashboard & รายงาน

| ID | ขั้นตอน | ผลที่คาดหวัง |
|---|---|---|
| G1 | เปิด dashboard แต่ละ role | ตัวเลข stats ตรงกับรายการที่ role นั้นเห็นจริง (นับจากชุดข้อมูลเดียวกัน) |
| G2 | Timeline ในหน้ารายละเอียด | เรียงเหตุการณ์ตามจริง มี duration รายขั้น, audit log แบ่งหน้า |

---

## 4. แนวทางต่อยอด

1. **Integration tests กับ DB จริง** — ตั้ง MySQL test database (`curriculum_test`) + supertest ยิง API ตาม TC-B/TC-E ทั้ง matrix จะจับ regression ของ workflow ได้แน่นกว่า unit guard
2. เพิ่ม rate limiter ให้ `/auth/register` (ตอนนี้มีเฉพาะ global 600/15 นาที)
3. พิจารณา 2 ข้อสังเกตเรื่องสิทธิ์ executive/faculty-edit-deadline ในหัวข้อ 2
