var express = require("express");
var router = express.Router();

var supabaseInstance = require("../services/supabaseClient").supabase;

/* GET users listing. */
router.get("/", function (req, res, next) {
  res.send({ success: true, message: "respond send from admin.js" });
});

router.get("/getAdminList", async (req, res) => {
  const { page, perPage } = req.query; // Extract query parameters
  const pageNumber = parseInt(page) || 1;
  const itemsPerPage = parseInt(perPage) || 10;

  console.log({ page, perPage });
  try {
    const { data, error, count } = await supabaseInstance
      .from("Super_Admin_Users")
      .select("*", { count: "exact" })
      .range((pageNumber - 1) * itemsPerPage, pageNumber * itemsPerPage - 1)
      .order("adminId", { ascending: true });

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

router.post("/createAdmin", async function (req, res, next) {
  const { email, password, name, mobile, role, tabAccess } = req.body;

  try {
    const authResponse = await supabaseInstance.auth.signUp({
      email,
      password,
    });
    if (authResponse?.data?.user) {
      const adminId = authResponse.data.user.id;
      const insertResponse = await supabaseInstance
        .from("Super_Admin_Users")
        .insert({ adminId, name, email, mobile, role, tabAccess })
        .select("*")
        .maybeSingle();
      if (insertResponse.data) {
        res.send({ success: true, data: insertResponse.data });
      } else {
        throw insertResponse.error;
      }
      // todo Super_Admin_Users insert user object =>adminId <= uid
    } else {
      throw authResponse.error;
    }
  } catch (error) {
    console.error(error);
    if (error.code === "23505") {
      res.send({ success: false, message: "Email already exist" });
    }
    res.send({ success: false, message: error?.message || error });
  }
});

router.post("/adminLogin", async (req, res) => {
  const { email, password } = req.body;
  try {
    const authResponse = await supabaseInstance.auth.signInWithPassword({
      email,
      password,
    });
    if (authResponse.data?.user) {
      const adminId = authResponse.data.user.id;
      const { data, error } = await supabaseInstance
        .from("Super_Admin_Users")
        .select("*")
        .match({ adminId: adminId });

      res.send({
        success: true,
        message: "Login succesfull",
        data: data,
      });
    } else {
      throw authResponse.error;
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || error });
  }
});

router.post("/updateAdminPassword", async (req, res) => {
  const { password, adminId} = req.body;
  
  try {
    const { data, error } = await supabaseInstance.auth.admin.updateUserById(adminId, {password: password});
    if (data) {
      res.status(200).json({
        success: true,
        message: "Password updated succesfully",
      });
    } else {
      throw error;
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/updateAdmin/:adminId", async (req, res) => {
  const { adminId } = req.params;
  const adminData = req.body;
  delete adminData?.email;
  delete adminData?.password;
  console.log("adminData",adminData)
  try {
    const { data, error } = await supabaseInstance
      .from("Super_Admin_Users")
      .update({...adminData})
      .eq("adminId", adminId)
      .select("*");

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
    res.status(500).json({ success: false, error: error });
  }
});
module.exports = router;
