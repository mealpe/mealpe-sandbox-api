const { default: axios } = require("axios");
var express = require("express");
var router = express.Router();
var supabaseInstance = require("../../services/supabaseClient").supabase;
var zohoConfig = require("../../configs/zohoConfig").config;


router.post("/createTicket", async (req, res) => {
    const { email, message, contactTicketTypeId, customerAuthUID } = req.body;
    try {
        const { data, error } = await supabaseInstance.from("Contact_Ticket").insert({ email, message, contactTicketTypeId, customerAuthUID }).select("*, contactTicketTypeId(*)").maybeSingle();

        if (data) {

            let postBody = {
                subject: "user create ticket.",
                description: message,
                // departmentId: "1892000000006907",
                // "phone": "1 888 900 9646",
                email: email,
                category: data?.contactTicketTypeId?.title,
                subCategory: data?.contactTicketId
            }

            const axiosRequestConfig = {
                headers: {
                    Authorization: zohoConfig.authorization,
                    orgId: zohoConfig.orgId
                }
            }

            let ticketUpdateBodyForZoho = {
                zohoPostBody: postBody
            }

            axios.post(`${zohoConfig.zohoBaseUrl}tickets`, postBody, axiosRequestConfig).then((createZohoTicketResponse) => {
                console.log("createZohoTicketResponse.data =>", createZohoTicketResponse.data);
                ticketUpdateBodyForZoho.zohoSuccessResponse = createZohoTicketResponse.data;
            }).catch((createZohoTicketError) => {
                console.error("createZohoTicketError => ", createZohoTicketError?.response?.data || createZohoTicketError?.response || createZohoTicketError);
                ticketUpdateBodyForZoho.zohoErrorResponse = createZohoTicketError?.response?.data || createZohoTicketError?.response || createZohoTicketError;
            }).finally(async (finallyResponse) => {
                console.log("finallyResponse -> ", finallyResponse);

                const updateContactTicketResponse = await supabaseInstance.from("Contact_Ticket").update(ticketUpdateBodyForZoho).eq("contactTicketId", data?.contactTicketId).select("*").maybeSingle();

                res.status(200).json({
                    success: Boolean(updateContactTicketResponse?.data),
                    message: "Ticket created successfully",
                    data: updateContactTicketResponse?.data || null,
                    error: updateContactTicketResponse?.error || null,
                });
            })

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
            .select("*,contactTicketTypeId(title,contactTicketTypeId)")
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
