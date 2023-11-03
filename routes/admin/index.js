var express = require("express");
var router = express.Router();
const SHA512 = require("crypto-js").SHA512;

var adminRouter = require("./admin");
var mealpeBankLabelRouter = require("./mealpeBankLabel").router;

router.use('/', adminRouter);
router.use('/mealpeBankLabel', mealpeBankLabelRouter);

module.exports = router;