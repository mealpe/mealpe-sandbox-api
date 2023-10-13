var express = require("express");
var router = express.Router();
var supabaseInstance = require("../../services/supabaseClient").supabase;


router.post("/createTicket", async (req, res) => {
    const { email, message, contactTicketTypeId, customerAuthUID } = req.body;
    try {
        const { data, error } = await supabaseInstance.from("Contact_Ticket").insert({ email, message, contactTicketTypeId, customerAuthUID }).select("*").maybeSingle();

        if (data) {
            res.send({
                success: true,
                message: "Ticket created successfully",
                data: data,
            });
        } else {
            throw error;
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message || error });
    }
});

router.get("/getTicket/:customerAuthUID", async (req, res) => {
    const { customerAuthUID } = req.params;
    try {
        const { data, error } = await supabaseInstance
            .from("Contact_Ticket")
            .select("*")
            .eq("customerAuthUID", customerAuthUID)

        if (data) {
            res.status(200).json({
                success: true,
                data: data
            });
        } else {
            throw error;
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get("/getContactTicketType", async (req, res) => {
    try {
        const { data, error } = await supabaseInstance
            .from("Contact_Ticket_Type")
            .select("*")

        if (data) {
            res.status(200).json({
                success: true,
                data: data
            });
        } else {
            throw error;
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
