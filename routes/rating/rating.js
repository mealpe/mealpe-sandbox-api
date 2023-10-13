var express = require("express");
var router = express.Router();
var supabaseInstance = require("../../services/supabaseClient").supabase;

router.post("/createRating", async (req, res) => {

    const { customerAuthUID, outletId, message, star  } = req.body;
    try {
    
      const { data, error } = await supabaseInstance
        .from("Review")
        .insert({customerAuthUID, outletId, message, star})
        .select("*")
  
      if (data) {
        res.status(200).json({
          success: true,
          data:data
        });
      } else {
        throw error;
      }
     
    } catch (error) {
      if (error.code === "23505") {
        res.send({ success: false, message: "Rating Already Taken" });
      }else{
        res.status(500).json({ success: false, error: error.message });
      }
    }
  });
  
router.get("/getRating/:outletId", async (req, res) => {
    const { outletId } = req.params;
    try {
        const { data, error } = await supabaseInstance
            .from("Review")
            .select("*")
            .eq("outletId", outletId)

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

router.get("/getRatingByCustomer/:customerAuthUID", async (req, res) => {
  const { customerAuthUID } = req.params;
  try {
      const { data, error } = await supabaseInstance
          .from("Review")
          .select("*")
          .eq("customerAuthUID", customerAuthUID)

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

router.delete("/deleteRating/:reviewId", async (req, res) => {
  const { reviewId } = req.params;
  try {
    const { data, error } = await supabaseInstance
      .from("Review")
      .delete()
      .eq("reviewId",reviewId)
      .select("*")

    if (data) {
      res.status(200).json({
        success: true,
        message:"Rating Deleted"
      });
    } else {
      throw error
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error });
  }
});

module.exports = router;