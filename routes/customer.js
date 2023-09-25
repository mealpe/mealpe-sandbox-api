var express = require("express");
var router = express.Router();
const multer = require("multer");
const upload = multer();
var msg91config = require("../configs/msg91Config");
const axios = require('axios');
// const moment = require("../services/momentService").momentIndianTimeZone;
const moment = require("moment-timezone");
const { sendMobileOtp, verifyMobileOtp, sendEmail ,sendMobileSMS, generateOTP} = require("../services/msf91Service");
var cryptoJs = require("crypto-js");

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


router.post("/sendMobileOTP", async (req, res) => {
  //* if mobile => required[mobile];

  const { mobile} = req.body;
  try {
     sendMobileOtp(mobile, msg91config.config.otp_template_id).then((responseData) => {
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

router.post("/verifyMobileOTP", async (req, res) => {
  //* if mobile => required[mobile, otp];
  //* if email  => required[email, token];
  const { mobile, otp, email, token } = req.body;
  try {
      verifyMobileOtp(mobile, otp).then((responseData) => {
        console.log('.then block ran: ', responseData);
        if (responseData?.api_success) {
          res.status(200).json({
            success: true,
            data: responseData,
          });
        } else {
          throw responseData;
        }
      }).catch(err => {
        console.log('.catch block ran: ', err);
        res.status(500).json({ success: false, error: err });
      });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/sendEmailOTP", async (req, res) => {
  //* if email => required[email];

  const { email_to,email_cc, email_bcc} = req.body;
  try {
    const token_otp = generateOTP();

    //* email_to ex. => [{name: 'Recipient1 NAME', email: 'Recipient1 email'}]
    //* email_cc ex. => [{name: 'Recipient2 NAME', email: 'Recipient2 email'}]
    //* email_bcc ex. => [{name: 'Recipient3 NAME', email: 'Recipient3 email'}]
    //* emailVariables ex. => {name: 'Name 1'}
    //* template_id (string)

    const _email_to = [{name: 'Customer', email: email_to}];
    const _email_cc =  []
    const _email_bcc =  []
    const _template_id =msg91config.config.email_otp_template_id


    sendEmail(_email_to, _email_cc, _email_bcc, {}, _template_id).then((responseData) => {
      const hash = cryptoJs.AES.encrypt(token_otp.toString(), "MealPE-OTP").toString();
       if (responseData?.api_success) {
        res.status(200).json({
          success: true,
          data: responseData,
          token: hash
        });
      } else {
        throw responseData;
      }
     }).catch(err => {
      //  console.log('.catch block ran: ', err);
       res.status(500).json({ success: false, error: err });
      });
  } catch (error) {
    // console.log(error)
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/verifyEmailOTP", async (req, res) => {
  const { otp, token } = req.body;
  try {
      const tokenData = cryptoJs.AES.decrypt(token, "MealPE-OTP").toString(cryptoJs.enc.Utf8);
      if (tokenData === otp) {
          res.status(200).json({
              success: true,
              message: "OTP Verify", 
          });
      }else{
          throw error;
      } 
  } catch (error) {
      res.status(500).json({ success: false, error: error });
  }
});

router.post("/sendMobileSMS", async (req, res) => {

  const { mobile,template_id} = req.body;
  try {
    sendMobileSMS(mobile, template_id).then((responseData) => {
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

// router.post("/verifyEmailOTP", async (req, res) => {
//   //* if email  => required[email, token];
//   const { otp, token } = req.body;
//   try {
//       verifyMobileOtp( otp,token).then((responseData) => {
//         console.log('.then block ran: ', responseData);
//         res.status(200).json({
//           success: true,
//           data: responseData,
//         });
//       }).catch(err => {
//         console.log('.catch block ran: ', err);
//         throw err;
//       });
//   } catch (error) {
//     res.status(500).json({ success: false, error: error.message });
//   }
// });

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
    const { data, error } = await supabaseInstance.from("Menu_Item").select("*, item_categoryid(*, parent_category_id(*)), FavoriteMenuItem!left(*)").eq("isDelete",false).eq("outletId", outletId).eq("FavoriteMenuItem.customerAuthUID", customerAuthUID);
    if (data) {
      const outdetData = await supabaseInstance.from("Outlet").select("*,Menu_Categories(*),isTimeExtended,Timing!left(*, dayId(*))").eq("outletId", outletId).eq("Timing.dayId.day", moment().tz("Asia/Kolkata").format("dddd")).maybeSingle();

      let outletdetails = {};

      if (outdetData?.data) {
        outletdetails = {
          ...outdetData.data,
          Timing: outdetData.data?.Timing?.find(f => f.dayId?.day)
        }

        let flag = false;
        if (outletdetails?.Timing?.openTime && outletdetails?.Timing?.closeTime) {
          const time = moment().tz("Asia/Kolkata");
          const beforeTime = moment(outletdetails?.Timing?.openTime, 'hh:mm:ss');
          const afterTime = moment(outletdetails?.Timing?.closeTime, 'hh:mm:ss');
    
          flag = time.isBetween(beforeTime, afterTime);
        }

        if (!flag && outletdetails.isTimeExtended) {
          flag = true;
        }

        outletdetails.isOutletOpen = flag;
      }

      const taxdetails = await supabaseInstance.from("Tax").select("*").eq("outletId", outletId);

      res.status(200).json({
        success: true,
        message: "Data fetch succesfully",
        data: {
           outdetails:outletdetails,
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
    .eq("Timing.dayId.day", moment().tz("Asia/Kolkata").format("dddd"))
    .eq("campusId",campusId).eq("isPublished",true).eq("isActive",true).limit(5);

    let PopularCafeteriasResponse = await supabaseInstance.from("Outlet").select("outletName,address,logo,headerImage,outletId,isActive, isTimeExtended, Timing!left(*, dayId(*))")
    .eq("Timing.dayId.day", moment().tz("Asia/Kolkata").format("dddd"))
    .eq("campusId",campusId).eq("isPublished",true).eq("isActive",true).limit(5);

    if (cafeteriasForYouDataResponse.data && PopularCafeteriasResponse.data) {
      
      let cafeteriasForYouData = cafeteriasForYouDataResponse.data.map(m => ({...m, Timing: m?.Timing?.find(f => f.dayId?.day)})).map(m => {
        let flag = false;
        if (m?.Timing?.openTime && m?.Timing?.closeTime) {
          const time = moment().tz("Asia/Kolkata");
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
          const time = moment().tz("Asia/Kolkata");
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
      .rpc('get_outlet_list', { category_id: categoryId ? categoryId : null,campus_id:campusId, week_day: moment().tz("Asia/Kolkata").format('dddd') }, {count: "exact"})
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
          const time = moment().tz("Asia/Kolkata");
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

    let sortQuery = supabaseInstance
      .rpc('get_distinct_customer_name', { outlet_id: outletId },{count:"exact"})

      if(sort){
        query =sortQuery.order("customername",{ascending:sort == 'true' ? true : false})
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

router.get("/realtimeCustomerOrders/:orderId", function (req, res) {
  const {orderId} =req.params;
  res.statusCode = 200;
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("connection", "keep-alive");
  res.setHeader("Content-Type", "text/event-stream"); 

  supabaseInstance.channel(`customer-insert-channel-${orderId}`)
  .on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'Order', filter: `orderId=eq.${orderId}` },
    (payload) => {
      res.write('event: updateorder\n');  //* Updagte order Event
      res.write(`data: ${JSON.stringify(payload?.new || null)}`);
      res.write("\n\n");    
    }
  ).subscribe((status) => {
    console.log("subscribe status for orderId => ", orderId);
  })

  res.write("retry: 10000\n\n");
    req.on('close', () => {
      supabaseInstance.channel(`customer-insert-channel-${orderId}`).unsubscribe()
      .then(res => {
        console.log(".then => ", res);
      }).catch((err) => {
        console.log(".catch => ", err);
      }).finally(() => {
        console.log(`${orderId} Connection closed`);
      });
    });
});

router.get("/getLiveCustomerOrders/:customerAuthUID", async (req, res) => {
  const { customerAuthUID} = req.params;
  try {
    let currentDate = moment().tz("Asia/Kolkata").format('YYYY-MM-DD');

    let query = supabaseInstance
    .rpc('get_live_customer_orders', {customerauthuid:customerAuthUID,targate_date: currentDate})
    .gte("orderstatusid",0)
    .lt("orderstatusid",10)

    const { data, error } = await query;

    if (data) {
      res.status(200).json({
        success: true,
        data: data
      });
    } else {
      throw error
    }
  } catch (error) {
    console.log(error)
    res.status(500).json({ success: false, error: error });
  }
});

router.post("/userGooglelogin", async (req, res) => {
    const { token } = req.body;
try {
  if (!token) {
    throw new Error("Token is missing in the request.");
  }

  const { data, error } = await supabaseInstance.auth.signInWithIdToken({
    provider: 'google',
    token: token,
  });

  if (error) {
    throw error;
  }

  if (data) {
    res.status(200).json({ success: true, data: data });
  } else {
    throw new Error("Authentication failed.");
  }
} catch (error) {
  console.error("Authentication error:", error);
  res.status(500).json({ success: false, error: error.message });
}
});

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
