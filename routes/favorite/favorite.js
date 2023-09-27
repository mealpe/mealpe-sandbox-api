var express = require("express");
var router = express.Router();
var supabaseInstance = require("../../services/supabaseClient").supabase;

router.post("/favoriteMenuItem", async (req, res) => {
  const { customerAuthUID, outletId, itemid, restaurantId } = req.body;
  try {
    const { data, error } = await supabaseInstance
      .from("FavoriteMenuItem")
      .insert({ customerAuthUID, outletId, itemid, restaurantId })
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
  
router.get("/getfavoriteMenuItem/:customerAuthUID", async (req, res) => {
  const { customerAuthUID } = req.params;
  try {
    let { data, error } = await supabaseInstance
      .from("FavoriteMenuItem")
      .select("favoriteMenuItemId,itemid(*,outletId(outletId,outletName,address,logo,headerImage,openTime,closeTime,isDineIn,isPickUp,isDelivery,packaging_charge,Timing(*)))")
      .eq("customerAuthUID", customerAuthUID)

      const uniqueObjects = {};
      for (const obj of data) {
        const objId = obj.itemid.itemid;
        uniqueObjects[objId] = obj;
      }
      const uniqueObjectsArray = Object.values(uniqueObjects);

    if (data) {
      res.status(200).json({
        success: true,
        data: uniqueObjectsArray,
      });
    } else {
      throw error
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete("/deletefavoriteMenuItem/:favoriteMenuItemId", async (req, res) => {
  const { favoriteMenuItemId } = req.params;
  try {
    const { data, error } = await supabaseInstance
      .from("FavoriteMenuItem")
      .delete()
      .eq("favoriteMenuItemId", favoriteMenuItemId)
      .select("*")

    if (data) {
      res.status(200).json({
        success: true,
        message: "Menu item Deleted"
      });
    } else {
      throw error
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error });
  }
});

module.exports = router;