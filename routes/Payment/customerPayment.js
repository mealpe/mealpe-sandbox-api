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

    const {
        basePrice, //*base price
        productinfo,
        firstname,
        phone,
        email,
        customerAuthUID,
        outletId,
        isDineIn,
        isPickUp,
        isDelivery
    } = req.body;

    const surl = `${req.protocol}://${req.get('host')}/payment/customer/success-payment`;
    const furl = `${req.protocol}://${req.get('host')}/payment/customer/failure-payment`;

    if (basePrice && productinfo && firstname && phone && email && customerAuthUID && outletId) {

        try {
            const getPriceBreakdownResponse = await getPriceBreakdown(outletId, basePrice, isDineIn, isPickUp, isDelivery);
                if(getPriceBreakdownResponse && getPriceBreakdownResponse.outletBankLabel) {
                    //* -> getPriceBreakdownResponse = is breakdown
                    const transactionResponse = await supabaseInstance.from("Transaction")
                    .insert({ 
                        firstname,
                        phone, 
                        email, 
                        customerAuthUID, 
                        outletId,
                        amount: getPriceBreakdownResponse?.totalPriceForCustomer,
                        basePrice,
                        mealpeVendorAmount:getPriceBreakdownResponse?.mealpeVendorAmount,
                        outletVendorAmount: getPriceBreakdownResponse?.outletVendorAmount,
                        foodGST:getPriceBreakdownResponse?.foodGST,
                        convenienceAmount: getPriceBreakdownResponse?.convenienceAmount,
                        convenienceGSTAmount:getPriceBreakdownResponse?.convenienceGSTAmount,
                        convenienceTotalAmount:getPriceBreakdownResponse?.convenienceTotalAmount,
                        commissionAmount:getPriceBreakdownResponse?.commissionAmount,
                        commissionGSTAmount:getPriceBreakdownResponse?.commissionGSTAmount,
                        commissionTotalAmount:getPriceBreakdownResponse?.commissionTotalAmount,
                        packagingCharge:getPriceBreakdownResponse?.packagingCharge
                    }).select("*").maybeSingle();
                    if (transactionResponse?.data) {
                        console.log("transactionResponse=>", transactionResponse);

                        var hashstring = easebuzzConfig.key + "|" + transactionResponse?.data?.txnid + "|" + getPriceBreakdownResponse?.totalPriceForCustomer + "|" + productinfo + "|" + firstname + "|" + email + "|||||||||||" + easebuzzConfig.salt
        
                        const _generateHash = generateHash(hashstring);
                        let postBody ={
                            'key': easebuzzConfig.key,
                            'txnid': transactionResponse?.data?.txnid,
                            'amount': getPriceBreakdownResponse?.totalPriceForCustomer,
                            'productinfo': productinfo,
                            'firstname': firstname,
                            'phone': phone,
                            'email': email,
                            'surl': surl,
                            'furl': furl,
                            'hash': _generateHash,
                            'udf1': '',
                            'udf2': '',
                            'udf3': '',
                            'udf4': '',
                            'udf5': '',
                            'udf6': '',
                            'udf7': '',
                            'address1': '',
                            'address2': '',
                            'city': '',
                            'state': '',
                            'country': '',
                            'zipcode': '',
                            // 'show_payment_mode': '',
                            // 'request_flow': '',
                            // 'sub_merchant_id': '',
                            // 'payment :ategory', '',
                            // 'account_no': '',
                        }
                        if (getPriceBreakdownResponse?.outletBankLabel && easebuzzConfig.mealpe_bank_label && (getPriceBreakdownResponse?.mealpeVendorAmount > 0) && (getPriceBreakdownResponse?.outletVendorAmount > 0)) {
                            postBody.split_payments = {
                                [easebuzzConfig.mealpe_bank_label] : getPriceBreakdownResponse?.mealpeVendorAmount,
                                [getPriceBreakdownResponse.outletBankLabel]: getPriceBreakdownResponse?.outletVendorAmount
                            }
                            postBody.split_payments = JSON.stringify(postBody.split_payments);
                        }
        
                        // console.log(encodedParams);
        
                        const options = {
                            method: 'POST',
                            url: `${easebuzzConfig.easebuzzBaseUrl}/payment/initiateLink`,
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded',
                                Accept: 'application/json'
                            },
                            data: postBody,
                        };
                                                
                        // const encodedParamsbj = encodedParams?.toString()?.split("&")?.map(m => m?.split("="))?.reduce((a, v) => ({ ...a, [v[0]]: decodeURIComponent(v[1])}), {}) ;
                        await axios.request(options).then(async (initiateLinkResponse) => {
                            const transactionUpdateResponse = await supabaseInstance.from("Transaction").update({ initiateLink_post_body: postBody, initiateLink_response: initiateLinkResponse.data }).eq("txnid", transactionResponse?.data?.txnid).select('*').maybeSingle();
                            console.log("transactionUpdateResponse in then =>", transactionUpdateResponse);
        
                            if (transactionUpdateResponse?.data) {
                                res.status(200).json({ success: true, response: initiateLinkResponse?.data });
                            } else {
                                res.status(500).json({ success: false, response: transactionUpdateResponse.error.message });
                            }
                        }).catch(async (error) => {
                            console.error(error);
                            const transactionUpdateResponse = await supabaseInstance.from("Transaction").update({ initiateLink_post_body:postBody, initiateLink_error: error }).eq("txnid", transactionResponse?.data?.txnid).select('*').maybeSingle();
                            console.log("transactionUpdateResponse in error=>", transactionUpdateResponse)
                            res.status(500).json({ success: false, response: error });
                        })
                    } else {
                        throw transactionResponse.error
                    }
                } else if(!getPriceBreakdownResponse.outletBankLabel) {
                    res.status(500).json({ success: false, error: "Bank field not found." });
                } else {
                    throw getPriceBreakdownResponse?.error || getPriceBreakdownResponse;
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


router.get('/success-payment', (req, res, next) => {
    const postBody = req.body;
    const query = req.query;
    const params = req.params;

    console.log("s-get-postBody => ", postBody);
    console.log("s-get-query =>    ", query);
    console.log("s-get-params =>   ", params);

    res.send({ success: true, message: "Response from payment/customerPayment.js" });
})

router.get('/failure-payment', (req, res, next) => {
    const postBody = req.body;
    const query = req.query;
    const params = req.params;

    console.log("f-get-postBody => ", postBody);
    console.log("f-get-query =>    ", query);
    console.log("f-get-params =>   ", params);

    res.send({ success: true, message: "Response from payment/customerPayment.js" });
})

// router.post('/request-refund', async (req, res, next) => {

//     const { amount, refund_amount, phone, email,orderId } = req.body;


//     if (amount && refund_amount && phone && email,orderId) {

//         try {
//             const orderResponse = await supabaseInstance.from("Order").select("*,customerAuthUID(*),outletId(*)").eq("orderId", orderId).maybeSingle();
    
//             if (orderResponse?.data) {
//                 console.log("orderResponse=>", orderResponse);

//                 var hashstring = easebuzzConfig.key + "|" + orderResponse?.data?.txnid + "|" + amount + "|" + refund_amount + "|" + email + "|" + phone + "|||||||||||" + easebuzzConfig.salt

//                 const _generateHash = generateHash(hashstring);
//                  console.log("_generateHash => ", _generateHash);
//                 // const options = {
//                 //     method: 'POST',
//                 //     url: `${easebuzzConfig.easebuzzBaseUrl}/transaction/v1/refund`,
//                 //     headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
//                 //     data: {
//                 //         key: easebuzzConfig.key,
//                 //         txnid: orderResponse.data.txnid,
//                 //         refund_amount: refund_amount,
//                 //         phone: phone,
//                 //         email: email,
//                 //         amount: amount,
//                 //         hash: _generateHash
//                 //     }
//                 // };

//                 // axios.request(options).then(async (response) => {
//                 //     console.log("refund Response in then =>", response);
//                 //     res.status(200).json({ success: true, response: response?.data })
//                 // }).catch(async (error) => {
//                 //     console.error(error);
//                 //     console.log("resfund Response in error=>", response)
//                 //     res.status(200).json({ success: false, response: error })
//                 // })
//             } else {
//                 throw orderResponse.error
//             }
//         } catch (error) {
//             console.error("error => ", error);
//             res.status(500).json({ success: false, error: error });
//         }
//     } else {
//         res.status(500).json({ success: false, error: "Invalid Post Body" });
//     }
// })

router.post('/request-refund', async (req, res, next) => {
    const { orderId } = req.body;
    try {
        const requestRefundResponse = await requestRefund(orderId);
        console.log("requestRefundResponse => ", requestRefundResponse);
        res.status(200).json({ success: true, ...requestRefundResponse });
    } catch (error) {
        res.status(500).json({ success: false, error: error });
    }
})

router.post('/get-price-breakdown', async (req, res, next) => {
    const {outletId, basePrice, isDineIn, isPickUp, isDelivery} = req.body;
    
    try {
        const getPriceBreakdownResponse = await getPriceBreakdown(outletId, basePrice, isDineIn, isPickUp, isDelivery);
        console.log("getPriceBreakdownResponse => ", getPriceBreakdownResponse);

        res.status(200).json({ success: true,  ...getPriceBreakdownResponse});
    } catch (error) {
        res.status(500).json({ success: false, error: error });
    }
})

router.post('/initiate-payment-with-order', async (req, res, next) => {

    const {
        basePrice, //*base price
        productinfo,
        firstname,
        phone,
        email,
        customerAuthUID,
        outletId,
        orderObject
    } = req.body;

    const surl = `${req.protocol}://${req.get('host')}/payment/customer/success-payment`;
    const furl = `${req.protocol}://${req.get('host')}/payment/customer/failure-payment`;

    if (basePrice && productinfo && firstname && phone && email && customerAuthUID && outletId && orderObject) {

        try {
            let encodedParams = new URLSearchParams();

            const getPriceBreakdownResponse = await getPriceBreakdown(outletId, basePrice);
            if (getPriceBreakdownResponse && getPriceBreakdownResponse.outletBankLabel) {
                //* -> getPriceBreakdownResponse = is breakdown
                const transactionResponse = await supabaseInstance.from("Transaction")
                    .insert({
                        firstname,
                        phone,
                        email,
                        customerAuthUID,
                        outletId,
                        amount: getPriceBreakdownResponse?.totalPriceForCustomer,
                        basePrice,
                        mealpeVendorAmount: getPriceBreakdownResponse?.mealpeVendorAmount,
                        outletVendorAmount: getPriceBreakdownResponse?.outletVendorAmount,
                        foodGST: getPriceBreakdownResponse?.foodGST,
                        convenienceAmount: getPriceBreakdownResponse?.convenienceAmount,
                        convenienceGSTAmount: getPriceBreakdownResponse?.convenienceGSTAmount,
                        convenienceTotalAmount: getPriceBreakdownResponse?.convenienceTotalAmount,
                        commissionAmount: getPriceBreakdownResponse?.commissionAmount,
                        commissionGSTAmount: getPriceBreakdownResponse?.commissionGSTAmount,
                        commissionTotalAmount: getPriceBreakdownResponse?.commissionTotalAmount,
                        packagingCharge: getPriceBreakdownResponse?.packagingCharge,
                        orderPostBody: orderObject || null
                    }).select("*").maybeSingle();
                if (transactionResponse?.data) {
                    console.log("transactionResponse=>", transactionResponse);

                    var hashstring = easebuzzConfig.key + "|" + transactionResponse?.data?.txnid + "|" + getPriceBreakdownResponse?.totalPriceForCustomer + "|" + productinfo + "|" + firstname + "|" + email + "|||||||||||" + easebuzzConfig.salt

                    const _generateHash = generateHash(hashstring);
                    // console.log("_generateHash => ", _generateHash);

                    // encodedParams.set('key', easebuzzConfig.key);
                    // encodedParams.set('txnid', transactionResponse?.data?.txnid);
                    // encodedParams.set('amount', basePrice);
                    // encodedParams.set('productinfo', productinfo);
                    // encodedParams.set('firstname', firstname);
                    // encodedParams.set('phone', phone);
                    // encodedParams.set('email', email);
                    // encodedParams.set('surl', surl);
                    // encodedParams.set('furl', furl);
                    // encodedParams.set('hash', _generateHash);
                    // encodedParams.set('udf1', '');
                    // encodedParams.set('udf2', '');
                    // encodedParams.set('udf3', '');
                    // encodedParams.set('udf4', '');
                    // encodedParams.set('udf5', '');
                    // encodedParams.set('udf6', '');
                    // encodedParams.set('udf7', '');
                    // encodedParams.set('address1', '');
                    // encodedParams.set('address2', '');
                    // encodedParams.set('city', '');
                    // encodedParams.set('state', '');
                    // encodedParams.set('country', '');
                    // encodedParams.set('zipcode', '');
                    // encodedParams.set('show_payment_mode', '');
                    // if (getPriceBreakdownResponse?.outletBankLabel) {
                    //     encodedParams.set('split_payments', {[easebuzzConfig.mealpe_bank_label] : getPriceBreakdownResponse?.mealpeVendorAmount, [getPriceBreakdownResponse.outletBankLabel]: getPriceBreakdownResponse?.outletVendorAmount});
                    // }
                    // encodedParams.set('request_flow', '');
                    // encodedParams.set('sub_merchant_id', '');
                    // encodedParams.set('payment category', '');
                    // encodedParams.set('account_no', '');

                    let postBody = {
                        'key': easebuzzConfig.key,
                        'txnid': transactionResponse?.data?.txnid,
                        'amount': getPriceBreakdownResponse?.totalPriceForCustomer,
                        'productinfo': productinfo,
                        'firstname': firstname,
                        'phone': phone,
                        'email': email,
                        'surl': surl,
                        'furl': furl,
                        'hash': _generateHash,
                        'udf1': '',
                        'udf2': '',
                        'udf3': '',
                        'udf4': '',
                        'udf5': '',
                        'udf6': '',
                        'udf7': '',
                        'address1': '',
                        'address2': '',
                        'city': '',
                        'state': '',
                        'country': '',
                        'zipcode': '',
                        // 'show_payment_mode': '',
                        // 'request_flow': '',
                        // 'sub_merchant_id': '',
                        // 'payment :ategory', '',
                        // 'account_no': '',
                    }
                    if (getPriceBreakdownResponse?.outletBankLabel && easebuzzConfig.mealpe_bank_label && (getPriceBreakdownResponse?.mealpeVendorAmount > 0) && (getPriceBreakdownResponse?.outletVendorAmount > 0)) {
                        postBody.split_payments = {
                            [easebuzzConfig.mealpe_bank_label]: getPriceBreakdownResponse?.mealpeVendorAmount,
                            [getPriceBreakdownResponse.outletBankLabel]: getPriceBreakdownResponse?.outletVendorAmount
                        }
                    }

                    // console.log(encodedParams);

                    const options = {
                        method: 'POST',
                        url: `${easebuzzConfig.easebuzzBaseUrl}/payment/initiateLink`,
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            Accept: 'application/json'
                        },
                        data: postBody,
                    };

                    // const encodedParamsbj = encodedParams?.toString()?.split("&")?.map(m => m?.split("="))?.reduce((a, v) => ({ ...a, [v[0]]: decodeURIComponent(v[1])}), {}) ;
                    await axios.request(options).then(async (initiateLinkResponse) => {
                        const transactionUpdateResponse = await supabaseInstance.from("Transaction").update({ initiateLink_post_body: postBody, initiateLink_response: initiateLinkResponse.data }).eq("txnid", transactionResponse?.data?.txnid).select('*').maybeSingle();
                        console.log("transactionUpdateResponse in then =>", transactionUpdateResponse);

                        if (transactionUpdateResponse?.data) {
                            res.status(200).json({ success: true, response: initiateLinkResponse?.data });
                        } else {
                            res.status(500).json({ success: false, response: transactionUpdateResponse.error.message });
                        }
                    }).catch(async (error) => {
                        console.error(error);
                        const transactionUpdateResponse = await supabaseInstance.from("Transaction").update({ initiateLink_post_body: postBody, initiateLink_error: error }).eq("txnid", transactionResponse?.data?.txnid).select('*').maybeSingle();
                        console.log("transactionUpdateResponse in error=>", transactionUpdateResponse)
                        res.status(500).json({ success: false, response: error });
                    })
                } else {
                    throw transactionResponse.error
                }
            } else if (!getPriceBreakdownResponse.outletBankLabel) {
                res.status(500).json({ success: false, error: "Bank field not found." });
            } else {
                throw getPriceBreakdownResponse?.error || getPriceBreakdownResponse;
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

function getPriceBreakdown(outletId, basePrice, isDineIn=false, isPickUp=false, isDelivery=false) {
    basePrice = +basePrice;
    return new Promise(async (resolve, reject) => {
        if (outletId && basePrice) {
            try {
                const outletResponse = await supabaseInstance.from("Outlet").select('*').eq("outletId", outletId).maybeSingle();
                if (outletResponse?.data) {
                    const outletData = outletResponse?.data;

                    let packagingCharge = 0;
                    if (isPickUp === true || isDelivery === true) {
                        packagingCharge = outletData.packaging_charge;
                        basePrice = basePrice + packagingCharge;
                    }

                    let foodGST = 0;
                    if (outletResponse?.data?.isGSTShow) {
                        foodGST = (5 * basePrice) / 100;
                    } else {
                        //todo calculate basePrice and foodGST
                        foodGST = (5 * basePrice) / 100;
                        basePrice = basePrice - foodGST;
                    }

                    const convenienceAmount = (outletData?.convenienceFee * basePrice) / 100;
                    const convenienceGSTAmount = (18 * convenienceAmount) / 100;
                    const convenienceTotalAmount = convenienceAmount + convenienceGSTAmount;

                    //* total amount customer pay to mealpe
                    const totalPriceForCustomer = Number(Number(Math.round(basePrice + foodGST + convenienceTotalAmount))?.toFixed(2));

                    const commissionAmount = (outletData?.commissionFee * basePrice) / 100;
                    const commissionGSTAmount =  (18 * commissionAmount) / 100;
                    const commissionTotalAmount =  commissionAmount + commissionGSTAmount;

                    // const outletVendorAmount = Number((totalPriceForCustomer - commissionTotalAmount)?.toFixed(2));
                    const outletVendorAmount = Number((basePrice - commissionTotalAmount)?.toFixed(2));
                    
                    const mealpeVendorAmount = Number((totalPriceForCustomer - outletVendorAmount)?.toFixed(2));
                    const outletBankLabel = outletData?.bankLabel || null;

                    resolve({
                        success: true,

                        basePrice,
                        foodGST,    
                        convenienceAmount,
                        convenienceGSTAmount,
                        convenienceTotalAmount,
                        totalPriceForCustomer,
                        commissionAmount,
                        commissionGSTAmount,
                        commissionTotalAmount,
                        mealpeVendorAmount,
                        outletVendorAmount,
                        packagingCharge,

                        outletBankLabel
                    })

                } else {
                    reject({success: false, message: "Outlet id is wrong."});
                }
            } catch (error) {
                console.log(error);
                reject({success: false, error: error});
            }
        } else {
            reject({success: false, message: "Please provide valid values."});
        }
    })
}

function requestRefund(orderId) {
    return new Promise(async (resolve, reject) => {
        try {

            const orderResponse = await supabaseInstance.from("Order").select("*,customerAuthUID(*),outletId(*)").eq("orderId", orderId).maybeSingle();

            if (orderResponse?.data) {

                const refundResponse = await supabaseInstance.from('Refund').insert({ txnid: orderResponse.data.txnid, customerAuthUID: orderResponse.data.customerAuthUID.customerAuthUID, orderId }).select("*").maybeSingle();
                var hashstring = easebuzzConfig.key + "|" + orderResponse?.data?.txnid + "|" + orderResponse?.data?.totalPrice + "|" + parseInt(Number(orderResponse.data.totalPrice)) + "|" + orderResponse?.data?.customerAuthUID?.email + "|" + orderResponse?.data?.customerAuthUID?.mobile + "|" + easebuzzConfig.salt

                const _generateHash = generateHash(hashstring);
                console.log("_generateHash => ", _generateHash);
                const options = {
                    method: 'POST',
                    url: `${easebuzzConfig.easebuzzBaseUrl}/transaction/v1/refund`,
                    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                    data: {
                        key: easebuzzConfig.key,
                        txnid: orderResponse.data.txnid,
                        refund_amount: parseInt(Number(orderResponse.data.totalPrice)),
                        phone: orderResponse.data.customerAuthUID.mobile + "",
                        email: orderResponse.data.customerAuthUID.email,
                        amount: orderResponse.data.totalPrice,
                        hash: _generateHash
                    }
                };

                axios.post(options.url, options.data, { headers: options.headers }).then(async (response) => {
                    const refundUpdateResponse = await supabaseInstance.from('Refund').update({ refund_post_body: options?.data, refund_response: response?.data }).eq("refundId", refundResponse?.data?.refundId).select("*").maybeSingle();
                    console.log("refund Response in then =>", response.data);
                    resolve({ success: true, response: response?.data })
                }).catch(async (error) => {
                    const refundUpdateResponse = await supabaseInstance.from('Refund').update({ refund_post_body: options?.data, refund_error: error }).eq("refundId", refundResponse?.data?.refundId).select("*").maybeSingle();
                    console.error("Error => ", error?.response?.data?.additional?.validation || error?.response || error);
                    resolve({ success: false, response: error?.response?.data || error?.response || error })
                })
            } else {
                throw orderResponse.error
            }

        } catch (error) {
            resolve({
                success: false,
                error: error?.message || error
            })
        }
    })
};