var express = require("express");
var router = express.Router();
var supabaseInstance = require("../services/supabaseClient").supabase;

router.get("/", function (req, res, next) {
  res.send({ success: true, message: "respond send from category.js" });
});

router.get("/getCategoryList", async (req, res) => {
    try {
      const { data, error } = await supabaseInstance.from("Category").select();
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
  });

  router.get("/getCategoryListWithPage", async (req, res) => {
      const { page, perPage } = req.query;
      const pageNumber = parseInt(page) || 1;
      const itemsPerPage = parseInt(perPage) || 10;
    try {
      const { data, error, count} = await supabaseInstance
      .from("Category")
      .select("*",{  count: "exact" })
      .range((pageNumber - 1) * itemsPerPage, pageNumber * itemsPerPage - 1)
      if (data) {
        const totalPages = Math.ceil(count / itemsPerPage);
        res.status(200).json({
          success: true,
          message: "Data fetch succesfully",
          data: data,
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



module.exports = router;
