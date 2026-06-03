const jwt = require('jsonwebtoken');
const { User, Department } = require('../models');
const emailService = require('../services/emailService');

const TOKEN_MAX_AGE = 8 * 60 * 60 * 1000; // 8 hours in ms

const generateToken = (user) =>
  jwt.sign({ id: user.id, role: user.role, department_id: user.department_id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h'
  });

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

exports.logout = (req, res) => {
  res.clearCookie('token', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });
  res.json({ success: true, message: 'ออกจากระบบสำเร็จ' });
};

exports.register = async (req, res, next) => {
  try {
    const { first_name, last_name, email, password, role, department_id, position, academic_position, phone } = req.body;
    if (!first_name || !last_name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' });
    }
    const SELF_REGISTER_ROLES = ['faculty', 'staff'];
    if (!SELF_REGISTER_ROLES.includes(role)) {
      return res.status(400).json({ success: false, message: 'ไม่สามารถสมัครด้วยบทบาทนี้ได้' });
    }
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'อีเมลนี้ถูกใช้งานแล้ว' });
    }
    const newUser = await User.create({
      name: `${first_name.trim()} ${last_name.trim()}`,
      email, password, role,
      department_id: department_id || null,
      position: position || null,
      academic_position: academic_position || null,
      phone: phone || null,
      is_active: false
    });

    // Notify all admins — fire-and-forget
    const admins = await User.findAll({ where: { role: 'admin', is_active: true }, attributes: ['email'] });
    if (admins.length > 0) {
      let departmentName = null;
      if (department_id) {
        const dept = await Department.findByPk(department_id, { attributes: ['name'] });
        departmentName = dept?.name || null;
      }
      emailService.sendNewUserRegistration(
        admins.map(a => a.email),
        { name: newUser.name, email: newUser.email, role: newUser.role, position: newUser.position, academic_position: newUser.academic_position },
        departmentName
      ).catch(err => console.error('[Email] sendNewUserRegistration failed:', err.message));
    }

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
    await user.save();
    res.json({ success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
  } catch (error) { next(error); }
};
