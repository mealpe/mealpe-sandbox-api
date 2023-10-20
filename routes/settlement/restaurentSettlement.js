var express = require("express");
var router = express.Router();
var supabaseInstance = require("../../services/supabaseClient").supabase;

router.post("/getOrderSettlement", async (req, res) => {
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

router.post("/getOutletMiniDashboard", async (req, res) => {
    const {outletId,startDate,endDate} = req.body;
    try {
        const { data, error } = await supabaseInstance.rpc('get_outlet_order_dashboard',{outlet_id:outletId,start_date:startDate,end_date:endDate});

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