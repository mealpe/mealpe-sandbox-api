var express = require("express");
var router = express.Router();

var supabaseInstance = require("../services/supabaseClient").supabase;

/* GET users listing. */
router.get("/", function (req, res, next) {
  res.send({ success: true, message: "respond send from admin.js" });
});

router.get("/getCities", async (req, res) => {
  try {
    const { data, error } = await supabaseInstance.from("City").select();
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
});

module.exports = router;
