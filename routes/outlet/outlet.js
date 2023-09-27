var express = require("express");
var router = express.Router();
var supabaseInstance = require("../../services/supabaseClient").supabase;
var {outletSelectString} = require("../../services/supabaseCommonValues").value;
const multer = require("multer");
const upload = multer();
const axios = require('axios');
var msg91config = require("../../configs/msg91Config");
const { sendMobileSMS,sendEmail } = require("../../services/msf91Service");


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
    logo
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
        isDelivery,    
        isDineIn,
        isPickUp
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

      if (!isPrimaryOutlet) {
       postObject.primaryOutletId = primaryOutletId;
      } else {
        postObject.primaryOutletId = null;
      }
      const inserRestaurentNewkDetails = await supabaseInstance.from("Outlet").insert(postObject).select("*").maybeSingle();

      const taxPostBody = [
        {outletId, taxname: "CGST"},
        {outletId, taxname: "SGST"}
      ]
      const taxResponse = await supabaseInstance.from("Tax").insert(taxPostBody).select();

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

router.post("/upsertFssaiLicensePhoto",upload.single('file'), async (req, res) => {
  const { outletId } = req.body;
  console.log("outletId--->",outletId)
  try {
    const { data, error } = await supabaseInstance
      .storage
      .from('fssai-license')
      .upload(outletId + ".webp", req.file.buffer, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'image/webp'
      })

    if (data?.path) {
      const publickUrlresponse = await supabaseInstance.storage.from('fssai-license').getPublicUrl(data?.path);
      if (publickUrlresponse?.data?.publicUrl) {
        const publicUrl = publickUrlresponse?.data?.publicUrl;
        const outletData = await supabaseInstance.from("Outlet").update({ FSSAI_License:`${publicUrl}?${new Date().getTime()}`}).eq("outletId", outletId).select(outletSelectString).maybeSingle();
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
  const { page, perPage,searchText,searchCity,sortBy } = req.query;
  const pageNumber = parseInt(page) || 1;
  const itemsPerPage = parseInt(perPage) || 10;
  try {
     let query = supabaseInstance
      .from("Outlet")
      .select("*, restaurantId(*), campusId(*),outletAdminId(*), bankDetailsId (*),cityId(*)), Tax!left(taxid, taxname, tax)", { count: "exact" })
      .range((pageNumber - 1) * itemsPerPage, pageNumber * itemsPerPage - 1)
      // .order("outletName", { ascending: true })
      .eq("isPrimaryOutlet",true)

      if(searchText){
        query = query.or(`address.ilike.%${searchText}%,outletName.ilike.%${searchText}%`);
      }

      if (searchCity) {
        query = query.eq("cityId",searchCity);
       }
  
       if (sortBy === "name") {
        query = query.order("outletName", { ascending: true });
       }else if(sortBy === "date"){
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
      }else{
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
      if(searchText) {
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
      if(searchText) {
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
  const bankDetailsData= outletData?.bankDetailsId;
  const outletAdminId = outletData?.outletAdminId;
  const timeDetailsData = outletData?.Timing;
  const categoryDetailsData = outletData?.Restaurant_category;
  delete outletAdminId?.email;
  delete  outletData?.bankDetailsId;
  delete  outletData?.outletAdminId;
  delete  outletData?.Restaurant_category;
  delete  outletData?.Timing;
  delete  outletData?.isBoth;
  delete  outletData?.isBothFood;
  delete  outletData?.password;

   try {
    if (bankDetailsData) {
      const bankDetails = await supabaseInstance.from("BankDetails").update({...bankDetailsData }).eq("bankDetailsId",bankDetailsData.bankDetailsId).select("*");
    }
    
    if (categoryDetailsData?.length > 0) {
      const categoryDataDelete =await  supabaseInstance.from("Restaurant_category").delete().eq("outletId",outletId);
      for(let category of categoryDetailsData ) {
        const categoryData = await supabaseInstance.from("Restaurant_category").insert({categoryId:category,outletId}).select("*");
      }
    }

    // if (timeDetailsData?.length > 0) {
    //   const timingDataDelete = await supabaseInstance.from("Timing").delete().eq("outletId",outletId);
    //   for(let data of timeDetailsData){
    //     const timingData = await supabaseInstance.from("Timing").insert({outletId, dayId: data.dayId, openTime: data.openTime, closeTime: data.closeTime }).select("*");
    //   }
    // }
    if(timeDetailsData?.length > 0){
      for(let data of timeDetailsData){
      const timingData = await supabaseInstance
      .from("Timing")
      .update({openTime:data.openTime,closeTime:data.closeTime })
      .eq("timeId",data.timeId)
      .select("*");
      }
    }
    
    if (outletAdminId) {
      const outletAdminDetails = await supabaseInstance.from("Outlet_Admin").update({...outletAdminId }).eq("outletAdminId",outletAdminId.outletAdminId).select("*");
    }

    const { data, error } = await supabaseInstance
     .from("Outlet")
     .update( {...outletData})
     .eq("outletId",outletId)
     .select("*,bankDetailsId(*),outletAdminId(*),Timing!left(*),Restaurant_category!left(categoryId)");
  
     if (data) {
      console.log
         res.status(200).json({
           success: true,
           message: "Data updated succesfully",
           data:data
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
  const {packaging_charge}  = req.body;

  try {
    const { data, error } = await supabaseInstance
      .from("Outlet")
      .update({packaging_charge})
      .eq("outletId",outletId)
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

router.post("/publishOutlet/:outletId", async (req, res) => {
  const { outletId } = req.params;
  try {
    const { data, error } = await supabaseInstance
      .from("Outlet")
      .update({isPublished: true, publishProcessingStep: 3})
      .eq("outletId",outletId)
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
  const {petPoojaAppKey,petPoojaAppSecret,petPoojaApAccessToken,petPoojaRestId,publishProcessingStep} = req.body;
  
  try {
    const postbody = { petPoojaAppKey,petPoojaAppSecret,petPoojaApAccessToken,petPoojaRestId };
    if (publishProcessingStep) {
      postbody.publishProcessingStep = publishProcessingStep;
    }
    const {data, error} = await supabaseInstance
        .from("Outlet")
        .update(postbody)
        .select(outletSelectString)
        .eq("outletId",outletId)

    if (data) {
      res.status(200).json({
        success: true,
        message: "Data updated succesfully",
        data:data
      });
    } else {
      throw error;
    }
   
  } catch (error) {
    console.log(error)
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/upsertLogoImage",upload.single('file'), async (req, res) => {
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
        const outletData = await supabaseInstance.from("Outlet").update({ logo:`${publicUrl}?${new Date().getTime()}`}).eq("outletId", outletId).select(outletSelectString).maybeSingle();

        if(outletData?.isPrimaryOutlet === true){
          await supabaseInstance.from("Outlet").update({ logo:`${publicUrl}?${new Date().getTime()}`}).eq("primaryOutletId", outletData.primaryOutletId).select("*").maybeSingle();
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

router.post("/upsertHeaderImage",upload.single('file'), async (req, res) => {
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
        const outletData = await supabaseInstance.from("Outlet").update({ headerImage:`${publicUrl}?${new Date().getTime()}`}).eq("outletId", outletId).select(outletSelectString).maybeSingle();
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

//!!!  Delete After 2 Days [07-09-2023]
router.get("/getOutletList/:campusId", async (req, res) => {
  const {campusId} = req.params;
  const { page, perPage, searchText, categoryId } = req.query;
  const pageNumber = parseInt(page) || 1;
  const itemsPerPage = parseInt(perPage) || 10;
  try {
    let query = supabaseInstance
      .rpc('get_outlet_list', { category_id: categoryId ? categoryId : null,campus_id:campusId, week_day: moment().format('dddd') }, {count: "exact"})
      .eq("is_published",true)
      .eq("is_active",true)
      .range((pageNumber - 1) * itemsPerPage, pageNumber * itemsPerPage - 1)
      .order("outlet_name", { ascending: true })
    if (searchText) {
      query = query.or(`address.ilike.%${searchText}%,outlet_name.ilike.%${searchText}%`);
    }
  
    const { data, error, count } = await query;

    if (data) {
      // let outletData = data.map(m => ({...m, Timing: m?.Timing?.find(f => f.dayId?.day)})).map(m => {
      let outletData = data.map(m => {
        let flag = false;
        if (m?.open_time && m?.close_time) {
          const time = moment(moment().format('hh:mm:ss'), 'hh:mm:ss');
          const beforeTime = moment(m?.open_time, 'hh:mm:ss');
          const afterTime = moment(m?.close_time, 'hh:mm:ss');
    
          flag = time.isBetween(beforeTime, afterTime);
        }

        if (!flag && m.is_time_extended) {
          flag = true;
        }
        return {
          ...m,
          isOutletOpen: flag
        }
      })

      const totalPages = Math.ceil(count / itemsPerPage);
      res.status(200).json({
        success: true,
        data: outletData,
        categoryId,
        meta: {
          page: pageNumber,
          perPage: itemsPerPage,
          totalPages,
          totalCount: count,
        },
      });
    } else{
      throw error
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

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