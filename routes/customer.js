var express = require("express");
var router = express.Router();
const multer = require("multer");
const upload = multer();
var msg91config = require("../configs/msg91Config");
const axios = require('axios');
const moment = require("moment-timezone");
moment().tz("Asia/Kolkata").format();

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
          data: customerResponse.data
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

// router.post("/signUp", async (req, res) => {
//   const { email, mobile, name } = req.body;

//   try {
//     const { data, error } = await supabaseInstance.from("Customer").insert({ email, mobile, customerName: name  }).select("*").maybeSingle()

//     if (data) {
//         res.status(200).json({
//           success: true,
//           message: "SignUp Successfully",
//           data:data
//         });
//       } else {
//         throw error;
//       }
//   } catch (error) {
//     res.status(500).json({ success: false, error: error?.message || error });
//   }
// });


router.post("/sendOTP", async (req, res) => {
  const { email } = req.body;
  try {
    sendEmail(email).then((responseData) => {
      console.log('.then block ran: ', responseData);
      res.status(200).json({
        success: true,
        data: responseData,
      });
    }).catch(err => {
      console.log('.catch block ran: ', err);
      throw err;
    });
  } catch (error) {
    console.log(error)
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/verifyOTP", async (req, res) => {
  const { mobile, otp } = req.body;
  try {
    verifyOTP(mobile, 123456).then((responseData) => {
      console.log('.then block ran: ', responseData);
      res.status(200).json({
        success: true,
        data: responseData,
      });
    }).catch(err => {
      console.log('.catch block ran: ', err);
      throw err;
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/userlogin", async (req, res) => {
  const { mobile, email } = req.body;
  try {
    let loginQuery;
    if (mobile) {
      loginQuery = supabaseInstance.from("Customer").select("*").eq("mobile", mobile);
    } else if (email) {
      loginQuery = supabaseInstance.from("Customer").select("*").eq("email", email);
    }

    const userData = await loginQuery.maybeSingle();
    if (userData?.data) {
      res.send({
        success: true,
        message: "Login successfully",
        data: userData.data,
      });
    } else if (!userData.data && !userData.error) {
      const err = {
        message: "User not found."
      }
      throw err;
    } else {
      throw err;
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/cafeteriaDetails/:outletId/:customerAuthUID", async (req, res) => {
  const { outletId,customerAuthUID } =req.params;
  try {
    const { data, error } = await supabaseInstance.from("Menu_Item").select("*, item_categoryid(*, parent_category_id(*)), FavoriteMenuItem!left(*)").eq("outletId", outletId).eq("FavoriteMenuItem.customerAuthUID", customerAuthUID).eq("status",true);
    if (data) {
      const outdetails = await supabaseInstance.from("Outlet").select("*,Menu_Categories(*)").eq("outletId", outletId);
      const taxdetails = await supabaseInstance.from("Tax").select("*").eq("outletId", outletId);
      res.status(200).json({
        success: true,
        message: "Data fetch succesfully",
        data: {
           outdetails:outdetails.data,
           menuItems:data.map(m => ({...m, isFavoriteMenuItem: m.FavoriteMenuItem?.length > 0})),
           taxdetails:taxdetails.data,
        }
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
    const cafeteriasForYouDataResponse = await supabaseInstance.from("Outlet").select("outletName,address,logo,headerImage,outletId,isActive, isTimeExtended, Timing!left(*, dayId(*))")
    .eq("Timing.dayId.day", moment().format("dddd"))
    .eq("campusId",campusId).eq("isPublished",true).eq("isActive",true).limit(5);

    let PopularCafeteriasResponse = await supabaseInstance.from("Outlet").select("outletName,address,logo,headerImage,outletId,isActive, isTimeExtended, Timing!left(*, dayId(*))")
    .eq("Timing.dayId.day", moment().format("dddd"))
    .eq("campusId",campusId).eq("isPublished",true).eq("isActive",true).limit(5);

    if (cafeteriasForYouDataResponse.data && PopularCafeteriasResponse.data) {
      
      let cafeteriasForYouData = cafeteriasForYouDataResponse.data.map(m => ({...m, Timing: m?.Timing?.find(f => f.dayId?.day)})).map(m => {
        let flag = false;
        if (m?.Timing?.openTime && m?.Timing?.closeTime) {
          const time = moment(moment().format('hh:mm:ss'), 'hh:mm:ss');
          const beforeTime = moment(m?.Timing?.openTime, 'hh:mm:ss');
          const afterTime = moment(m?.Timing?.closeTime, 'hh:mm:ss');
    
          flag = time.isBetween(beforeTime, afterTime);
        }

        if (!flag && m.isTimeExtended) {
          flag = true;
        }
        return {
          ...m,
          isOutletOpen: flag
        }
      })
      let PopularCafeterias = PopularCafeteriasResponse.data.map(m => ({...m, Timing: m?.Timing?.find(f => f.dayId?.day)})).map(m => {
        let flag = false;
        if (m?.Timing?.openTime && m?.Timing?.closeTime) {
          const time = moment(moment().format('hh:mm:ss'), 'hh:mm:ss');
          const beforeTime = moment(m?.Timing?.openTime, 'hh:mm:ss');
          const afterTime = moment(m?.Timing?.closeTime, 'hh:mm:ss');
    
          flag = time.isBetween(beforeTime, afterTime);
        }
        if (!flag && m.isTimeExtended) {
          flag = true;
        }
        return {
          ...m,
          isOutletOpen: flag
        }
      })

      res.status(200).json({
        success: true,
        message: "Data fetch succesfully",
        data:{
          cafeteriasForYouData,
          PopularCafeterias
        }
      });
    } else{
      throw PopularCafeterias.error || cafeteriasForYouDataResponse.error;
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: error });
  }
})

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

router.post("/upsertUserImage",upload.single('file'), async (req, res) => {
  const { customerAuthUID } = req.body;
  try {
    const { data, error } = await supabaseInstance
      .storage
      .from('user-photo')
      .upload(customerAuthUID + ".webp", req.file.buffer, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'image/webp'
      })

    if (data?.path) {
      const publickUrlresponse = await supabaseInstance.storage.from('user-photo').getPublicUrl(data?.path);
      if (publickUrlresponse?.data?.publicUrl) {
        const publicUrl = publickUrlresponse?.data?.publicUrl;
        const userData = await supabaseInstance.from("Customer").update({ photo: `${publicUrl}?${new Date().getTime()}`}).eq("customerAuthUID", customerAuthUID).select("*").maybeSingle();
        res.status(200).json({
          success: true,
          data: userData.data,
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

router.get("/getCustomer/:outletId", async (req, res) => {
  const { outletId } = req.params;
  const { page, perPage,sort,searchText } = req.query;
  const pageNumber = parseInt(page) || 1;
  const itemsPerPage = parseInt(perPage) || 10;
  try {
    let query =  supabaseInstance
      .rpc('get_distinct_customer_name', { outlet_id: outletId },{count:"exact"})
      // .range((pageNumber - 1) * itemsPerPage, pageNumber * itemsPerPage - 1)
      .order("created_at",{ascending:false})

      if(sort){
        query =query.order("customername",{ascending:sort == 'true' ? true : false})
      }
  
      if(searchText){
        query =query.ilike('customername',`%${searchText}%`)
      }

      if(page && perPage){
        query =query.range((pageNumber - 1) * itemsPerPage, pageNumber * itemsPerPage - 1);
      }

    const { data, error, count} = await query;

    if (data) {
      const totalPages = Math.ceil(count / itemsPerPage);

      let response = {
        success: true,
        data: data
      }

      if(page && perPage) {
        response.meta = {
          page: pageNumber,
          perPage: itemsPerPage,
          totalPages,
          totalCount:count
        }
      }
      res.status(200).json({
        ...response
      });
    } else {
      throw error
    }
  } catch (error) {
    console.log(error)
    res.status(500).json({ success: false, error: error.message });
  }
})

router.post("/updateCustomer/:customerAuthUID", async (req, res) => {
  const { customerAuthUID } = req.params;
  const {customerName,email,mobile,dob,genderId} =req.body;
  try {
    const { data, error } = await supabaseInstance
    .from("Customer")
    .update({customerName,email,mobile,dob,genderId})
    .select("*")
    .eq("customerAuthUID",customerAuthUID)
     
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


const MSG91_AUTH_KEY = msg91config.config.auth_key;
const MSG91_OTP_ENDPOINT = 'https://control.msg91.com/api/v5/otp';

async function sendOTP(mobile) {
  try {
    const response = await axios.post(MSG91_OTP_ENDPOINT, {
      authkey: MSG91_AUTH_KEY,
      mobile: mobile,
    });

    const responseData = response.data;
    if (responseData.type === 'success') {
      console.log('OTP sent successfully');
      console.log(responseData);
      return responseData;
    } else {
      console.error('Failed to send OTP:', responseData.message);
      return null;
    }
  } catch (error) {
    console.error('Error sending OTP:', error.message);
    return null;
  }
}

const MSG91_OTP_VERIFY_ENDPOINT = 'https://api.msg91.com/api/v5/otp/verify';

async function verifyOTP(mobile, otp) {
  try {
    // const response = await axios.post(MSG91_OTP_VERIFY_ENDPOINT, {
    //   authkey: MSG91_AUTH_KEY,
    //   mobile: mobile ,
    //   otp: 123456,
    // });

    // const responseData = response.data;
    // console.log("response.data",response.data)
    // if (responseData.type === 'success') {
    //   console.log('OTP verification successful');
    //   return responseData;
    // } else {
    //   console.error('OTP verification failed:', responseData.message);
    //   return null;
    // }


    if (otp === 123456) {
      console.log('OTP verification successful');
      return {
        success: true,
        message: 'OTP verification successful'

      };
    } else {
      console.error('OTP verification failed:');
      return null;
    }
  } catch (error) {
    console.error('Error verifying OTP:', error.message);
    return null;
  }
}

const MSG91_EMAIL_ENDPOINT ="https://control.msg91.com/api/v5/email/send"

async function sendEmail( email) {
  try {
    const response = await axios.post(MSG91_EMAIL_ENDPOINT, {
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        authkey: MSG91_AUTH_KEY,
      },
      data: {
        recipients: [
          {
            to: [{ email: email }],
          },
        ],
      },
    });

    const responseData = response.data;
    if (responseData.type === 'success') {
      console.log('Email sent successfully');
      console.log(responseData);
      return responseData;
    } else {
      console.error('Failed to send email:', responseData.message);
      return null;
    }
  } catch (error) {
    console.error('Error sending email:', error.message);
    return null;
  }
}


module.exports = router;

// console.log(
//   arr.map(m => ({...m, Timing: m?.Timing?.find(f => f.dayId?.day)}))
//   .map(m => {
//     let flag = false;

//     if (m?.Timing?.openTime && m?.Timing?.closeTime) {
//       const time = moment(moment().format('hh:mm:ss'), 'hh:mm:ss');
//       const beforeTime = moment(m?.Timing?.openTime, 'hh:mm:ss');
//       const afterTime = moment(m?.Timing?.closeTime, 'hh:mm:ss');

//       flag = time.isBetween(beforeTime, afterTime);
//     }

//     return {
//       ...m,
//       isOutletOpen: flag
//     }
//   })
// )
 

// console.log(moment().format('dddd'));