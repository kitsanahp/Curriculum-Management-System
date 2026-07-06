const jwt = require('jsonwebtoken');
const { User, Department, AuditLog } = require('../models');
const emailService = require('../services/emailService');

const TOKEN_MAX_AGE = 8 * 60 * 60 * 1000; // 8 hours in ms

// บันทึก audit ของเหตุการณ์ auth (login/logout/login-failed) — fire-and-forget ไม่บล็อก response
// เก็บ ip + user_agent เพื่อ forensic (รู้ว่าใครเข้าจากที่ไหน อุปกรณ์อะไร)
const auditAuth = (userId, action, req) =>
  AuditLog.create({
    user_id: userId,
    action,
    ip_address: req.ip,
    user_agent: (req.headers['user-agent'] || '').slice(0, 512) || null,
  }).catch(err => console.error(`[Audit] ${action} failed:`, err.message));

const generateToken = (user) =>
  jwt.sign(
    { id: user.id, role: user.role, department_id: user.department_id, tv: user.token_version ?? 0 },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: TOKEN_MAX_AGE
};

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกอีเมลและรหัสผ่าน' });
    }

    const user = await User.findOne({ where: { email }, include: ['department'] });
    if (!user) {
      return res.status(401).json({ success: false, message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }

    // Check lockout
    if (user.locked_until && new Date() < new Date(user.locked_until)) {
      const remaining = Math.ceil((new Date(user.locked_until) - Date.now()) / 60000);
      return res.status(423).json({
        success: false,
        message: `บัญชีถูกล็อกชั่วคราว กรุณาลองใหม่ในอีก ${remaining} นาที`
      });
    }

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'บัญชีนี้ยังไม่ได้รับการอนุมัติหรือถูกปิดใช้งาน' });
    }

    const isCorrect = await user.comparePassword(password);
    if (!isCorrect) {
      const newCount = (user.failed_login_count || 0) + 1;
      const isNowLocked = newCount >= MAX_LOGIN_ATTEMPTS;
      await User.update(
        {
          failed_login_count: newCount,
          locked_until: isNowLocked ? new Date(Date.now() + LOCKOUT_DURATION_MS) : null
        },
        { where: { id: user.id } }
      );
      auditAuth(user.id, isNowLocked ? 'LOGIN_LOCKED' : 'LOGIN_FAILED', req);
      if (isNowLocked) {
        return res.status(423).json({
          success: false,
          message: 'ล็อกอินผิดพลาดหลายครั้ง บัญชีถูกล็อกชั่วคราว 15 นาที'
        });
      }
      return res.status(401).json({
        success: false,
        message: `อีเมลหรือรหัสผ่านไม่ถูกต้อง (เหลืออีก ${MAX_LOGIN_ATTEMPTS - newCount} ครั้ง)`
      });
    }

    // Reset lockout on successful login
    await User.update(
      { failed_login_count: 0, locked_until: null },
      { where: { id: user.id } }
    );

    const token = generateToken(user);
    res.cookie('token', token, COOKIE_OPTIONS);
    auditAuth(user.id, 'LOGIN', req);
    res.json({ success: true, user });
  } catch (error) { next(error); }
};

exports.devLogin = async (req, res, next) => {
  try {
    const env = process.env.NODE_ENV ? process.env.NODE_ENV.trim() : '';
    if (env !== 'development') {
      return res.status(403).json({ success: false, message: 'Forbidden in production' });
    }
    const { role } = req.body;
    
    // 1. ลองหา User ที่เป็น Role นี้ก่อน (ไม่สนว่า active ไหม)
    let user = await User.findOne({ 
      where: { role }, 
      include: ['department'] 
    });
    
    // 2. ถ้าเจอแต่ดันไม่ active ให้เปิดใช้งาน
    if (user && !user.is_active) {
      user.is_active = true;
      await user.save();
    }
    
    // 3. แก้บั๊กมองไม่เห็นหลักสูตร: ถ้าเจอ User แต่ไม่มีสังกัด (ภาควิชา) ให้เติมให้เลย
    if (user && !user.department_id && ['faculty', 'staff'].includes(role)) {
      const firstDept = await Department.findOne();
      if (firstDept) {
        user.department_id = firstDept.id;
        await user.save();
        user = await User.findByPk(user.id, { include: ['department'] });
      }
    }
    
    // 4. ถ้าไม่เจอเลย (Cold Start) -> สร้างให้ใหม่พร้อมใส่สังกัด
    if (!user) {
      console.log(`[Dev] Auto-creating mock user for role: ${role}`);
      const firstDept = await Department.findOne();
      user = await User.create({
        name: `ระบบทดสอบ (${role.toUpperCase()})`,
        email: `dev.${role}@system.local`,
        password: 'password123', // ค่าสมมติ เพราะ devLogin ไม่ตรวจ password
        role: role,
        is_active: true,
        position: 'นักพัฒนาระบบ (จำลอง)',
        department_id: firstDept ? firstDept.id : null
      });
      
      // ดึงข้อมูลใหม่เพื่อให้ include ['department'] ทำงาน
      user = await User.findByPk(user.id, { include: ['department'] });
    }
    
    const token = generateToken(user);
    res.cookie('token', token, COOKIE_OPTIONS);
    res.json({ success: true, user });
  } catch (error) { next(error); }
};

exports.logout = async (req, res, next) => {
  try {
    // เพิกถอน token ทุกใบของผู้ใช้ (token เก่าที่อาจถูกดักไป จะใช้ไม่ได้อีกแม้ยังไม่หมดอายุ)
    await User.increment('token_version', { where: { id: req.user.id } });
    auditAuth(req.user.id, 'LOGOUT', req);
    res.clearCookie('token', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });
    res.json({ success: true, message: 'ออกจากระบบสำเร็จ' });
  } catch (error) { next(error); }
};

exports.register = async (req, res, next) => {
  try {
    const { title, first_name, last_name, email, password, role, department_id, position, academic_position, phone } = req.body;
    if (!first_name || !last_name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' });
    }
    const SELF_REGISTER_ROLES = ['faculty', 'staff', 'registrar', 'executive'];
    if (!SELF_REGISTER_ROLES.includes(role)) {
      return res.status(400).json({ success: false, message: 'ไม่สามารถสมัครด้วยบทบาทนี้ได้' });
    }
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'อีเมลนี้ถูกใช้งานแล้ว' });
    }
    const newUser = await User.create({
      name: [title, first_name.trim(), last_name.trim()].filter(Boolean).join(' '),
      email, password, role,
      department_id: department_id || null,
      position: position || null,
      academic_position: academic_position || null,
      phone: phone || null,
      is_active: false
    });

    // Notify system mailbox + all admins — fire-and-forget
    // คำขอลงทะเบียนต้องเข้ากล่องเมลหลักของระบบเสมอ แม้ยังไม่มี admin ที่ active
    const admins = await User.findAll({ where: { role: 'admin', is_active: true }, attributes: ['email'] });
    const recipients = [...new Set([emailService.SYSTEM_EMAIL, ...admins.map(a => a.email).filter(Boolean)])];
    let departmentName = null;
    if (department_id) {
      const dept = await Department.findByPk(department_id, { attributes: ['name'] });
      departmentName = dept?.name || null;
    }
    emailService.sendNewUserRegistration(
      recipients,
      { name: newUser.name, email: newUser.email, role: newUser.role, position: newUser.position, academic_position: newUser.academic_position },
      departmentName
    ).catch(err => console.error('[Email] sendNewUserRegistration failed:', err.message));

    res.status(201).json({ success: true, message: 'ลงทะเบียนสำเร็จ กรุณารอการอนุมัติจากผู้ดูแลระบบ' });
  } catch (error) { next(error); }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, { include: ['department'], attributes: { exclude: ['password'] } });
    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, message: 'บัญชีนี้ถูกปิดใช้งาน' });
    }
    res.json({ success: true, user });
  } catch (error) { next(error); }
};

// ผู้ใช้ขอลิงก์ตั้งรหัสผ่านใหม่เอง (public — "ลืมรหัสผ่าน")
// ตอบ success เสมอเพื่อไม่เปิดเผยว่าอีเมลนี้มีบัญชีในระบบหรือไม่ (กัน email enumeration)
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'กรุณากรอกอีเมล' });

    const user = await User.findOne({ where: { email: email.trim() } });
    if (user && user.is_active) {
      const secret = process.env.JWT_SECRET + user.password;
      const token  = jwt.sign({ id: user.id }, secret, { expiresIn: '1h' });
      const base   = process.env.FRONTEND_URL || 'http://localhost:5173';
      const link   = `${base}/reset-password?token=${token}`;
      emailService.sendPasswordReset(user.email, user.name, link)
        .catch(err => console.error('forgotPassword email error:', err.message));
    }

    res.json({ success: true, message: 'หากอีเมลนี้มีบัญชีในระบบ เราได้ส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปให้แล้ว' });
  } catch (error) { next(error); }
};

// ตั้งรหัสผ่านใหม่ผ่านลิงก์อีเมล (public) — verify token ด้วย secret = JWT_SECRET + hash รหัสปัจจุบัน
// เมื่อรหัสถูกเปลี่ยน hash เปลี่ยน → token เดิมใช้ไม่ได้อีก (single-use)
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, new_password } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'ลิงก์ไม่ถูกต้อง' });
    if (!new_password || new_password.length < 8) {
      return res.status(400).json({ success: false, message: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร' });
    }
    const payload = jwt.decode(token);
    if (!payload?.id) return res.status(400).json({ success: false, message: 'ลิงก์ไม่ถูกต้อง' });

    const user = await User.findByPk(payload.id);
    if (!user) return res.status(400).json({ success: false, message: 'ลิงก์ไม่ถูกต้อง' });

    try {
      jwt.verify(token, process.env.JWT_SECRET + user.password);
    } catch {
      return res.status(400).json({ success: false, message: 'ลิงก์หมดอายุหรือถูกใช้งานไปแล้ว กรุณาขอลิงก์ใหม่' });
    }

    user.password = new_password;
    user.token_version = (user.token_version || 0) + 1; // เพิกถอน session เก่าทุกใบ (กันกรณีบัญชีถูกยึด)
    await user.save(); // beforeUpdate hook hash ให้อัตโนมัติ
    res.json({ success: true, message: 'ตั้งรหัสผ่านใหม่สำเร็จ' });
  } catch (error) { next(error); }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    if (!new_password || new_password.length < 8) {
      return res.status(400).json({ success: false, message: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร' });
    }
    const user = await User.findByPk(req.user.id);
    if (!(await user.comparePassword(current_password))) {
      return res.status(400).json({ success: false, message: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
    }
    user.password = new_password;
    user.token_version = (user.token_version || 0) + 1; // เพิกถอน session เก่าทุกใบ
    await user.save();
    // ออก token ใหม่ให้ "เครื่องที่เปลี่ยนรหัสอยู่ตอนนี้" ไม่ต้อง login ซ้ำ — เครื่องอื่นถูกเตะออก
    const token = generateToken(user);
    res.cookie('token', token, COOKIE_OPTIONS);
    res.json({ success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
  } catch (error) { next(error); }
};
