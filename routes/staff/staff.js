var express = require("express");
var router = express.Router();
var supabaseInstance = require("../../services/supabaseClient").supabase;

router.post("/createStaff", async (req, res) => {

    const { outletId, email, password, name, mobile, address, pancard, roleId } = req.body;

    try {
        const { data, error } = await supabaseInstance.auth.signUp(
            {
                email: email,
                password: password,
                options: {
                    data: {
                        isRestaurant: false,
                        isOutlet: false,
                        isOutletStaff: true,
                    }
                }
            })
        if (data?.user) {
            const outletStaffAuthUId = data.user.id;
            const metadata =data?.user?.user_metadata;
            console.log("metadata",metadata);
            const staffDetails = await supabaseInstance.from("Outlet_Staff")
                .insert({ outletStaffAuthUId, outletId, email, name, mobile, address, pancard, roleId })
                .select("*")
                .maybeSingle();

            if (staffDetails.data) {
                res.send({ success: true, data: staffDetails.data });
            } else {
                throw staffDetails.error;
            }
        } else {
            throw error
        }

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
})

router.post("/updateStaff/:outletStaffAuthUId", async (req, res) => {

    const { outletStaffAuthUId } = req.params;
    const staffData = req.body;
    delete staffData?.email;
    delete staffData?.password;
    try {
        const { data, error } = await supabaseInstance
            .from("Outlet_Staff")
            .update({ ...staffData })
            .eq("outletStaffAuthUId", outletStaffAuthUId)
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

router.get("/getStaff/:outletId", async (req, res) => {
    const {outletId} = req.params;
    try {
        const { data, error } = await supabaseInstance
            .from("Outlet_Staff")
            .select("*,roleId(roleId,role)")
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

module.exports = router;