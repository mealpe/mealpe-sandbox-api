var express = require('express');
var router = express.Router();
var sendInBlueConfig = require("../configs/sendInBlueConfig");
const axios = require('axios');
var cryptoJs = require("crypto-js");

router.post("/sendOTP/:otpType", async (req, res) => {
    const { email, phoneNumber } = req.body;
    const { otpType } = req.params;
    //  const otpCode = generateOTP();
   let otpCode = generateOTP();
    try {
        if (otpType == "email") {
            otpCode = 123456;
            sendOTPEmail(email, otpCode).then(() => {
                const hash = cryptoJs.AES.encrypt(otpCode.toString(), "MealPE-OTP").toString();

                console.log("hash => ", hash);

                res.status(200).json({
                    success: true,
                    message: "OTP Send Successfully",
                    token: hash
                });
            }).catch(err => {
                console.log('.catch block ran: ', err);
                throw err;
            });
        } else if (otpType == "mobile") {
            otpCode = 123456;
            const hash = cryptoJs.AES.encrypt(otpCode.toString(), "MealPE-OTP").toString();
            sendOTPSMS(phoneNumber, otpCode).then(() => {
                res.status(200).json({
                    success: true,
                    message: "OTP Send Successfully",
                    token: hash
                });
            }).catch(err => {
                console.log('.catch block ran: ', err);
                throw err;
            });
        } else {
            res.status(500).json({
                success: false,
            });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error });
    }
});

router.post("/verifyOTP", async (req, res) => {
    const { otp, token } = req.body;
    try {
        const tokenData = cryptoJs.AES.decrypt(token, "MealPE-OTP").toString(cryptoJs.enc.Utf8);
        if (tokenData === otp) {
            res.status(200).json({
                success: true,
                message: "OTP Verify", 
            });
        }else{
            throw error;
        } 
    } catch (error) {
        res.status(500).json({ success: false, error: error });
    }
});

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000);
}

async function sendOTPEmail(email, otp) {
    const sendinblueConfig = {
        headers: {
            'api-key': sendInBlueConfig.config.auth_key,
            'content-type': 'application/json'
        }
    };
    const emailData = {
        sender: { email: sendInBlueConfig.config.senderEmail },
        to: [{ email }],
        subject: 'Your OTP Code',
        htmlContent: `Your OTP code is: <strong>${otp}</strong>. It will expire in 5 minutes.`,
        replyTo: { email: sendInBlueConfig.config.senderEmail }
    };
    try {
        const response = await axios.post('https://api.sendinblue.com/v3/smtp/email', emailData, sendinblueConfig);
        console.log('OTP email sent successfully:', response.data);
    } catch (error) {
        console.error('Error sending OTP email:', error);
    }
}

async function sendOTPSMS(phoneNumber, otp) {
    const sendinblueConfig = {
        headers: {
            'api-key': sendInBlueConfig.config.auth_key,
            'content-type': 'application/json'
        }
    };

    const smsData = {
        sender: sendInBlueConfig.config.senderName,
        recipient: phoneNumber,
        content: `Your OTP code is: ${otp}. It will expire in 5 minutes.`
    };

    try {
        const response = await axios.post('https://api.sendinblue.com/v3/smtp/email', smsData, sendinblueConfig);
        console.log('OTP SMS sent successfully:', response.data);
    } catch (error) {
        console.error('Error sending OTP SMS:', error);
    }
}

module.exports = router;
