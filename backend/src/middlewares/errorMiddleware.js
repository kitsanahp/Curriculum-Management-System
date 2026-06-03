const errorMiddleware = (err, req, res, next) => {
  console.error(err.stack);

  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: 'ข้อมูลไม่ถูกต้อง',
      errors: err.errors.map((e) => e.message)
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({ success: false, message: 'ข้อมูลนี้มีอยู่ในระบบแล้ว' });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'ไฟล์มีขนาดใหญ่เกินไป' });
  }

  const isProd = process.env.NODE_ENV === 'production';
  res.status(err.status || 500).json({
    success: false,
    message: isProd && !err.status ? 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' : (err.message || 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์')
  });
};

module.exports = errorMiddleware;
