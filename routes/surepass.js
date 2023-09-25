var express = require("express");
var router = express.Router();
var surePassConfig = require("../configs/surepassConfig");
const { default: axios } = require("axios");

router.get("/", function (req, res, next) {
    res.send({ success: true, message: "respond send from surepass.js" });
});

router.post("/gstVerification", async (req, res) => {
    const { gstNumber } = req.body;
    try {
        const response = await axios.post(surePassConfig.config.surepass_gst_api, { "id_number": gstNumber, "filing_status_get": true }, {
            headers: { Authorization: `Bearer ${surePassConfig.config.TOKEN}` }
        })

        if (response?.data) {
            res.status(200).json({
                success: true,
                message: "GST Verfied succesfully",
                data: response.data,
            });
        } else {
            throw response.error
        }
    } catch (error) {
        console.log("error", error.response.data)
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post("/bankDetailsVerification", async (req, res) => {
    const { accountNo, IFSC_Code } = req.body;
    try {

        let postBody = {
            id_number: accountNo,
            ifsc: IFSC_Code,
        };
        const response = await axios.post(surePassConfig.config.surepass_bankdatails_api, postBody, {
            headers: { Authorization: `Bearer ${surePassConfig.config.TOKEN}` }
        })

        if (response?.data) {
            res.status(200).json({
                success: true,
                message: "BankDetails Verfied succesfully",
                data: response.data,
            });
        } else {
            throw response.error
        }
    } catch (error) {
        console.log("error", error.response.data)
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post("/panCardVerification", async (req, res) => {
    const { panCardNumber } = req.body;
    try {
        const response = await axios.post(surePassConfig.config.surepass_pancard_api, { "id_number": panCardNumber }, {
            headers: { Authorization: `Bearer ${surePassConfig.config.TOKEN}` }
        })

        if (response?.data) {
            res.status(200).json({
                success: true,
                message: "PanCard Verfied succesfully",
                data: response.data,
            });
        } else {
            throw response.error
        }
    } catch (error) {
        console.log("error", error.response.data)
        res.status(500).json({ success: false, error: error.message });
    }
});


module.exports = router;