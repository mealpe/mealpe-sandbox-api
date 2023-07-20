var express = require("express");
var router = express.Router();

var supabaseInstance = require("../services/supabaseClient").supabase;

router.get("/", function (req, res, next) {
  res.send({ success: true, message: "respond send from customer.js" });
});

router.post("/signUp", async (req, res) => {
  const { email, mobile, name } = req.body;

  try {
    const { data, error } = await supabaseInstance.auth.admin.createUser({
      email,
      phone: mobile,
      phone_confirm: true
    })

    if (data?.user) {
      const customerAuthUID = data.user.id;
      const customerResponse = await supabaseInstance.from("Customer").insert({ email, mobile, customerName: name, customerAuthUID }).select("*").maybeSingle();
      if (customerResponse.data) {
        res.status(200).json({
          success: true,
          message: "SignUp Successfully",
        });
      } else {
        throw error;
      }
    } else {
      throw error;
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error?.message || error });
  }
});

router.post("/sendOTP", async (req, res) => {
  const { mobile } = req.body;

  try {
    const { data, error } = await supabaseInstance.auth.signInWithOtp({
      // phone: mobile
      phone: "+919130743559"
    })

    if (data) {
      res.status(200).json({
        success: true,
        message: "OTP Send Successfully",
      });
    } else {
      throw error;
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/verifyOTP", async (req, res) => {
  const { otp, phone } = req.body;
  try {
    const { data, error } = await supabaseInstance.auth.verifyOtp({ phone, token: otp, type: 'sms' })
    if (data?.user) {
      const customerAuthUID = data.user.id;
      console.log("customerAuthUID", customerAuthUID)
      const customerResponse = await supabaseInstance.from("Customer").select("*").eq("customerAuthUID", customerAuthUID).maybeSingle();
      console.log("customerResponse", customerResponse)
      if (customerResponse.data) {
        res.status(200).json({
          success: true,
          message: "OTP Verified",
          data: customerResponse.data,
        });
      } else {
        throw customerResponse.error;
      }
    }
    else {
      throw error;
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/cafeteriaDetails/:outletId", async (req, res) => {
  const { outletId } =req.params;
  try {
    const { data, error } = await supabaseInstance.from("Menu_Item").select("*").eq("outletId", outletId);
    if (data) {
      const outdetails = await supabaseInstance.from("Outlet").select("*").eq("outletId", outletId);
      res.status(200).json({
        success: true,
        message: "Data fetch succesfully",
        data:{
          outdetails:outdetails.data,
          menuItems:data
        },
      });
    } else {
      throw error
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
})

router.get("/homeData", async (req, res) => {
  const { categoryId, campusId } = req.query;
  try {
    const { data, error } = await supabaseInstance.from("Outlet").select("*,cityId(*),restaurantId(*),bankDetailsId(*),campusId(*)").eq("campusId",campusId).limit(5);
    if (data) {
      const PopularCafeterias = await supabaseInstance.from("Restaurant_category").select("*,restaurantId(*),outletId(*),categoryId(*)").eq("categoryId",categoryId).limit(5);
      if(categoryId == null || categoryId  && campusId ) {
        res.status(200).json({
          success: true,
          message: "Data fetch succesfully",
          data:{
            cafeteriasForYouData:data,
            PopularCafeterias:PopularCafeterias.data
          }
        });
      } 
    } else{
      throw error
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error });
  }
})

module.exports = router;
