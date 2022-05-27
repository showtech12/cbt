const { Router } = require('express'),
router           = Router({mergeParams: true}),
controller       = require('../controllers/question'),
middleware       = require('../middleware');

router.get('/questions', middleware.isLoggedIn, (req, res) => {
    controller.readQuestions(req, res);
});

router.post('/questions', middleware.isAdminOrLecturer, (req, res) => {
    controller.createQuestion(req, res);
});

router.delete('/questions', middleware.isAdminOrLecturer, (req, res) => {
    controller.deleteQuestions(req, res);
});

router.get('/questions/:id', (req, res) => {
    controller.readQuestion(req, res);
});

router.put('/questions/:id', middleware.isAdminOrLecturer, (req, res) => {
    controller.updateQuestion(req, res);
});

router.delete('/questions/:id', middleware.isAdminOrLecturer, (req, res) => {
    controller.deleteQuestion(req, res);
});

router.post('/questions/batch', middleware.isAdminOrLecturer, (req, res) => {
    controller.createQuestions(req, res);
});

module.exports = router;