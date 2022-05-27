const { Router } = require("express"),
router           = Router(),
middleware       = require('../middleware'),
controller       = require('../controllers');

router.post('/student/login', (req, res) => {
    controller.logStudentIn(req, res);
});

router.post('/admin/login', (req, res) => {
    controller.logAdminIn(req, res);
});

router.post('/lecturer/login', (req, res) => {
    controller.logLecturerIn(req, res);
});

router.get('/logout', middleware.isLoggedIn, (req, res) => {
    controller.logOut(req, res)
});

module.exports = router;