var express = require("express");
var router = express.Router();
var supabaseInstance = require("../../services/supabaseClient").supabase;

router.get("/getMealpeBankLabel", async (req, res) => {
    try {
        const getCurrentMealpeBankLabelResponse = await getCurrentMealpeBankLabel();
        res.status(200).json(getCurrentMealpeBankLabelResponse);
    } catch (error) {
        res.status(500).json({...error, success: false});
    }
})

router.post("/addMealpeBankLabel", async (req, res) => {

    const { adminId, bankLabel } = req.body;

    if (adminId && bankLabel) {
        try {
            const mealpeBankLabelResponse = await supabaseInstance.from('mealpeBankLabel').insert({ adminId, bankLabel }).select('*, adminId(name)').maybeSingle();
            if (mealpeBankLabelResponse?.data) {
                res.status(200).json({ success: true, data: mealpeBankLabelResponse.data });
            } else {
                throw mealpeBankLabelResponse.error;
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, error: error?.message || error || "Something went wrong."});
        }
    } else {
        res.status(500).json({success: false, error: 'Please pass send [adminId, bankLabel] in body.'});
    }
})

function getCurrentMealpeBankLabel() {
    return new Promise(async (resolve, reject) => {
        try {
            const mealpeBankLabelResponse = await supabaseInstance.from('mealpeBankLabel').select('*, adminId(name)').order("created_at", { ascending: false }).limit(1).maybeSingle();
            if (mealpeBankLabelResponse?.data) {
                resolve({ success: true, data: mealpeBankLabelResponse.data });
            } if(!mealpeBankLabelResponse.data || !mealpeBankLabelResponse?.error) {
                resolve({ success: true, data: null });
            } else {
                throw mealpeBankLabelResponse.error;
            }
        } catch (error) {
            console.error(error);
            reject({ success: false, error: error?.message || error || "Something went wrong."});
        }
    })
}

module.exports = { router, getCurrentMealpeBankLabel};