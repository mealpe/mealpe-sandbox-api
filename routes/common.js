var express = require("express");
var router = express.Router();
var supabaseInstance = require("../services/supabaseClient").supabase;

router.get("/getSpiceLevel", async (req, res) => {
    try {
      const { data, error } = await supabaseInstance
        .from("SpiceLevel")
        .select("*")
  
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

router.get("/getDietaryRestrictions", async (req, res) => {
  try {
    const { data, error } = await supabaseInstance
      .from("DietaryRestriction")
      .select("*")

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

router.get("/getGender", async (req, res) => {
  try {
    const { data, error } = await supabaseInstance
      .from("Gender")
      .select("*")

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