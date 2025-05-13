const Contact = require('../models/contactModel');
const mailer = require('../utils/mailer');

const ContactController = {
    // Xử lý yêu cầu liên hệ mới
    createContact: async (req, res) => {
        try {
            const { ten, email, so_dien_thoai, tieu_de, noi_dung } = req.body;

            // Validate dữ liệu
            if (!ten || !email || !so_dien_thoai || !tieu_de || !noi_dung) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng điền đầy đủ thông tin'
                });
            }

            // Kiểm tra định dạng email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    message: 'Email không hợp lệ'
                });
            }

            // Kiểm tra định dạng số điện thoại
            const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
            if (!phoneRegex.test(so_dien_thoai)) {
                return res.status(400).json({
                    success: false,
                    message: 'Số điện thoại không hợp lệ'
                });
            }

            // Create contact with correct field names
            const result = await Contact.create({
                name: ten,
                email: email,
                phone: so_dien_thoai,
                subject: tieu_de,
                message: noi_dung
            });

            // Gửi email xác nhận
            await mailer.sendEmail(
                email,
                'Xác nhận yêu cầu tư vấn - TKĐK Car Rental',
                `
                    <h2>Xin chào ${ten},</h2>
                    <p>Cảm ơn bạn đã gửi yêu cầu tư vấn đến TKĐK Car Rental.</p>
                    <p>Chúng tôi đã nhận được yêu cầu của bạn và sẽ liên hệ lại trong thời gian sớm nhất.</p>
                    <p>Trân trọng,</p>
                    <p>TKĐK Car Rental</p>
                `
            );

            return res.status(200).json({
                success: true,
                message: 'Gửi yêu cầu thành công'
            });
        } catch (error) {
            console.error('Lỗi khi tạo yêu cầu liên hệ:', error);
            return res.status(500).json({
                success: false,
                message: 'Đã có lỗi xảy ra, vui lòng thử lại sau'
            });
        }
    },

    // Lấy danh sách tất cả yêu cầu liên hệ (cho admin)
    getAllContacts: async (req, res) => {
        try {
            const contacts = await Contact.findAll();
            return res.status(200).json(contacts);
        } catch (error) {
            console.error('Lỗi khi lấy danh sách liên hệ:', error);
            return res.status(500).json({
                success: false,
                message: 'Đã có lỗi xảy ra, vui lòng thử lại sau'
            });
        }
    },

    // Cập nhật trạng thái yêu cầu liên hệ
    updateContactStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;

            const success = await Contact.updateStatus(id, status);
            if (!success) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy yêu cầu liên hệ'
                });
            }

            const updatedContact = await Contact.findById(id);
            return res.status(200).json({
                success: true,
                message: 'Cập nhật trạng thái thành công',
                data: updatedContact
            });
        } catch (error) {
            console.error('Lỗi khi cập nhật trạng thái:', error);
            return res.status(500).json({
                success: false,
                message: 'Đã có lỗi xảy ra, vui lòng thử lại sau'
            });
        }
    }
};

module.exports = ContactController;
