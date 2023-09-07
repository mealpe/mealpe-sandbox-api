var express = require("express");
var router = express.Router();
var supabaseInstance = require("../services/supabaseClient").supabase;
const multer = require("multer");
const upload = multer();

router.get("/", function (req, res, next) {
  res.send({ success: true, message: "respond send from restaurent.js" });
});

router.get("/getRestaurant", async (req, res) => {
  try {
    const { data, error } = await supabaseInstance
      .from("Restaurant")
      .select(
        "*, bankDetailsId(*), restaurantAdminId(*), Restaurant_category!left(*, categoryId(*)), Tax!left(taxid, taxname, tax)"
      );
    console.log(data);
    console.log(error);
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
});

router.get("/getRestaurant/:restaurantId", async (req, res) => {
  const {restaurantId} = req.params;
  try {
    const { data, error } = await supabaseInstance
      .from("Restaurant")
      .select("*")
      .eq("restaurantId",restaurantId)
   
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

router.get("/getRestaurantList", async (req, res) => {
  const { page, perPage, searchText} = req.query; // Extract query parameters
  const pageNumber = parseInt(page) || 1;
  const itemsPerPage = parseInt(perPage) || 10;

  try {
    let query =  supabaseInstance
      .from("Restaurant")
      .select("*, bankDetailsId(*), campusId(*),restaurantAdminId(*), Restaurant_category!left(*, categoryId(*)), Timing!left(*), Tax!left(taxid, taxname, tax)", { count: "exact" })
      .range((pageNumber - 1) * itemsPerPage, pageNumber * itemsPerPage - 1)
      .order("restaurantAdminId", { ascending: true });
    if(searchText) {
      query = query.or(`address.ilike.%${searchText}%,restaurantName.ilike.%${searchText}%`);
      // query = query.ilike('outletName', `%${searchText}%`);
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
    } else {
      throw error;
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error?.message || error });
  }
});

router.post("/createRestaurant", async (req, res) => {
  const {
    email,
    password,
    bankDetailsId,
    restaurantAdminId,
    restaurantName,
    mobile,
    GSTIN,
    FSSAI_License,
    campusId,
    address,
    isVeg,
    isNonVeg,
    openTime,
    closeTime,
    Restaurant_category,
    Timing
  } = req.body;
  try {
    const { data, error } = await supabaseInstance.auth.signUp(
      {
        email: email,
        password: password,
        options: {
          data: {
            isRestaurant: true,
            isOutlet: false,
          }
        }
      })
    if (data?.user) {
      const restaurantId = data.user.id;

      const bankDetails = await supabaseInstance.from("BankDetails").insert({ accountNumber: bankDetailsId.accountNumber || null, BankName: bankDetailsId.BankName, IFSCCode: bankDetailsId.IFSCCode }).select().maybeSingle();
      const _bankDetailsId = bankDetails.data.bankDetailsId;

      const restaurantAdminDetails = await supabaseInstance.from("Restaurant_Admin").insert({ name: restaurantAdminId?.name, mobile: restaurantAdminId?.mobile || null, email: restaurantAdminId?.email, address: restaurantAdminId?.address, pancard: restaurantAdminId?.pancard }).select().maybeSingle();
      const _restaurantAdminId = restaurantAdminDetails.data.restaurantAdminId;

      let objectData = {
        restaurantId,
        restaurantName,
        email,
        mobile,
        GSTIN,
        FSSAI_License,
        bankDetailsId: _bankDetailsId,
        restaurantAdminId: _restaurantAdminId,
        campusId,
        address,
        isVeg,
        isNonVeg,
        openTime,
        closeTime
      }

      if (openTime) {
        objectData.openTime = openTime;
      }
      if (closeTime) {
        objectData.closeTime = closeTime;
      }
      const inserRestaurentNewkDetails = await supabaseInstance.from("Restaurant").insert(objectData).select("*").maybeSingle();

      const taxPostBody = [
        {restaurantId, taxname: "CGST"},
        {restaurantId, taxname: "SGST"}
      ]
      const taxResponse = await supabaseInstance.from("Tax").insert(taxPostBody).select();

      for (let categoryItem of Restaurant_category) {
        const restaurentCategoryResponse = await supabaseInstance
          .from("Restaurant_category")
          .insert({ restaurantId, categoryId: categoryItem })
          .select("*")
          .maybeSingle();
        console.log("restaurentCategoryResponse", restaurentCategoryResponse);
      }

      for (let data of Timing) {
        const restaurentTimeResponse = await supabaseInstance
          .from("Timing")
          .insert({ restaurantId, dayId: data.dayId, openTime: data.openTime || null, closeTime: data.closeTime || null })
          .select("*")
          .maybeSingle();
        console.log("restaurentTimeResponse", restaurentTimeResponse);
      }

      if (inserRestaurentNewkDetails.data) {
        res.send({
          success: true,
          message: "Restaurant created successfully",
          data: inserRestaurentNewkDetails.data,

        });
      } else {
        throw inserRestaurentNewkDetails.error
      }
    } else {
      throw error;
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
})

router.post("/upsertFssaiLicensePhoto",upload.single('file'), async (req, res) => {
  const { restaurantId } = req.body;
  try {
    const { data, error } = await supabaseInstance
      .storage
      .from('fssai-license')
      .upload(restaurantId + ".webp", req.file.buffer, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'image/webp'
      })

    if (data?.path) {
      const publickUrlresponse = await supabaseInstance.storage.from('fssai-license').getPublicUrl(data?.path);
      if (publickUrlresponse?.data?.publicUrl) {
        const publicUrl = publickUrlresponse?.data?.publicUrl;
        const restaurantData = await supabaseInstance.from("Restaurant").update({ FSSAI_License: `${publicUrl}?${Date.now}` }).eq("restaurantId", restaurantId).select("*, bankDetailsId(*), campusId(*),restaurantAdminId(*), Restaurant_category!left(*, categoryId(*)), Tax!left(taxid, taxname, tax)").maybeSingle();
        res.status(200).json({
          success: true,
          data: restaurantData.data,
        });
      } else {
        throw publickUrlresponse.error || "Getting Error in PublicUrl"
      }
    } else {
      throw error
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error });
  }
})

router.post("/restaurentLogin", async (req, res) => {
  const { email, password } = req.body;
  try {
    const { data, error } = await supabaseInstance.auth.signInWithPassword({
      email: email,
      password: password,
    })

    if (data?.user) {
      const id = data.user.id
      console.log("id", id)
      console.log("ata?.user?.user_metadata----->",data?.user?.user_metadata)
      if (data?.user?.user_metadata?.isRestaurant === true) {
        const restaurantData = await supabaseInstance.from("Restaurant").select("*, bankDetailsId(*), restaurantAdminId(*), Tax!left(*),Timing!left(*),Restaurant_category!left(*)").eq("restaurantId", id).maybeSingle();
        res.status(200).json({
          success: true,
          message: "LogIn successfully",
          data: {
            outletData: restaurantData.data
          }
        });

      } else if (data?.user?.user_metadata?.isOutlet === true) {
        const outletData = await supabaseInstance.from("Outlet").select("*, bankDetailsId(*), outletAdminId(*), Tax!left(*),Timing!left(*),Restaurant_category!left(*)").eq("outletId", id).maybeSingle();
        res.status(200).json({
          success: true,
          message: "LogIn successfully",
          data: {
            outletData: outletData.data
          }
        });
      } else if(data?.user?.user_metadata?.isOutletStaff === true) {
        const outletStaffData = await supabaseInstance.from("Outlet_Staff").select("*, roleId(*)").eq("outletStaffAuthUId", id).maybeSingle();
        const outletData = await supabaseInstance.from("Outlet").select("*, bankDetailsId(*), outletAdminId(*), Tax!left(*),Timing!left(*),Restaurant_category!left(*)").eq("outletId", outletStaffData.data.outletId).maybeSingle();
        res.status(200).json({
          success: true,
          message: "LogIn successfully",
          data: {
            outletData: outletData.data,
            outletStaffData: outletStaffData
          }
        });
      }
    }
    else {
      throw error;
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
})

router.post("/updatePackagingCharge/:restaurantId", async (req, res) => {
  const { restaurantId } = req.params;
  const {packaging_charge}  = req.body;

  try {
    const { data, error } = await supabaseInstance
      .from("Restaurant")
      .update({packaging_charge})
      .eq("restaurantId",restaurantId)
      .select("*");

    if (data) {
      console.log("data-->",data)
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

router.post("/createCategory", async (req, res) => {
  const { restaurantId, active, categoryname } = req.body;
  try {
    const { data, error } = await supabaseInstance
      .from("Menu_Categories")
      .insert({ restaurantId, active, categoryname })
      .select("*")

    if (data) {
      res.status(200).json({
        success: true,
        data: data,
      });
    } else {
      throw error;
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error });
  }
});

router.post("/updateCategory/:categoryid", async (req, res) => {

  const { categoryid } = req.params;
  const menuCategoryData = req.body;
  ;
  try {
    const { data, error } = await supabaseInstance
      .from("Menu_Categories")
      .update({ ...menuCategoryData })
      .eq("categoryid", categoryid)
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
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/getCategoryById/:categoryid", async (req, res) => {
  const {categoryid} = req.params
  try {
    const { data, error } = await supabaseInstance
      .from("Menu_Categories")
      .select("*")
      .eq("categoryid",categoryid)

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

router.get("/category/:restaurantId", async (req, res) => {
  const { restaurantId } = req.params;
  try {
    const { data, error } = await supabaseInstance
      .from("Menu_Categories")
      .select("*")
      .eq("restaurantId",restaurantId)

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

router.post("/upsertCategoryImage", upload.single('file'), async (req, res) => {
  const { categoryid } = req.body;
  console.log("categoryid",categoryid)
  try {
    const { data, error } = await supabaseInstance
      .storage
      .from('category-image')
      .upload(categoryid + ".webp", req.file.buffer, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'image/webp'
      })

    if (data?.path) {
      const publickUrlresponse = await supabaseInstance.storage.from('category-image').getPublicUrl(data?.path);
      console.log("publickUrlresponse",publickUrlresponse)
      if (publickUrlresponse?.data?.publicUrl) {
        const publicUrl = publickUrlresponse?.data?.publicUrl;
        const menuCategoryData = await supabaseInstance.from("Menu_Categories").update({ category_image_url: `${publicUrl}?${Date.now}` }).eq("categoryid", categoryid).select("*").maybeSingle();
        res.status(200).json({
          success: true,
          data: menuCategoryData.data,
        });
      } else {
        throw publickUrlresponse.error || "Getting Error in PublicUrl"
      }
    } else {
      throw error
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error });
  }
})

router.post("/createParentCategory", async (req, res) => {
  const { restaurantId, status, parentCategoryName, category } = req.body;
  try {
    const { data, error } = await supabaseInstance
      .from("Menu_Parent_Categories")
      .insert({ restaurantId, status, parentCategoryName })
      .select("*")

    if (data) {
      const  parent_category_id = data[0].parent_category_id;
    
      for(let value of category) {
       const updatedData = await supabaseInstance
        .from("Menu_Categories")
        .update({parent_category_id:parent_category_id})
        .eq("categoryid", value)
        .select("*")
      }
      res.status(200).json({
        success: true,
        data: data,
      });
    } else {
      throw error;
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error });
  }
});

router.post("/updateParentCategory/:parent_category_id", async (req, res) => {
  const { parent_category_id } = req.params;
  const  { status, parentCategoryName, category} = req.body;
  try {
    const { data, error } = await supabaseInstance
      .from("Menu_Parent_Categories")
      .update({ status, parentCategoryName })
      .eq("parent_category_id",parent_category_id)
      .select("*");

    if (data) {
      
      const parent_category_id =data[0].parent_category_id;
      if(category){

      let updated =  await supabaseInstance
         .from("Menu_Categories")
         .update({parent_category_id:null})
         .eq("parent_category_id", parent_category_id)
         .select("*")

      for(let value of category) {
        const updatedData = await supabaseInstance
         .from("Menu_Categories")
         .update({parent_category_id:parent_category_id})
         .eq("categoryid", value)
         .select("*")
       }
      }
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

router.get("/getParentCategory/:restaurantId", async (req, res) => {
  const {restaurantId} = req.params
  try {
    const { data, error } = await supabaseInstance
      .from("Menu_Parent_Categories")
      .select("*")
      .eq("restaurantId",restaurantId)

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

router.get("/getParentCategoryById/:parent_category_id", async (req, res) => {
  const {parent_category_id} = req.params;
  try {
    const { data, error } = await supabaseInstance
      .from("Menu_Parent_Categories")
      .select("*,Menu_Categories!left(*)")
      .eq("parent_category_id",parent_category_id)

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

router.post("/upsertParentCategoryImage",upload.single('file'), async (req, res) => {
  const { parent_category_id } = req.body;
  try {
    const { data, error } = await supabaseInstance
      .storage
      .from('category-image')
      .upload(parent_category_id + ".webp", req.file.buffer, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'image/webp'
      })

    if (data?.path) {
      const publickUrlresponse = await supabaseInstance.storage.from('category-image').getPublicUrl(data?.path);
      if (publickUrlresponse?.data?.publicUrl) {
        const publicUrl = publickUrlresponse?.data?.publicUrl;
        const parentCategoryData = await supabaseInstance.from("Menu_Parent_Categories").update({ parent_category_image_url: `${publicUrl}?${Date.now}` }).eq("parent_category_id", parent_category_id).select("*").maybeSingle();
        res.status(200).json({
          success: true,
          data: parentCategoryData.data,
        });
      } else {
        throw publickUrlresponse.error || "Getting Error in PublicUrl"
      }
    } else {
      throw error
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error });
  }
})

router.post("/updateTaxCharge", async (req, res) => {

  const { tax } = req.body;
  try {
    for (let data of tax) {
      taxData = await supabaseInstance
        .from("Tax")
        .update({ tax: data.tax })
        .select("*")
        .eq("taxid", data.taxid)
    }
    if (taxData) {
      res.status(200).json({
        success: true,
        message: "Data updated succesfully",
      });
    } else {
      throw error;
    }
   
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete("/deleteCategory/:categoryid", async (req, res) => {
  const { categoryid } = req.params;
  try {
    const { data, error } = await supabaseInstance
      .from("Menu_Categories")
      .delete()
      .eq("categoryid",categoryid)
      .select("*")

    if (data) {
      res.status(200).json({
        success: true,
        message:"Category Deleted"
      });
    } else {
      throw error
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error });
  }
});

router.post("/addMenu", async (req, res) => {
  const menuItemData = {...req.body};
  try {
    if (!menuItemData?.dietary_restriction_id) {
      menuItemData.dietary_restriction_id = null;
    }
    if (!menuItemData?.spice_level_id) {
      menuItemData.spice_level_id = null;
    }
    const { data, error } = await supabaseInstance
      .from("Menu_Item")
      .insert(menuItemData)
      .select("*")
      .maybeSingle()

    if (data) {
      res.status(200).json({
        success: true,
        data: data,
      });
    } else {
      throw error;
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error });
  }
});

router.post("/updateMenu/:itemid", async (req, res) => {
  const { itemid } = req.params;
  const menuItemData = {...req.body};
  try {

    if (!menuItemData?.dietary_restriction_id) {
      menuItemData.dietary_restriction_id = null;
    }
    if (!menuItemData?.spice_level_id) {
      menuItemData.spice_level_id = null;
    }

    const { data, error } = await supabaseInstance
    .from("Menu_Item")
    .update({ ...menuItemData })
    .select("*")
    .eq("itemid",itemid)
     
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

router.get("/getItemList/:restaurantId", async (req, res) => {
  const { restaurantId } = req.params;
  try {
    const { data, error } = await supabaseInstance
      .from("Menu_Item")
      .select("*")
      .eq("restaurantId", restaurantId)
     
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

router.get("/getItem/:itemid", async (req, res) => {
  const {itemid} = req.params;
  try {
    const { data, error } = await supabaseInstance
      .from("Menu_Item")
      .select("*")
      .eq("itemid",itemid)

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

router.post("/upsertMenuItemImage",upload.single('file'), async (req, res) => {
  const { itemid } = req.body;

  try {
    const { data, error } = await supabaseInstance
      .storage
      .from('menu-item-image')
      .upload(itemid + ".webp", req.file.buffer, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'image/webp'
      })

    if (data?.path) {
      const publickUrlresponse = await supabaseInstance.storage.from('menu-item-image').getPublicUrl(data?.path);
      if (publickUrlresponse?.data?.publicUrl) {
        const publicUrl = publickUrlresponse?.data?.publicUrl;
        const menuData = await supabaseInstance.from("Menu_Item").update({ item_image_url: `${publicUrl}?${Date.now}` }).eq("itemid", itemid).select("*").maybeSingle();
        res.status(200).json({
          success: true,
          data: menuData.data,
        });
      } else {
        throw publickUrlresponse.error || "Getting Error in PublicUrl"
      }
    } else {
      throw error
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error });
  }
})

module.exports = router;
