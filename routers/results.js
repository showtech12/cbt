const { Router } = require('express'),
router           = Router({mergeParams: true}),
controller       = require('../controllers/result'),
middleware       = require('../middleware');

router.get('/results', middleware.isAdminOrLecturer, (req, res) => {
    controller.readResults(req, res);
});

router.post('/results', middleware.isStudent, (req, res) => {
    controller.createResult(req, res);
});

router.get('/results/:id', middleware.isAdminOrLecturer, (req, res) => {
    controller.readResult(req, res);
});

module.exports = router;