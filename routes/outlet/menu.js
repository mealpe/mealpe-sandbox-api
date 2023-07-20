var express = require("express");
var router = express.Router();
var supabaseInstance = require("../../services/supabaseClient").supabase;
const multer = require("multer");
const upload = multer();


router.post("/createCategory", async (req, res) => {
  const { outletId, active, categoryname } = req.body;
  try {
    const { data, error } = await supabaseInstance
      .from("Menu_Categories")
      .insert({ outletId, active, categoryname })
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

router.get("/category/:outletId", async (req, res) => {
  const { outletId } = req.params;
  try {
    const { data, error } = await supabaseInstance
      .from("Menu_Categories")
      .select("*")
      .eq("outletId",outletId)

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

router.get("/getAttributes", async (req, res) => {
  try {
    const { data, error } = await supabaseInstance
      .from("Menu_Item_Attributes")
      .select("*")

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

router.get("/getItemList", async (req, res) => {
  const { page, perPage} = req.query; // Extract query parameters
  const pageNumber = parseInt(page) || 1;
  const itemsPerPage = parseInt(perPage) || 10;
  try {
    const { data, error, count } = await supabaseInstance
      .from("Menu_Item")
      .select("*",{ count: "exact" })
      .range((pageNumber - 1) * itemsPerPage, pageNumber * itemsPerPage - 1)

    if (data) {
      const totalPages = Math.ceil(count / itemsPerPage);
      res.status(200).json({
        success: true,
        data: data,
        meta: {
          page: pageNumber,
          perPage: itemsPerPage,
          totalPages,
          totalCount: count,
        },
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

router.post("/createParentCategory", async (req, res) => {
  const { outletId, status, parentCategoryName, category } = req.body;
  try {
    const { data, error } = await supabaseInstance
      .from("Menu_Parent_Categories")
      .insert( {outletId, status, parentCategoryName})
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
      .update({status, parentCategoryName})
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

router.get("/getParentCategory/:outletId", async (req, res) => {
  const {outletId} = req.params
  try {
    const { data, error } = await supabaseInstance
      .from("Menu_Parent_Categories")
      .select("*")
      .eq("outletId",outletId)

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
      .select("*, Menu_Categories!left(*)")
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

module.exports = router;