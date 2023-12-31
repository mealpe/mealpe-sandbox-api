var express = require("express");
var router = express.Router();
var supabaseInstance = require("../../services/supabaseClient").supabase;

router.post("/getAllOutletPayment", async (req, res) => {
    const { startDate, endDate, searchText } = req.body;
    try {
        let query = supabaseInstance.rpc('get_all_outlet_order_payment', { start_date: startDate, end_date: endDate });

        if (searchText) {
            query = query.ilike('outletname', `%${searchText}%`)
        }

        const { data, error } = await query;

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
    const { outletId, startDate, endDate } = req.body;
    try {
        const { data, error } = await supabaseInstance.rpc('get_single_outlet_order_dashboard', { outlet_id: outletId, start_date: startDate, end_date: endDate });

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
    const { outletId, startDate, endDate } = req.body;
    try {
        const { data, error } = await supabaseInstance.rpc('get_single_outlet_order_details', { outlet_id: outletId, start_date: startDate, end_date: endDate });

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
    const { outletId, targateDate } = req.body;
    try {
        const { data, error } = await supabaseInstance.rpc('get_admin_outlet_order', { outlet_id: outletId, target_date: targateDate });

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

router.post("/getAdminFinance", async (req, res) => {
    const { start_date,end_date,cities,campuses,outlets } = req.body;
    try {
        const { data, error } = await supabaseInstance.rpc('get_all_outlet_finance', { start_date,end_date,cities: cities || null,campuses:campuses || null,outlets:outlets || null });

        if (data) {
            res.status(200).json({
                success: true,
                data: data.filter(item => item.outletid !== null)
            });
        } else {
            throw error
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, error: error });
    }
});

router.post("/getAdminFinanceDashboard", async (req, res) => {
    const { start_date,end_date,outlets } = req.body;
    try {
        const { data, error } = await supabaseInstance.rpc('get_super_admin_finance_dashboard', { start_date,end_date,outlets:outlets || null });

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


router.post("/getAdminFinanceOrderReport", async (req, res) => {
    const { start_date,end_date,outletId } = req.body;
    try {
        const { data, error } = await supabaseInstance.rpc('get_all_outlet_order_report_level', { start_date,end_date,outlet_id:outletId });

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
