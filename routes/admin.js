var express = require("express");
var router = express.Router();

var supabaseInstance = require("../services/supabaseClient").supabase;

/* GET users listing. */
router.get("/", function (req, res, next) {
  res.send({ success: true, message: "respond send from admin.js" });
});

router.get("/getAdminList", async (req, res) => {
  const { page, perPage,status,sortBy,searchText } = req.query; // Extract query parameters
  const pageNumber = parseInt(page) || 1;
  const itemsPerPage = parseInt(perPage) || 10;

  console.log({ page, perPage });
  try {
   let query  =  supabaseInstance
      .from("Super_Admin_Users")
      .select("*", { count: "exact" })
      .range((pageNumber - 1) * itemsPerPage, pageNumber * itemsPerPage - 1)

     
      if(searchText){
        query =query.ilike('name',`%${searchText}%`)
      }

     if (status === "true") {
      query = query.eq("isActive",true);
     } else if(status === "false"){
      query = query.eq("isActive",false);
     }

     if (sortBy === "name") {
      query = query.order("name", { ascending: true });
     }else if(sortBy === "date"){
      query = query.order("created_at", { ascending: false });
     }else{
      query = query.order("updated_at", { ascending: false });
     }


      const { data, error, count } = await query;

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

router.post("/resetPassword", async (req, res) => {
  const { email } = req.body;
  try {
    const resetPasswordForEmailResponse = await supabaseInstance.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://mealpe-super-admin-testing.web.app',
    })
    if (resetPasswordForEmailResponse?.data) {
      res.send({
        success: true,
        message: "Link Shared",
      });
    } else {
      throw resetPasswordForEmailResponse.error;
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || error });
  }
});

router.post("/updatePassword", async (req, res) => {
  const { new_password } = req.body;
  try {
    const updatePasswordForEmailResponse = await supabaseInstance.auth.updateUser({
      password: new_password
    })
    if (updatePasswordForEmailResponse?.data) {
      res.send({
        success: true,
        message: "Password Updated succesfully",
      });
    } else {
      throw updatePasswordForEmailResponse.error;
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

router.post("/updateOutletAdmin/:outletAdminId", async (req, res) => {
  const { outletAdminId } = req.params;
  const {name,mobile} = req.body;
   try {
    const { data, error } = await supabaseInstance
      .from("Outlet_Admin")
      .update({name,mobile})
      .eq("outletAdminId", outletAdminId)
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

router.get("/getOutletAdminList", async (req, res) => {
  const { page, perPage, searchText } = req.query; 
  const pageNumber = parseInt(page) || 1;
  const itemsPerPage = parseInt(perPage) || 10;

  try {
   
    let query = supabaseInstance.rpc("get_outlet_admin_list",{},{count:"exact"}).range((pageNumber - 1) * itemsPerPage, pageNumber * itemsPerPage - 1)

      if(searchText){
        query = query.or(`name.ilike.%${searchText}%,outletname.ilike.%${searchText}%`);
      }

      const { data, error, count } = await query;

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

module.exports = router;


