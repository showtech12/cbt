const { Router } = require('express'),
router           = Router({mergeParams: true}),
controller       = require('../controllers/student'),
middleware       = require('../middleware');

router.get('/students', middleware.isAdminOrLecturer, (req, res) => {
    controller.readStudents(req, res);
});

router.post('/students', middleware.isAdminOrLecturer, (req, res) => {
    controller.createStudent(req, res);
});

router.delete('/students', middleware.isAdminOrLecturer, (req, res) => {
    controller.deleteStudents(req, res);
});

router.get('/students/:id', middleware.isAdminOrLecturer, (req, res) => {
    controller.readStudent(req, res);
});

router.put('/students/:id', middleware.isAdminOrLecturer, (req, res) => {
    controller.updateStudent(req, res);
});

router.delete('/students/:id', middleware.isAdminOrLecturer, (req, res) => {
    controller.deleteStudent(req, res);
});

router.post('/students/batch', middleware.isAdminOrLecturer, (req, res) => {
    controller.createStudents(req, res);
});

module.exports = router;