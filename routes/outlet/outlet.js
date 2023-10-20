var express = require("express");
var router = express.Router();
var supabaseInstance = require("../../services/supabaseClient").supabase;
var { outletSelectString } = require("../../services/supabaseCommonValues").value;
const multer = require("multer");
const upload = multer();
const axios = require('axios');
var msg91config = require("../../configs/msg91Config");
const { sendMobileSMS, sendEmail } = require("../../services/msf91Service");


router.post("/createOutlet", async (req, res) => {
  const {
    outletName,
    email,
    isPrimaryOutlet,
    primaryOutletId,
    password,
    bankDetailsId,
    outletAdminId,
    cityId,
    restaurantName,
    mobile,
    GSTIN,
    campusId,
    address,
    openTime,
    closeTime,
    Restaurant_category,
    Timing,
    isDelivery,
    isDineIn,
    isPickUp,
    isGSTShow,
    logo,
    FSSAI_number,
    convenienceFee,
    commissionFee,
    bankLabel,
    isVeg,
    isNonVeg
  } = req.body;
  try {
    const { data, error } = await supabaseInstance.auth.signUp(
      {
        email: email,
        password: password,
        options: {
          data: {
            isRestaurant: false,
            isOutlet: true,
          }
        }
      })
    if (data?.user) {
      const outletId = data.user.id;


      const bankDetails = await supabaseInstance.from("BankDetails").insert({ accountNumber: bankDetailsId?.accountNumber || null, BankName: bankDetailsId?.BankName || null, IFSCCode: bankDetailsId?.IFSCCode || null, bankId: bankDetailsId?.bankId || null }).select().maybeSingle();
      const _bankDetailsId = bankDetails.data.bankDetailsId;

      const outletDetails = await supabaseInstance.from("Outlet_Admin").insert({ name: outletAdminId?.name || null, mobile: outletAdminId?.mobile || null, email: outletAdminId?.email || null, address: outletAdminId?.address || null, pancard: outletAdminId?.pancard || null }).select().maybeSingle();
      const _outletAdminId = outletDetails.data.outletAdminId;

      let postObject = {
        outletId,
        outletName,
        restaurantName,
        email,
        mobile,
        GSTIN,
        bankDetailsId: _bankDetailsId,
        outletAdminId: _outletAdminId,
        campusId,
        address,
        cityId,
        isPrimaryOutlet,
        primaryOutletId,
        isGSTShow,
        isVeg,
        isNonVeg
      }
      if (openTime) {
        postObject.openTime = openTime;
      }
      if (closeTime) {
        postObject.closeTime = closeTime;
      }
      if (isDelivery) {
        postObject.isDelivery = true;
      }
      if (isDineIn) {
        postObject.isDineIn = true;
      }
      if (isPickUp) {
        postObject.isPickUp = true;
      }
      if (logo) {
        postObject.logo = logo;
      }

      if (FSSAI_number) {
        postObject.FSSAI_number = FSSAI_number;
      }

      if (convenienceFee) {
        postObject.convenienceFee = convenienceFee;
      }

      if (commissionFee) {
        postObject.commissionFee = commissionFee;
      }

      if (bankLabel) {
        postObject.bankLabel = bankLabel;
      }

      if (!isPrimaryOutlet) {
        postObject.primaryOutletId = primaryOutletId;
      } else {
        postObject.primaryOutletId = null;
      }
      const inserRestaurentNewkDetails = await supabaseInstance.from("Outlet").insert(postObject).select("*").maybeSingle();

      const taxPostBody = [
        { outletId, taxname: "CGST" },
        { outletId, taxname: "SGST" }
      ]
      const taxResponse = await supabaseInstance.from("Tax").insert(taxPostBody).select();

      const outletRole = await supabaseInstance
        .from("Outlet_Role")
        .insert({
          role: "Order Management", outletId: outletId, access: [
            "Restaurants",
            "Payments",
            "Users",
            "Dashboard",
            "Configuration"
          ]
        })
        .select("*")

      for (let outletItem of Restaurant_category) {
        const outletCategoryResponse = await supabaseInstance
          .from("Restaurant_category")
          .insert({ outletId, categoryId: outletItem })
          .select("*")
          .maybeSingle();
      }

      for (let data of Timing) {
        const outletTimeResponse = await supabaseInstance
          .from("Timing")
          .insert({ outletId, dayId: data.dayId, openTime: data.openTime, closeTime: data.closeTime })
          .select("*")
          .maybeSingle();
      }


      if (inserRestaurentNewkDetails.data) {
        res.send({
          success: true,
          message: "Outlet created successfully",
          data: inserRestaurentNewkDetails.data,

        });
      } else {
        throw inserRestaurentNewkDetails.error
      }
    } else {
      throw error;
    }
  } catch (error) {
    console.log(error)
    res.status(500).json({ success: false, error: error.message });
  }
})

router.post("/upsertFssaiLicensePhoto", upload.single('file'), async (req, res) => {
  const { outletId } = req.body;
  // console.log("outletId--->", outletId)

  try {

    let query = supabaseInstance
      .storage
      .from('fssai-license')

    if (req?.file?.mimetype.includes('image')) {
      query = query.upload(outletId + ".webp", req.file.buffer, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'image/webp'
      })
    } else if (req?.file?.mimetype === 'application/pdf') {
      query = query.upload(outletId + ".pdf", req.file.buffer, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'application/pdf'
      })
    } else {
      throw req?.file?.mimetype?.error
    }

    const { data, error } = await query;

    if (data?.path) {
      const publickUrlresponse = await supabaseInstance.storage.from('fssai-license').getPublicUrl(data?.path);
      if (publickUrlresponse?.data?.publicUrl) {
        const publicUrl = publickUrlresponse?.data?.publicUrl;
        const outletData = await supabaseInstance.from("Outlet").update({ FSSAI_License: `${publicUrl}?${new Date().getTime()}` }).eq("outletId", outletId).select(outletSelectString).maybeSingle();
        res.status(200).json({
          success: true,
          data: outletData.data,
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

router.get("/getPrimaryOutletList", async (req, res) => {
  const { page, perPage, searchText, searchCity, sortBy } = req.query;
  const pageNumber = parseInt(page) || 1;
  const itemsPerPage = parseInt(perPage) || 10;
  try {
    let query = supabaseInstance
      .from("Outlet")
      .select("*, restaurantId(*), campusId(*),outletAdminId(*), bankDetailsId (*),cityId(*)), Tax!left(taxid, taxname, tax)", { count: "exact" })
      .range((pageNumber - 1) * itemsPerPage, pageNumber * itemsPerPage - 1)
      // .order("outletName", { ascending: true })
      .eq("isPrimaryOutlet", true)

    if (searchText) {
      query = query.or(`address.ilike.%${searchText}%,outletName.ilike.%${searchText}%`);
    }

    if (searchCity) {
      query = query.eq("cityId", searchCity);
    }

    if (sortBy === "name") {
      query = query.order("outletName", { ascending: true });
    } else if (sortBy === "date") {
      query = query.order("created_at", { ascending: false });
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
      throw error
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/getOutletListByRestaurantId/:outletId", async (req, res) => {
  const { outletId } = req.params;
  const { page, perPage, searchText } = req.query;
  const pageNumber = parseInt(page) || 1;
  const itemsPerPage = parseInt(perPage) || 10;
  try {
    let query = supabaseInstance
      .from("Outlet")
      .select("*, restaurantId(*), campusId(*),outletAdminId(*), bankDetailsId (*),cityId(*),Timing(*)), Tax!left(taxid, taxname, tax)", { count: "exact" })
      .range((pageNumber - 1) * itemsPerPage, pageNumber * itemsPerPage - 1)
      .order("outletName", { ascending: true })
      .eq("outletId", outletId)
    if (searchText) {
      query = query.or(`address.ilike.%${searchText}%,outletName.ilike.%${searchText}%`);
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
      throw error
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/getOutletListByPrimaryOutletId/:primaryOutletId", async (req, res) => {
  const { primaryOutletId } = req.params;
  const { page, perPage, searchText } = req.query;
  const pageNumber = parseInt(page) || 1;
  const itemsPerPage = parseInt(perPage) || 10;
  try {
    let query = supabaseInstance
      .from("Outlet")
      .select("*, primaryOutletId(*),restaurantId(*), campusId(*),outletAdminId(*), bankDetailsId (*),cityId(*)), Tax!left(taxid, taxname, tax)", { count: "exact" })
      .range((pageNumber - 1) * itemsPerPage, pageNumber * itemsPerPage - 1)
      .order("outletName", { ascending: true })
      .eq("primaryOutletId", primaryOutletId)
    if (searchText) {
      query = query.or(`address.ilike.%${searchText}%,outletName.ilike.%${searchText}%`);
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
      throw error
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/updateOutlet/:outletId", async (req, res) => {

  const { outletId } = req.params;
  const outletData = req.body;
  const bankDetailsData = outletData?.bankDetailsId;
  const outletAdminId = outletData?.outletAdminId;
  const timeDetailsData = outletData?.Timing;
  const categoryDetailsData = outletData?.Restaurant_category;
  delete outletAdminId?.email;
  delete outletData?.bankDetailsId;
  delete outletData?.outletAdminId;
  delete outletData?.Restaurant_category;
  delete outletData?.Timing;
  delete outletData?.isBoth;
  delete outletData?.isBothFood;
  delete outletData?.password;

  console.log("outletData", outletData.convenienceFee)

  try {
    if (bankDetailsData) {
      const bankDetails = await supabaseInstance.from("BankDetails").update({ ...bankDetailsData }).eq("bankDetailsId", bankDetailsData.bankDetailsId).select("*");
    }

    if (categoryDetailsData?.length > 0) {
      const categoryDataDelete = await supabaseInstance.from("Restaurant_category").delete().eq("outletId", outletId);
      for (let category of categoryDetailsData) {
        const categoryData = await supabaseInstance.from("Restaurant_category").insert({ categoryId: category, outletId }).select("*");
      }
    }

    // if (timeDetailsData?.length > 0) {
    //   const timingDataDelete = await supabaseInstance.from("Timing").delete().eq("outletId",outletId);
    //   for(let data of timeDetailsData){
    //     const timingData = await supabaseInstance.from("Timing").insert({outletId, dayId: data.dayId, openTime: data.openTime, closeTime: data.closeTime }).select("*");
    //   }
    // }
    if (timeDetailsData?.length > 0) {
      for (let data of timeDetailsData) {
        const timingData = await supabaseInstance
          .from("Timing")
          .update({ openTime: data.openTime, closeTime: data.closeTime })
          .eq("timeId", data.timeId)
          .select("*");
      }
    }

    if (outletAdminId) {
      const outletAdminDetails = await supabaseInstance.from("Outlet_Admin").update({ ...outletAdminId }).eq("outletAdminId", outletAdminId.outletAdminId).select("*");
    }

    if (req?.body?.convenienceFee) {
      outletData.convenienceFee = req?.body?.convenienceFee;
    } else {
      delete outletData.convenienceFee;
    }

    if (req?.body?.commissionFee) {
      outletData.commissionFee = req?.body?.commissionFee;
    } else {
      delete outletData.commissionFee;
    }

    if (req?.body?.packaging_charge) {
      outletData.packaging_charge = req?.body?.packaging_charge;
    } else {
      delete outletData.packaging_charge;
    }

    if (req?.body?.FSSAI_number) {
      outletData.FSSAI_number = req?.body?.FSSAI_number;
    } else {
      delete outletData.FSSAI_number;
    }

    if (req?.body?.bankLabel) {
      outletData.bankLabel = req?.body?.bankLabel;
    } else {
      delete outletData.bankLabel;
    }


    const { data, error } = await supabaseInstance
      .from("Outlet")
      .update({ ...outletData })
      .eq("outletId", outletId)
      .select("*,bankDetailsId(*),outletAdminId(*),Timing!left(*),Restaurant_category!left(categoryId)");

    if (data) {
      console.log
      res.status(200).json({
        success: true,
        message: "Data updated succesfully",
        data: data
      });
    } else {
      throw error;
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error });
  }
})

router.post("/updatePackagingCharge/:outletId", async (req, res) => {
  const { outletId } = req.params;
  const { packaging_charge } = req.body;

  try {
    const { data, error } = await supabaseInstance
      .from("Outlet")
      .update({ packaging_charge })
      .eq("outletId", outletId)
      .select("*");

    if (data) {
      console.log("data-->", data)
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

router.post("/publishOutlet/:outletId", async (req, res) => {
  const { outletId } = req.params;
  try {
    const { data, error } = await supabaseInstance
      .from("Outlet")
      .update({ isPublished: true, publishProcessingStep: 3 })
      .eq("outletId", outletId)
      .select("*").maybeSingle();

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

router.post("/updatePetPooja/:outletId", async (req, res) => {
  const { outletId } = req.params;
  const { petPoojaAppKey, petPoojaAppSecret, petPoojaApAccessToken, petPoojaRestId, publishProcessingStep } = req.body;

  try {
    const postbody = { petPoojaAppKey, petPoojaAppSecret, petPoojaApAccessToken, petPoojaRestId };
    if (publishProcessingStep) {
      postbody.publishProcessingStep = publishProcessingStep;
    }
    const { data, error } = await supabaseInstance
      .from("Outlet")
      .update(postbody)
      .select(outletSelectString)
      .eq("outletId", outletId)

    if (data) {
      res.status(200).json({
        success: true,
        message: "Data updated succesfully",
        data: data
      });
    } else {
      throw error;
    }

  } catch (error) {
    console.log(error)
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/upsertLogoImage", upload.single('file'), async (req, res) => {
  const { outletId } = req.body;
  try {
    const { data, error } = await supabaseInstance
      .storage
      .from('logo-images')
      .upload(outletId + ".webp", req.file.buffer, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'image/webp'
      })

    if (data?.path) {
      const publickUrlresponse = await supabaseInstance.storage.from('logo-images').getPublicUrl(data?.path);
      if (publickUrlresponse?.data?.publicUrl) {
        const publicUrl = publickUrlresponse?.data?.publicUrl;
        const outletData = await supabaseInstance.from("Outlet").update({ logo: `${publicUrl}?${new Date().getTime()}` }).eq("outletId", outletId).select(outletSelectString).maybeSingle();

        if (outletData?.isPrimaryOutlet === true) {
          await supabaseInstance.from("Outlet").update({ logo: `${publicUrl}?${new Date().getTime()}` }).eq("primaryOutletId", outletData.primaryOutletId).select("*").maybeSingle();
        }

        res.status(200).json({
          success: true,
          data: outletData.data,
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

router.post("/upsertHeaderImage", upload.single('file'), async (req, res) => {
  const { outletId } = req.body;
  try {
    const { data, error } = await supabaseInstance
      .storage
      .from('header-images')
      .upload(outletId + ".webp", req.file.buffer, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'image/webp'
      })

    if (data?.path) {
      const publickUrlresponse = await supabaseInstance.storage.from('header-images').getPublicUrl(data?.path);
      if (publickUrlresponse?.data?.publicUrl) {
        const publicUrl = publickUrlresponse?.data?.publicUrl;
        const outletData = await supabaseInstance.from("Outlet").update({ headerImage: `${publicUrl}?${new Date().getTime()}` }).eq("outletId", outletId).select(outletSelectString).maybeSingle();
        res.status(200).json({
          success: true,
          data: outletData.data,
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

router.get("/getOutletData/:outletId", async (req, res) => {
  const { outletId } = req.params;
  try {
    const { data, error } = await supabaseInstance.from("Outlet").select(outletSelectString).eq("outletId", outletId).maybeSingle();
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

router.post("/pushMenuData/:outletId", async (req, res) => {
  const { outletId } = req.params
  const { category, subCategory, item } = req.body;

  let serverCategory = [];
  let serverSubCategory = [];
  let serverItem = [];
  
  try {
    if (category?.length > 0) {
      for (const categoryItem of category) {
        let postData = {
          parentCategoryName: categoryItem?.parentCategoryName,
          outletId,
          status: categoryItem?.status,
          parent_category_image_url: categoryItem?.parent_category_image_url || null,
          isFromPrimaryOutletId: true
        }

        const categoryAddResponse = await supabaseInstance.from("Menu_Parent_Categories").insert({ ...postData }).select("*").maybeSingle();
        if (categoryAddResponse.data) {
          categoryItem.serverResponse = categoryAddResponse.data;
          serverCategory.push(categoryAddResponse.data)
        }
      }
    }

    if (subCategory?.length > 0) {
      for (const subcategoryItem of subCategory) {
        let postData = {
          categoryname: subcategoryItem.categoryname,
          outletId,
          category_image_url: subcategoryItem?.category_image_url || null,
          status: subcategoryItem.status,
          isFromPrimaryOutletId: true,
          parent_category_id: category?.find(f => f?.parent_category_id === subcategoryItem?.parent_category_id)?.serverResponse?.parent_category_id || null
        };

        const subCategoryData = await supabaseInstance.from("Menu_Categories").insert(postData).select("*").maybeSingle();
        if (subCategoryData.data) {
          subcategoryItem.serverResponse = subCategoryData.data;
          serverSubCategory.push(subCategoryData.data)
        }
      }
    }

    if (item?.length > 0) {
      for (const itemItem of item) {
        const postData = {
          outletId,
          itemname: itemItem.itemname,
          attributeid: itemItem.attributeid || null,
          price: itemItem.price,
          itemdescription: itemItem.itemdescription,
          itemdescription: itemItem.itemdescription,
          minimumpreparationtime: itemItem.minimumpreparationtime,
          kcal: itemItem.kcal,
          servinginfo: itemItem.servinginfo,
          dietary_restriction_id: itemItem.dietary_restriction_id,
          spice_level_id: itemItem.spice_level_id || null,
          status: itemItem.status,
          isDelete: itemItem.isDelete,
          isFromPrimaryOutletId: true,
          item_categoryid: subCategory?.find(f => f?.categoryid === itemItem?.item_categoryid)?.serverResponse?.categoryid || null
        }

        const menuItemData = await supabaseInstance.from("Menu_Item").insert(postData).select("*").maybeSingle();
        if (menuItemData.data) {
          serverItem.push(menuItemData.data);
        } else {
          console.log(menuItemData);
        }
      }
    }

    res.status(200).json({
      success: true,
      data: {
        menuItemData: serverItem || [],
        categoryData: serverCategory || [],
        subCategoryData: serverSubCategory || []
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: error.message || error });
  }

})


// router.post("/resetOutletPassword/:outletId", async (req, res) => {
//   const { outletId } = req.params;
//   try {
//     const _password = (Math.random() + 1).toString(36).substring(4);
//     console.log("_password==>",_password)
//     const { data, error } = await supabaseInstance.auth.admin.updateUserById(outletId, {password: _password});
//     if (data) {
//       const outletData = await supabaseInstance.from("Outlet").select("*").eq("outletId", outletId).maybeSingle();
//       if(outletData?.data){
//         // const sendMobileSMSResponse = await sendMobileSMS([{ mobiles: outletData.data.mobile, name: outletData.data.outletName, outletId: outletId }], msg91config.config);
//         // console.log("sendMobileSMSResponse => ", sendMobileSMSResponse);
//         // console.log("outletData.mobile => ", outletData.data.mobile);
//         // console.log("outletData.outletName => ", outletData.data.outletName);
//         // console.log("outletData.outletData.email => ", outletData.data.email);

//         const _email_to = [{name: outletData.data.outletName, email:  outletData.data.email}];
//         // const _email_cc =  []
//         // const _email_bcc =  []
//         // const _template_id =msg91config.config.email_otp_template_id
//         // const sendEmailResponse = await sendEmail(_email_to, _email_cc, _email_bcc, {}, _template_id);
//         // console.log("sendEmailResponse => ", sendEmailResponse);
//         res.status(200).json({
//           success: true,
//           message: "Password Send succesfully",
//         });
//       }else{
//         throw outletData.error
//       }
//     } else {
//       throw error;
//     }
//   } catch (error) {
//     res.status(500).json({ success: false, error: error.message });
//   }
// });


module.exports = router;


// const { data, error } = await supabase
// .storage
// .from('avatars')
// .upload('public/avatar1.png', avatarFile, {
//   cacheControl: '3600',
//   upsert: false
// })
