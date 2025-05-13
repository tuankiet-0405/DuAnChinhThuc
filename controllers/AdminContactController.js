const Contact = require('../models/contactModel');

const AdminContactController = {
    // Lấy danh sách tất cả yêu cầu liên hệ
    getAllContacts: async (req, res) => {
        try {
            console.log('Admin Controller: Getting all contacts');
            console.log('Admin user:', req.user);
            
            // Double check admin rights here for extra security
            if (!req.user || req.user.loai_tai_khoan !== 'admin') {
                console.log('Rejected: User is not admin', req.user);
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có quyền truy cập chức năng này'
                });
            }
            
            const contacts = await Contact.findAll();
            console.log(`Found ${contacts.length} contacts`);
            return res.status(200).json(contacts);
        } catch (error) {
            console.error('Lỗi khi lấy danh sách liên hệ (admin):', error);
            return res.status(500).json({
                success: false,
                message: 'Đã có lỗi xảy ra, vui lòng thử lại sau'
            });
        }
    },

    // Lấy chi tiết một yêu cầu liên hệ
    getContactById: async (req, res) => {
        try {
            console.log('Admin Controller: Getting contact by ID', req.params.id);
            
            // Double check admin rights here for extra security
            if (!req.user || req.user.loai_tai_khoan !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có quyền truy cập chức năng này'
                });
            }
            
            const contact = await Contact.findById(req.params.id);
            if (!contact) {
                return res.status(404).json({ 
                    success: false,
                    message: 'Không tìm thấy liên hệ' 
                });
            }
            return res.status(200).json(contact);
        } catch (error) {
            console.error('Lỗi khi lấy thông tin liên hệ (admin):', error);
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
            
            console.log(`Admin Controller: Updating contact ${id} status to ${status}`);
            
            // Double check admin rights here for extra security
            if (!req.user || req.user.loai_tai_khoan !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có quyền truy cập chức năng này'
                });
            }

            // Validate status
            if (!['new', 'completed'].includes(status)) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Trạng thái không hợp lệ' 
                });
            }

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
            console.error('Lỗi khi cập nhật trạng thái liên hệ (admin):', error);
            return res.status(500).json({
                success: false,
                message: 'Đã có lỗi xảy ra, vui lòng thử lại sau'
            });
        }
    },

    // Gửi phản hồi cho yêu cầu liên hệ
    respondToContact: async (req, res) => {
        try {
            const { id } = req.params;
            const { response } = req.body;
            
            console.log(`Admin Controller: Responding to contact ${id}`);
            
            // Double check admin rights here for extra security
            if (!req.user || req.user.loai_tai_khoan !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có quyền truy cập chức năng này'
                });
            }

            // Validate required fields
            if (!response) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Nội dung phản hồi không được để trống' 
                });
            }

            // Update contact with response and mark as completed
            const success = await Contact.respond(id, {
                phan_hoi: response,
                xu_ly_boi: req.user.email || req.user.id,
                thoi_gian_xu_ly: new Date(),
                status: 'completed'
            });
            
            if (!success) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy yêu cầu liên hệ'
                });
            }

            const updatedContact = await Contact.findById(id);
            return res.status(200).json({
                success: true,
                message: 'Gửi phản hồi thành công',
                data: updatedContact
            });
        } catch (error) {
            console.error('Lỗi khi gửi phản hồi liên hệ (admin):', error);
            return res.status(500).json({
                success: false,
                message: 'Đã có lỗi xảy ra, vui lòng thử lại sau'
            });
        }
    }
};

module.exports = AdminContactController;
