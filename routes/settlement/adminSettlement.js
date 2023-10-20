var express = require("express");
var router = express.Router();
var supabaseInstance = require("../../services/supabaseClient").supabase;

router.get("/getAllOutletPayment", async (req, res) => {
    const {startDate,endDate} = req.body
    try {
        const { data, error } = await supabaseInstance.rpc('get_all_outlet_order_payment',{start_date:startDate,end_date:endDate});

        if (data) {
            res.status(200).json({
                success: true,
                data: data
            });
        } else {
            throw error
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, error: error });
    }
});

router.post("/getOutletDashboard", async (req, res) => {
    const {outletId,startDate ,endDate } = req.body;
    try {
        const { data, error } = await supabaseInstance.rpc('get_single_outlet_order_dashboard',{outlet_id:outletId,start_date:startDate,end_date:endDate});

        if (data) {
            res.status(200).json({
                success: true,
                data: data
            });
        } else {
            throw error
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, error: error });
    }
});

router.post("/getOutletOrderDetails", async (req, res) => {
    const {outletId,startDate,endDate} = req.body;
    try {
        const { data, error } = await supabaseInstance.rpc('get_single_outlet_order_details',{outlet_id:outletId,start_date:startDate,end_date:endDate});

        if (data) {
            res.status(200).json({
                success: true,
                data: data
            });
        } else {
            throw error
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, error: error });
    }
});

router.post("/getOutletOrderDateWise", async (req, res) => {
    const {outletId,targateDate} = req.body;
    try {
        const { data, error } = await supabaseInstance.rpc('get_admin_outlet_order',{outlet_id:outletId,target_date:targateDate});

        if (data) {
            res.status(200).json({
                success: true,
                data: data
            });
        } else {
            throw error
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, error: error });
    }
});


module.exports = router;
