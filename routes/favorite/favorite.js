var express = require("express");
var router = express.Router();
var supabaseInstance = require("../../services/supabaseClient").supabase;
var moment = require('moment')
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
      .select("favoriteMenuItemId,itemid(*,outletId(isTimeExtended,outletId,outletName,address,logo,headerImage,openTime,closeTime,isDineIn,isPickUp,isDelivery,packaging_charge,convenienceFee,Timing(*,dayId(*))))")
      .eq("customerAuthUID", customerAuthUID)

    const uniqueObjects = {};
    for (const obj of data) {
      const objId = obj.itemid.itemid;
      uniqueObjects[objId] = obj;
    }
    const uniqueObjectsArray = Object.values(uniqueObjects).map(time => {
      time.itemid.outletId.Timing = time?.itemid?.outletId?.Timing
        .map(m => ({
          ...m, Timing: {
            Today: time?.itemid?.outletId?.Timing?.find(f => f?.dayId?.day === moment().tz("Asia/Kolkata").format("dddd")),
            Tomorrow: time?.itemid?.outletId?.Timing?.find(f => f?.dayId?.day === moment().tz("Asia/Kolkata").add(1, 'days').format("dddd")),
            Overmorrow: time?.itemid?.outletId?.Timing?.find(f => f?.dayId?.day === moment().tz("Asia/Kolkata").add(2, 'days').format("dddd"))
          }
        }))

      time.itemid.outletId.Timing = time?.itemid?.outletId?.Timing?.[0]?.Timing

      const openTime = time?.itemid?.outletId?.Timing?.['Today']?.openTime
      const closeTime = time?.itemid?.outletId?.Timing?.['Today']?.closeTime
      
      const TomorrowopenTime = time?.itemid?.outletId?.Timing?.['Tomorrow']?.openTime
      const TomorrowcloseTime = time?.itemid?.outletId?.Timing?.['Tomorrow']?.closeTime

      const OvermorrowopenTime = time?.itemid?.outletId?.Timing?.['Overmorrow']?.openTime
      const OvermorrowcloseTime = time?.itemid?.outletId?.Timing?.['Overmorrow']?.closeTime
      const isTimeExtended = time?.itemid?.outletId?.isTimeExtended

      let todayflag = false;
      let tomorrowflag = false;
      let overmorrowflag = false;
      if (openTime && closeTime) {
        const time = moment().tz("Asia/Kolkata");
        const beforeTime = moment.tz(openTime, 'HH:mm:ss', 'Asia/Kolkata');
        const afterTime = moment.tz(closeTime, 'HH:mm:ss', 'Asia/Kolkata');

        todayflag = time.isBetween(beforeTime, afterTime);
      }
      if (!todayflag && isTimeExtended) {
        todayflag = true;
      }

      if (TomorrowopenTime && TomorrowcloseTime) {
        const time = moment().tz("Asia/Kolkata");
        const beforeTime = moment.tz(TomorrowopenTime, 'HH:mm:ss', 'Asia/Kolkata');
        const afterTime = moment.tz(TomorrowcloseTime, 'HH:mm:ss', 'Asia/Kolkata');

        tomorrowflag = time.isBetween(beforeTime, afterTime);
      }
      if (!tomorrowflag && isTimeExtended) {
        tomorrowflag = true;
      }

      if (OvermorrowopenTime && OvermorrowcloseTime) {
        const time = moment().tz("Asia/Kolkata");
        const beforeTime = moment.tz(OvermorrowopenTime, 'HH:mm:ss', 'Asia/Kolkata');
        const afterTime = moment.tz(OvermorrowcloseTime, 'HH:mm:ss', 'Asia/Kolkata');

        overmorrowflag = time.isBetween(beforeTime, afterTime);
      }
      if (!overmorrowflag && isTimeExtended) {
        overmorrowflag = true;
      }
      time.todayisOutletOpen = todayflag
      time.tomorrowisOutletOpen = tomorrowflag
      time.overmorrowisOutletOpen = overmorrowflag
      return time
    })

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