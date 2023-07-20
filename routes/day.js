var express = require("express");
var router = express.Router();

var supabaseInstance = require("../services/supabaseClient").supabase;


router.get("/getDaysList", async (req, res) => {
    try {
      const { data, error } = await supabaseInstance.from("Days").select();
      if (data) {
        res.status(200).json({
          success: true,
          message: "Data fetch succesfully",
          data: data,
        });
      }
     
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  })

module.exports = router;




