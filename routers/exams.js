const { isLoggedIn } = require('../middleware');

const { Router } = require('express'),
router           = Router(),
controller       = require('../controllers/exam'),
middleware       = require('../middleware');

router.get('/', middleware.isLoggedIn, (req, res) => {
    controller.readExams(req, res);
});

router.get('/:id', middleware.isLoggedIn, (req, res) => {
    controller.readExam(req, res);
});

router.post('/', middleware.isAdmin, (req, res) => {
    controller.createExam(req, res);
});

router.put('/:id', middleware.isAdminOrLecturer, (req, res) => {
    controller.updateExam(req, res);
});

router.delete('/:id', middleware.isAdminOrLecturer, (req, res) => {
    controller.deleteExam(req, res);
});

router.delete('/', middleware.isAdmin, (req, res) => {
    controller.deleteExams(req, res);
});

module.exports = router;