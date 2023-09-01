var express = require("express");
var router = express.Router();
var supabaseInstance = require("../../services/supabaseClient").supabase;

router.post("/createRole", async (req, res) => {
    const { role, access, outletId } = req.body;
    try {
        const { data, error } = await supabaseInstance
            .from("Outlet_Role")
            .insert({ role: role, access: access, outletId: outletId })
            .select("*")

        if (data) {
            res.status(200).json({
                success: true,
                data: data,
            });
        } else {
            throw error;
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error });
    }
});

router.get("/getRoleByOutletId/:outletId", async (req, res) => {
    const {outletId} = req.params;
    try {
        const { data, error } = await supabaseInstance
            .from("Outlet_Role")
            .select("*")
            .eq("outletId",outletId)

        if (data) {
            res.status(200).json({
                success: true,
                data: data,
            });
        } else {
            throw error
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post("/updateRole/:roleId", async (req, res) => {
    const { roleId } = req.params;
    const roleData = req.body;

    try {
        const { data, error } = await supabaseInstance
            .from("Outlet_Role")
            .update({ ...roleData })
            .eq("roleId", roleId)
            .select("*");

        if (data) {
            res.status(200).json({
                success: true,
                message: "Data updated succesfully",
                data: data,
            });
        } else {
            throw error;
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;