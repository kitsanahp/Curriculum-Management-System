const jwt  = require('jsonwebtoken');
const { User } = require('../models');

// ตรวจสอบ JWT token และ attach ข้อมูล user ลง req.user
// อ่าน role จาก DB ทุก request — ไม่เชื่อ role ใน token เพื่อความปลอดภัย
const authenticate = async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (req.cookies?.token) {
    // httpOnly cookie — ช่องทางหลัก (ปลอดภัยสุด)
    token = req.cookies.token;
  } else if (authHeader && authHeader.startsWith('Bearer ')) {
    // Bearer header — fallback สำหรับ API client / mobile
    token = authHeader.split(' ')[1];
  }
  // หมายเหตุ: เลิกรับ token ผ่าน ?token= ใน query string แล้ว
  // เพราะ JWT จะรั่วเข้า access log / browser history / Referer header
  // การดาวน์โหลดไฟล์ใช้ httpOnly cookie (ส่งอัตโนมัติแบบ same-origin) แทน

  if (!token) {
    return res.status(401).json({ success: false, message: 'ไม่มี Token กรุณาเข้าสู่ระบบ' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // ดึงข้อมูลล่าสุดจาก DB เพื่อตรวจสอบสถานะและ Role จริงๆ (ไม่เชื่อ Token)
    // email/name จำเป็นต่อ permission ของ faculty (ตรวจสิทธิ์จาก team.email) และใช้แสดงผล
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'role', 'department_id', 'is_active', 'email', 'name', 'created_at', 'token_version']
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'ไม่พบผู้ใช้งานในระบบ' });
    }

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'บัญชีนี้ถูกปิดใช้งาน' });
    }

    // เพิกถอน token: ถ้า tv ใน token ไม่ตรงกับใน DB แสดงว่าถูก logout/เปลี่ยนรหัสไปแล้ว → token นี้ตาย
    // (token รุ่นเก่าก่อนมี feature นี้จะไม่มี tv → treat เป็นไม่ตรง บังคับ login ใหม่ครั้งเดียว)
    if (decoded.tv !== user.token_version) {
      return res.status(401).json({ success: false, message: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่' });
    }

    // Attach ข้อมูลที่สดใหม่จาก DB ลงใน req.user
    req.user = {
      id: user.id,
      role: user.role,
      department_id: user.department_id,
      email: user.email,
      name: user.name,
      created_at: user.created_at
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token หมดอายุหรือไม่ถูกต้อง' });
  }
};

// ตรวจสอบสิทธิ์ตาม role — ใช้เป็น middleware chain เช่น authorize('admin', 'faculty')
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์ในการดำเนินการนี้' });
  }
  next();
};

module.exports = { authenticate, authorize };
