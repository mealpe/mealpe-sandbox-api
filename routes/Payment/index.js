var express = require("express");
var router = express.Router();
const SHA512 = require("crypto-js").SHA512;

var customerPaymentRouter = require("./customerPayment");

router.use('/customer', customerPaymentRouter);


router.get('/', (req, res, next) => {
    res.send({ success: true, message: "Response from payment/index.js" });
})

module.exports = router;