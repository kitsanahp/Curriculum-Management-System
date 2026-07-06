/**
 * Error ที่พก HTTP status code มาด้วย
 *
 * ใช้ throw ใน service/helper แล้วปล่อยให้ controller catch → next(error)
 * errorMiddleware อ่าน `err.status` เพื่อตอบ status code ที่ถูกต้อง
 * (errorMiddleware รองรับ err.status อยู่แล้ว — ดู middlewares/errorMiddleware.js)
 *
 * เดิม controller เขียน `return res.status(404).json({...})` กระจายทุก handler
 * เปลี่ยนเป็น `throw new ApiError(404, 'ไม่พบหลักสูตร')` เพื่อรวม logic ไว้ใน service/helper ได้
 */
class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

module.exports = ApiError;
