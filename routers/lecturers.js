const { Router } = require('express'),
router           = Router({mergeParams: true}),
middleware       = require('../middleware')
controller       = require('../controllers/lecturer.js');

router.get('/lecturers', middleware.isAdmin, (req, res) => {
    controller.readLecturers(req, res);
});

router.post('/lecturers', middleware.isAdmin, (req, res) => {
    controller.createLecturer(req, res);
});

router.get('/lecturers/:id', middleware.isAdminOrSpecificLecturer, (req, res) => {
    controller.readLecturer(req, res);
});

router.put('/lecturers/:id', middleware.isAdminOrSpecificLecturer, (req, res) => {
    controller.updateLecturer(req, res);
});

router.delete('/lecturers/:id', middleware.isAdminOrSpecificLecturer, (req, res) => {
    controller.deleteLecturer(req, res);
});

module.exports = router;