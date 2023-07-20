var express = require("express");
var router = express.Router();
var supabaseInstance = require("../services/supabaseClient").supabase;

router.get("/", function (req, res, next) {
  res.send({ success: true, message: "respond send from campus.js" });
});

router.post("/createCampus", async (req, res) => {
  const { campusName, address, cityId } = req.body;
  try {
    const { data, error } = await supabaseInstance.from("Campus").insert({ campusName, address, cityId }).select("*").maybeSingle();
   
    if (data) {
      res.send({
        success: true,
        message: "Campus created successfully",
        data: data,
      });
    } else {
      throw error;
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || error });
  }
});

router.get("/getCampusList", async (req, res) => {
  const { page, perPage } = req.query;
  const pageNumber = parseInt(page) || 1;
  const itemsPerPage = parseInt(perPage) || 10;

  try {
    const { data, error, count } = await supabaseInstance
      .from("Campus")
      .select("*", { count: "exact" })
      .range((pageNumber - 1) * itemsPerPage, pageNumber * itemsPerPage - 1)
      .order("campusId", { ascending: true });

    if (data) {
      const totalPages = Math.ceil(count / itemsPerPage);
      res.status(200).json({
        success: true,
        data,
        meta: {
          page: pageNumber,
          perPage: itemsPerPage,
          totalPages,
          totalCount: count,
        },
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/updateCampus/:id", async (req, res) => {
  const { id } = req.params;
  const { campusName, address } = req.body;
  // const { name, email, mobile, role } = req.body;

  try {
    const { data, error } = await supabaseInstance
      .from("Campus")
      .update({ campusName, address })
      .eq("campusId", id)
      .select();

    if (data) {
      res.status(200).json({
        success: true,
        message: "Data updated succesfully",
        data: data,
      });
    } else {
      throw error;
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/deleteCampus/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabaseInstance
      .from("Campus")
      .update({ isDelete: true })
      .eq("campusId", id)
      .select();
    console.log();
    if (data) {
      res.status(200).json({
        success: true,
        message: "Data deleted succesfully",
        data: data,
      });
    } else {
      throw error;
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});


router.get("/getAllCampusList", async (req, res) => {
  try {
    const { data, error } = await supabaseInstance.from("Campus").select();
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

router.get("/getCityCampusList",async (req,res) => {
  const { cityId } = req.query;
  try {
    const { data, error } = await supabaseInstance.from("Campus").select("*")
      .eq("cityId", cityId)
      .order("campusName", { ascending: true });
    if (data) {
      res.status(200).json({
        success: true,
        message: "Data fetch succesfully",
        data: data,
      });
    } else {
      throw error;
    }

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }

})
module.exports = router;
