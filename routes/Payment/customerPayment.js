var express = require("express");
var router = express.Router();
var easebuzzConfig = require("../../configs/easebuzzConfig").config;
var supabaseInstance = require("../../services/supabaseClient").supabase;


const axios = require('axios').default;
const { URLSearchParams } = require('url');
const SHA512 = require("crypto-js").SHA512;

router.get('/', (req, res, next) => {
    res.send({ success: true, message: "Response from payment/customerPayment.js" });
})

// console.log(new RegExp(/^[a-zA-Z0-9_\|\-\/]{1,40}$/).test(''))

router.post('/initiate-payment', async (req, res, next) => {

    const { amount, productinfo, firstname, phone, email, customerAuthUID, outletId } = req.body;

    const surl = `${req.protocol}://${req.get('host')}/payment/customer/success-payment`;
    const furl = `${req.protocol}://${req.get('host')}/payment/customer/failure-payment`;

    if (amount && productinfo && firstname && phone && email && customerAuthUID && outletId) {

        try {
            let encodedParams = new URLSearchParams();
            const transactionResponse = await supabaseInstance.from("Transaction").insert({ amount, productinfo, firstname, phone, email, customerAuthUID, outletId }).select("*").maybeSingle();

            if (transactionResponse?.data) {
                console.log("transactionResponse=>", transactionResponse);


                var hashstring = easebuzzConfig.key + "|" + transactionResponse?.data?.txnid + "|" + amount + "|" + productinfo + "|" + firstname + "|" + email + "|||||||||||" + easebuzzConfig.salt

                const _generateHash = generateHash(hashstring);
                // console.log("_generateHash => ", _generateHash);

                encodedParams.set('key', easebuzzConfig.key);
                encodedParams.set('txnid', transactionResponse?.data?.txnid);
                encodedParams.set('amount', amount);
                encodedParams.set('productinfo', productinfo);
                encodedParams.set('firstname', firstname);
                encodedParams.set('phone', phone);
                encodedParams.set('email', email);
                encodedParams.set('surl', surl);
                encodedParams.set('furl', furl);
                encodedParams.set('hash', _generateHash);
                encodedParams.set('udf1', '');
                encodedParams.set('udf2', '');
                encodedParams.set('udf3', '');
                encodedParams.set('udf4', '');
                encodedParams.set('udf5', '');
                encodedParams.set('udf6', '');
                encodedParams.set('udf7', '');
                encodedParams.set('address1', '');
                encodedParams.set('address2', '');
                encodedParams.set('city', '');
                encodedParams.set('state', '');
                encodedParams.set('country', '');
                encodedParams.set('zipcode', '');
                // encodedParams.set('show_payment_mode', '');
                // encodedParams.set('split_payments', '');
                // encodedParams.set('request_flow', '');
                // encodedParams.set('sub_merchant_id', '');
                // encodedParams.set('payment category', '');
                // encodedParams.set('account_no', '');

                // console.log(encodedParams);

                const options = {
                    method: 'POST',
                    url: `${easebuzzConfig.easebuzzBaseUrl}/payment/initiateLink`,
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        Accept: 'application/json'
                    },
                    data: encodedParams,
                };

                axios.request(options).then(async (initiateLinkResponse) => {
                    const transactionUpdateResponse = await supabaseInstance.from("Transaction").update({ initiateLink_post_body: encodedParamsToObject(encodedParams), initiateLink_response: initiateLinkResponse.data }).eq("txnid", transactionResponse?.data?.txnid).select('*').maybeSingle();
                    console.log("transactionUpdateResponse in then =>", transactionUpdateResponse);

                    res.status(200).json({ success: true, response: initiateLinkResponse?.data })
                }).catch(async (error) => {
                    console.error(error);
                    const transactionUpdateResponse = await supabaseInstance.from("Transaction").update({ initiateLink_post_body: encodedParamsToObject(encodedParams), initiateLink_error: error }).eq("txnid", transactionResponse?.data?.txnid).select('*').maybeSingle();
                    console.log("transactionUpdateResponse in error=>", transactionUpdateResponse)
                    res.status(200).json({ success: false, response: error })
                })
            } else {
                throw transactionResponse.error
            }
        } catch (error) {
            console.error("error => ", error);
            res.status(500).json({ success: false, error: error });
        }
    } else {
        res.status(500).json({ success: false, error: "Invalid Post Body" });
    }
})

router.post('/success-payment', (req, res, next) => {
    const postBody = req.body;
    const query = req.query;
    const params = req.params;

    console.log("s-postBody => ", postBody);
    console.log("s-query =>    ", query);
    console.log("s-params =>   ", params);

    res.send({ success: true, message: "Response from payment/customerPayment.js" });
})

router.post('/failure-payment', (req, res, next) => {
    const postBody = req.body;
    const query = req.query;
    const params = req.params;

    console.log("f-postBody => ", postBody);
    console.log("f-query =>    ", query);
    console.log("f-params =>   ", params);

    res.send({ success: true, message: "Response from payment/customerPayment.js" });
})

router.post('/request-refund', async (req, res, next) => {

    const { amount, refund_amount, phone, email,orderId } = req.body;


    if (amount && refund_amount && phone && email,orderId) {

        try {
            const orderResponse = await supabaseInstance.from("Order").select("*,customerAuthUID(*),outletId(*)").eq("orderId", orderId).maybeSingle();
    
            if (orderResponse?.data) {
                console.log("orderResponse=>", orderResponse);

                var hashstring = easebuzzConfig.key + "|" + orderResponse?.data?.txnid + "|" + amount + "|" + refund_amount + "|" + email + "|" + phone + "|||||||||||" + easebuzzConfig.salt

                const _generateHash = generateHash(hashstring);
                 console.log("_generateHash => ", _generateHash);
                // const options = {
                //     method: 'POST',
                //     url: `${easebuzzConfig.easebuzzBaseUrl}/transaction/v1/refund`,
                //     headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                //     data: {
                //         key: easebuzzConfig.key,
                //         txnid: orderResponse.data.txnid,
                //         refund_amount: refund_amount,
                //         phone: phone,
                //         email: email,
                //         amount: amount,
                //         hash: _generateHash
                //     }
                // };

                // axios.request(options).then(async (response) => {
                //     console.log("refund Response in then =>", response);
                //     res.status(200).json({ success: true, response: response?.data })
                // }).catch(async (error) => {
                //     console.error(error);
                //     console.log("resfund Response in error=>", response)
                //     res.status(200).json({ success: false, response: error })
                // })
            } else {
                throw orderResponse.error
            }
        } catch (error) {
            console.error("error => ", error);
            res.status(500).json({ success: false, error: error });
        }
    } else {
        res.status(500).json({ success: false, error: "Invalid Post Body" });
    }
})


module.exports = router;

const generateHash = (hashstring) => {
    return SHA512(hashstring).toString();
}

function encodedParamsToObject(encodedParams) {
    let obj = {};
    const ent = encodedParams.entries();
    // console.log("encodedParams.size => ", encodedParams.size);

    for (let index = 0; index < encodedParams.size; index++) {
        const element = ent.next();
        obj[element.value[0]] = element.value[1];
    }
    return { ...obj };
}