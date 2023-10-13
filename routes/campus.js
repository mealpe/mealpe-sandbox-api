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
      .order("updated_at", { ascending: false });

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
    }else{
      throw error;
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/getCampus/:cityId", async (req, res) => {
  const {cityId} = req.params;
  try {
    const { data, error } = await supabaseInstance
      .from("Campus")
      .select("*")
      .eq("isDelete",false)
      .eq("cityId",cityId)

    if (data) {
      res.status(200).json({
        success: true,
        data,
      });
    }else
    {
      throw error;
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/updateCampus/:campusId", async (req, res) => {
  const { campusId } = req.params;
  const { campusName, address,isDelete,cityId } = req.body;
  // const { name, email, mobile, role } = req.body;

  try {
    const { data, error } = await supabaseInstance
      .from("Campus")
      .update({ campusName, address,isDelete,cityId})
      .eq("campusId", campusId)
      .select("*")
      .maybeSingle()


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
    const { data, error } = await supabaseInstance.from("Campus").select("*").order("created_at", { ascending: false });
    if (data) {
      res.status(200).json({
        success: true,
        message: "Data fetch succesfully",
        data: data,
      });
    }else{
      throw error;
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
