var express = require("express");
const { saveOrderToPetpooja,updateOrderStatus} = require("../petpooja/pushMenu");
const moment = require("moment-timezone");
moment().tz("Asia/Kolkata").format();
var router = express.Router();
var supabaseInstance = require("../../services/supabaseClient").supabase;


router.post("/createOrder", async (req, res) => {
  const { customerAuthUID, outletId, restaurantId, isDineIn, isPickUp, totalPrice, paymentId, items, pickupTime, orderPriceBreakDown } = req.body;
  try {
    const orderOTP = generateOTP();
    const { data, error } = await supabaseInstance
      .from("Order")
      .insert({ customerAuthUID, outletId, isDineIn, isPickUp, totalPrice, paymentId, orderPriceBreakDown, orderOTP })
      .select("*")

    if (data) {
      const orderId = data[0].orderId;
      let orderData = [];
      for (let data of items) {
        let calculatedPrice = data.qty * data.price;
        let orderitemData = await supabaseInstance
          .from("Order_Item")
          .insert({ orderId: orderId, itemId: data.id, quantity: data.qty, itemPrice: data.price, calculatedPrice: calculatedPrice })
          .select("*")
        orderData.push(orderitemData.data)
      }
      const orderScheduleData = await supabaseInstance
        .from("Order_Schedule")
        .insert({ orderId: orderId, scheduleDate: pickupTime.orderDate, scheduleTime: pickupTime.time })
        .select("*")


      saveOrderToPetpooja(restaurantId, customerAuthUID, orderId, outletId).then((saveOrderToPetpoojaResponse) => {
        console.log('.then block ran: ', saveOrderToPetpoojaResponse.data);
        res.status(200).json({
          success: true,
          data: {
            data: data,
            orderitemData: orderData,
            pickupTime: orderScheduleData.data,
            saveOrderToPetpooja: saveOrderToPetpoojaResponse.data
          }
        });
      }).catch(err => {
        console.log('.catch block ran: ', err);
        throw err;
      });

    } else {
      throw error;
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, error: error });
  }
});

router.get("/getAllOrder/:outletId", async (req, res) => {
  const {outletId} =req.params
  const {page,perPage,orderType,orderSequenceId}=req.query;
  const pageNumber = parseInt(page) || 1;
  const itemsPerPage = parseInt(perPage) || 10;
  try {
    let query =  supabaseInstance
    .rpc("get_orders_for_outlet",{outlet_uuid: outletId},{count:"exact"})
    .order("order_schedule_date",{ascending:false})
    .order("order_schedule_time",{ascending:false})
    .not("outlet_id", "is", null)
    .not("order_schedule_date", "is", null)
    .not("order_schedule_time", "is", null)
    .eq("outlet_id",outletId)
    .range((pageNumber - 1) * itemsPerPage, pageNumber * itemsPerPage - 1)


      
    if (orderType === "dinein") {
      query = query.eq("is_dine_in", true)
    } else if (orderType === "pickup") {
        query = query.eq("is_pick_up", true)
    } else if (orderType === "delivery") {
      query = query.eq("is_delivery", true)
    }

    if (orderSequenceId) {
      query = query.ilike("order_sequence_id", `%${orderSequenceId}%`);
    }

    const {data,error,count} = await query;

    if (data) {
      const totalPages = Math.ceil(count / itemsPerPage);
      res.status(200).json({
        success: true,
        data: data,
        data: data, meta: {
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
    console.log(error)
    res.status(500).json({ success: false, error: error });
  }
});

router.get("/getOrder/:orderId", async (req, res) => {
  const { orderId } = req.params;
  try {
    const {data,error} = await supabaseInstance.from("Order").select("*,customerAuthUID(*),outletId(outletId,outletName,logo,address),Order_Item(*,Menu_Item(itemname,item_image_url)),Order_Schedule(*),orderStatusId(*))").eq("orderId", orderId).maybeSingle();
    if (data) {
      res.status(200).json({
        success: true,
        data: data,
      });
    } else {
      throw error
    }
  } catch (error) {
    console.log(error)
    res.status(500).json({ success: false, error: error });
  }
});

router.get("/getOrderByCustomerAuthId/:customerAuthUID", async (req, res) => {
  const { customerAuthUID } = req.params;
  try {
    const { data, error } = await supabaseInstance.from("Order").select("*,outletId(outletName,logo),Order_Item(*),Order_Schedule(*),orderStatusId(*))").eq("customerAuthUID", customerAuthUID).order("created_at",{ascending:false})
    if (data) {
      res.status(200).json({
        success: true,
        data: data,
      });
    } else {
      throw error
    }
  } catch (error) {
    console.log(error)
    res.status(500).json({ success: false, error: error });
  }
});

router.get("/getUpcomingOrder/:outletId", async (req, res) => {
  const { outletId } = req.params;
  const { orderType, orderStatusId, orderSequenceId } = req.query;
  const formattedTime = moment().format('HH:mm:ss');
  const formattedTimeAdd2Hours = moment(formattedTime, 'HH:mm:ss').add(45, 'minute').format('HH:mm:ss');
  console.log("formattedTimeAdd2Hours",formattedTimeAdd2Hours)

  try {
    // let currentDate = moment().toJSON().slice(0, 10);
    let currentDate = moment().format('YYYY-MM-DD');
    let query = supabaseInstance.rpc("get_orders_for_outlet", {outlet_uuid: outletId})
    .gte("order_schedule_date", currentDate)
    .gt("order_schedule_time", formattedTimeAdd2Hours)
    .eq("order_status_id",0)
    .order("order_schedule_date",{ascending:false})
    .order("order_schedule_time",{ascending:false})
    .order("order_schedule_time", { ascending: false })

    if (orderType === "dinein") {
      query = query.eq("is_dine_in", true)
    } else if (orderType === "pickup") {
        query = query.eq("is_pick_up", true)
    } else if (orderType === "delivery") {
      query = query.eq("is_delivery", true)
    }

    // if (orderStatusId) {
    //   const _orderStatusId = orderStatusId.split(',');
    //   if (_orderStatusId.length > 0) {
    //     query = query.in('order_status_id', _orderStatusId);
    //   }
    // }

    if (orderSequenceId) {
      query = query.ilike("order_sequence_id", `%${orderSequenceId}%`);
    }
    const { data, error, } = await query;

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

router.get("/getCurrentOrder/:outletId", async (req, res) => {
  const { outletId } = req.params;
  const { orderType, orderStatusId, orderSequenceId } = req.query;

  const formattedTime = moment().format('HH:mm:ss');
  const formattedTimeAdd2Hours = moment(formattedTime, 'HH:mm:ss').add(45, 'minute').format('HH:mm:ss');

  try {
    // let currentDate = moment().toJSON().slice(0, 10);
    let currentDate = moment().format('YYYY-MM-DD');
    console.log("currentDate",currentDate)
    let query = supabaseInstance.rpc("get_orders_for_outlet", {outlet_uuid: outletId})
      .eq("order_schedule_date", currentDate)
      // .gte("order_schedule_time", formattedTime)
      .lte("order_schedule_time", formattedTimeAdd2Hours)
      .eq("order_status_id",0)
      .order("order_schedule_date",{ascending:false})
      .order("order_schedule_time",{ascending:false});
    
    if (orderType === "dinein") {
      query = query.eq("is_dine_in", true)
    } else if (orderType === "pickup") {
        query = query.eq("is_pick_up", true)
    } else if (orderType === "delivery") {
      query = query.eq("is_delivery", true)
    }

    // if (orderStatusId) {
    //   const _orderStatusId = orderStatusId.split(',');
    //   if (_orderStatusId.length > 0) {
    //     query = query.in('order_status_id', _orderStatusId);
    //   }
    // }

    if (orderSequenceId) {
      query = query.ilike("order_sequence_id", `%${orderSequenceId}%`);
    }

    const { data, error, } = await query;

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

router.get("/getLiveOrders/:outletId", async (req, res) => {
  const { outletId } = req.params;
  const { orderType, orderStatusId, orderSequenceId } = req.query;

  // const now = new Date();
  // const formattedTime = moment(now).format('HH:mm:ss');
  // const formattedTimeAdd2Hours = moment(formattedTime, 'HH:mm:ss').add(45, 'minute').format('HH:mm:ss');

  try {
    // let currentDate = moment().toJSON().slice(0, 10);
    let currentDate = moment().format('YYYY-MM-DD');

    let query = supabaseInstance.rpc("get_orders_for_outlet", {outlet_uuid: outletId})
      .eq("order_schedule_date", currentDate)
      .in("order_status_id",[1,2,3])
      .order("order_schedule_date",{ascending:false})
      .order("order_schedule_time",{ascending:false});
    
    if (orderType === "dinein") {
      query = query.eq("is_dine_in", true)
    } else if (orderType === "pickup") {
        query = query.eq("is_pick_up", true)
    } else if (orderType === "delivery") {
      query = query.eq("is_delivery", true)
    }

    // if (orderStatusId) {
    //   const _orderStatusId = orderStatusId.split(',');
    //   if (_orderStatusId.length > 0) {
    //     query = query.in('order_status_id', _orderStatusId);
    //   }
    // }

    if (orderSequenceId) {
      query = query.ilike("order_sequence_id", `%${orderSequenceId}%`);
    }

    const { data, error, } = await query;

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

router.get("/getReadyOrders/:outletId", async (req, res) => {
  const { outletId } = req.params;
  const { orderType, orderStatusId, orderSequenceId } = req.query;

  // const now = new Date();
  // const formattedTime = moment(now).format('HH:mm:ss');
  // const formattedTimeAdd2Hours = moment(formattedTime, 'HH:mm:ss').add(45, 'minute').format('HH:mm:ss');

  try {
    // let currentDate = moment().toJSON().slice(0, 10);
    let currentDate = moment().format('YYYY-MM-DD');

    let query = supabaseInstance.rpc("get_orders_for_outlet", {outlet_uuid: outletId})
      .eq("order_schedule_date", currentDate)
      .in("order_status_id",[4,5])
      .order("order_schedule_date",{ascending:false})
      .order("order_schedule_time",{ascending:false});
    
    if (orderType === "dinein") {
      query = query.eq("is_dine_in", true)
    } else if (orderType === "pickup") {
        query = query.eq("is_pick_up", true)
    } else if (orderType === "delivery") {
      query = query.eq("is_delivery", true)
    }

    // if (orderStatusId) {
    //   const _orderStatusId = orderStatusId.split(',');
    //   if (_orderStatusId.length > 0) {
    //     query = query.in('order_status_id', _orderStatusId);
    //   }
    // }

    if (orderSequenceId) {
      query = query.ilike("order_sequence_id", `%${orderSequenceId}%`);
    }

    const { data, error, } = await query;

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

router.get("/getHistoryOrders/:outletId", async (req, res) => {
  const { outletId } = req.params;
  const { orderType, orderStatusId, orderSequenceId, startDate, endDate,page, perPage  } = req.query;
  const pageNumber = parseInt(page) || 1;
  const itemsPerPage = parseInt(perPage) || 10;

  try {
    const formattedTime = moment().format('HH:mm:ss');
    // let currentDate = moment().toJSON().slice(0, 10);
    let currentDate = moment().format('YYYY-MM-DD');
    let query = supabaseInstance.rpc("get_orders_for_outlet", {outlet_uuid: outletId},{count:"exact"})
    // .lte("order_schedule_date", currentDate)
    // .lt("order_schedule_time",formattedTime)
    .order("order_schedule_date",{ascending:false})
    .order("order_schedule_time",{ascending:false})
    .or(`order_schedule_date.lte.${currentDate},and(order_schedule_date.eq.${currentDate},order_schedule_time.lte.${formattedTime})`)
    .range((pageNumber - 1) * itemsPerPage, pageNumber * itemsPerPage - 1)

    // "Order_Schedule"."scheduleDate" <= '2023-09-06' OR ("Order_Schedule"."scheduleDate" = '2023-09-06' AND "Order_Schedule"."scheduleTime" <= '12:03:00');


    if (orderType === "dinein") {
      query = query.eq("is_dine_in", true)
    } else if (orderType === "pickup") {
        query = query.eq("is_pick_up", true)
    } else if (orderType === "delivery") {
      query = query.eq("is_delivery", true)
    }

    if (orderStatusId) {
      const _orderStatusId = orderStatusId.split(',');
      if (_orderStatusId.length > 0) {
        query = query.in('order_status_id', _orderStatusId);
      }
    }

    if (orderSequenceId) {
      query = query.ilike("order_sequence_id", `%${orderSequenceId}%`);
    }

    if (startDate && endDate ) {
      query = query.gte("order_schedule_date",startDate).lte("order_schedule_date",endDate);
    }

    const { data, error,count } = await query;
    if (data) {
      const totalPages = Math.ceil(count / itemsPerPage);
      res.status(200).json({
        success: true,
        data: data, meta: {
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
    console.log(error)
    res.status(500).json({ success: false, error: error });
  }
});

router.get("/getCancelledOrders/:outletId", async (req, res) => {
  const { outletId } = req.params;
  const { page, perPage,orderType } = req.query; // Extract query parameters
  const pageNumber = parseInt(page) || 1;
  const itemsPerPage = parseInt(perPage) || 10;
  try {
  //  let query =  supabaseInstance
  //   .from("Order")
  //   .select("*,orderStatusId(*),customerAuthUID(*),Order_Schedule(*))",{ count: "exact" })

    let query = supabaseInstance.rpc("get_orders_for_outlet", {outlet_uuid: outletId},{count:"exact"})
    .in('order_status_id', ['-1', '-2'])
    .order("order_schedule_date",{ascending:false})
    .order("order_schedule_time",{ascending:false})
    .range((pageNumber - 1) * itemsPerPage, pageNumber * itemsPerPage - 1)

    
  
    if (orderType === "dinein") {
      query = query.eq("is_dine_in", true)
    } else if (orderType === "pickup") {
        query = query.eq("is_pick_up", true)
    } else if (orderType === "delivery") {
      query = query.eq("is_delivery", true)
    }

    const { data, error,count } = await query;

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
    console.log(error)
    res.status(500).json({ success: false, error: error });
  }
});

router.post("/acceptOrder/:orderId", async (req, res) => {
  const { orderId } = req.params;
  try {
    const { data, error } = await supabaseInstance.from("Order").update({ orderStatusId: 1 }).select("*").eq("orderId", orderId).maybeSingle()
    if (data) {

      updateOrderStatus(orderId,"1").then((updateOrderStatusToPetpoojaResponse) => {
        console.log('.then block ran: ', updateOrderStatusToPetpoojaResponse);
        res.status(200).json({
          success: true,
          data: {
            orderData: data,
            saveOrderToPetpooja: updateOrderStatusToPetpoojaResponse
          }
        });
      }).catch(err => {
        console.log('.catch block ran: ', err);
        throw err;
      });
    } else {
      throw error
    }
  } catch (error) {
    console.log(error)
    res.status(500).json({ success: false, error: error });
  }
});

router.post("/rejectOrder/:orderId", async (req, res) => {
  const { orderId } = req.params;
  try {
    const { data, error } = await supabaseInstance.from("Order").update({ orderStatusId: -2 }).select("*").eq("orderId", orderId).maybeSingle();
    if (data) {
      updateOrderStatus(orderId,"-2").then((updateOrderStatusToPetpoojaResponse) => {
        console.log('.then block ran: ', updateOrderStatusToPetpoojaResponse);
        res.status(200).json({
          success: true,
          data: {
            orderData: data,
            saveOrderToPetpooja: updateOrderStatusToPetpoojaResponse
          }
        });
      }).catch(err => {
        console.log('.catch block ran: ', err);
        throw err;
      });
    } else {
      throw error
    } 
  } catch (error) {
    console.log(error)
    res.status(500).json({ success: false, error: error });
  }
});

router.post("/dispatchOrder/:orderId", async (req, res) => {
  const { orderId } = req.params;
  try {
    const { data, error } = await supabaseInstance.from("Order").update({ orderStatusId: 4 }).select("*").eq("orderId", orderId).maybeSingle();
    if (data) {
      updateOrderStatus(orderId,"4").then((updateOrderStatusToPetpoojaResponse) => {
        console.log('.then block ran: ', updateOrderStatusToPetpoojaResponse);
        res.status(200).json({
          success: true,
          data: {
            orderData: data,
            saveOrderToPetpooja: updateOrderStatusToPetpoojaResponse
          }
        });
      }).catch(err => {
        console.log('.catch block ran: ', err);
        throw err;
      });
    } else {
      throw error
    } 
  } catch (error) {
    console.log(error)
    res.status(500).json({ success: false, error: error });
  }
});

router.post("/foodReadyOrder/:orderId", async (req, res) => {
  const { orderId } = req.params;
  try {
    const { data, error } = await supabaseInstance.from("Order").update({ orderStatusId: 5 }).select("*").eq("orderId", orderId).maybeSingle();
    if (data) {
      updateOrderStatus(orderId,"5").then((updateOrderStatusToPetpoojaResponse) => {
        console.log('.then block ran: ', updateOrderStatusToPetpoojaResponse);
        res.status(200).json({
          success: true,
          data: {
            orderData: data,
            saveOrderToPetpooja: updateOrderStatusToPetpoojaResponse
          }
        });
      }).catch(err => {
        console.log('.catch block ran: ', err);
        throw err;
      });
    } else {
      throw error
    } 
  } catch (error) {
    console.log(error)
    res.status(500).json({ success: false, error: error });
  }
});

router.post("/deliveredOrder/:orderId", async (req, res) => {
  const { orderId } = req.params;
  try {
    const { data, error } = await supabaseInstance.from("Order").update({ orderStatusId: 10 }).select("*").eq("orderId", orderId).maybeSingle();
    if (data) {
      updateOrderStatus(orderId,"10").then((updateOrderStatusToPetpoojaResponse) => {
        console.log('.then block ran: ', updateOrderStatusToPetpoojaResponse);
        res.status(200).json({
          success: true,
          data: {
            orderData: data,
            saveOrderToPetpooja: updateOrderStatusToPetpoojaResponse
          }
        });
      }).catch(err => {
        console.log('.catch block ran: ', err);
        throw err;
      });
    } else {
      throw error
    } 
  } catch (error) {
    console.log(error)
    res.status(500).json({ success: false, error: error });
  }
});

router.post("/dashboardData", async (req, res) => {
  const { target_date, outlet_id, analyticalType} = req.body;
  try {
    const { data, error } = await supabaseInstance.rpc('get_dashboard_count', { target_date, outlet_id,analyticaltype:analyticalType }).maybeSingle();

    if (data) {
      res.status(200).json({
        success: true,
        data: data,
      });
    } else {
      throw error
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error });
  }
});

// router.post("/orderPrice", async (req, res) => {
//   const { outlet_id,target_date,analyticalType } = req.body;
//   try {
//     const { data, error } = await supabaseInstance.rpc('get_total_price', { outlet_id,target_date,analyticaltype: analyticalType}).maybeSingle();

//     if (data) {
//       res.status(200).json({
//         success: true,
//         data: data,
//       });
//     } else {
//       throw error
//     }
//   } catch (error) {
//     console.log(error)
//     res.status(500).json({ success: false, error: error });
//   }
// });

router.post("/dineInPickUp", async (req, res) => {
  const { outlet_id,target_date,analyticalType } = req.body;
  try {
    const { data, error } = await supabaseInstance.rpc('get_customer_order_count', { target_date,outlet_id,analyticaltype: analyticalType});

    if (data) {
      res.status(200).json({
        success: true,
        data: data,
      });
    } else {
      throw error
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error });
  }
});

router.post("/totalRevenue", async (req, res) => {
  const { outlet_id,target_date,analyticalType } = req.body;
  try {
    const { data, error } = await supabaseInstance.rpc('get_total_revenue_count', { target_date,outlet_id,analyticaltype: analyticalType});

    if (data) {
      res.status(200).json({
        success: true,
        data: data,
      });
    } else {
      throw error
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error });
  }
});

router.post("/adminCardDashboard", async (req, res) => { 
  const { outlet_id,target_date,analyticalType} = req.body;
  let currentTime = moment().format('HH:mm:ss');
  const formated_time = moment(currentTime, 'HH:mm:ss').add(45, "minute").format('HH:mm:ss'); 
  try {
    const { data, error } = await supabaseInstance.rpc('get_customer_dashboard_count', { target_date,outlet_id,analyticaltype: analyticalType,currenttime:currentTime,formated_time}).maybeSingle();

    if (data) {
      res.status(200).json({
        success: true,
        data: {...data, total_downloads: 0},
      });
    } else {
      throw error
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error });
  }
});

router.post("/adminOrderType", async (req, res) => {
  const { target_date,analyticalType} = req.body;
  try {
    const { data, error } = await supabaseInstance.rpc('get_customer_dinein_pickup__delivery_count', { target_date,analyticaltype: analyticalType}).maybeSingle();

    if (data) {
      res.status(200).json({
        success: true,
        data: data,
      }
      );
    } else {
      throw error
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error });
  }
});

router.post("/adminSalesThroughApp", async (req, res) => {
  const { target_date,analyticalType} = req.body;
  try {
    const { data, error } = await supabaseInstance.rpc('get_total_customer_revenue_count', { target_date,analyticaltype: analyticalType});

    if (data) {
      res.status(200).json({
        success: true,
        data: data,
      });
    } else {
      throw error
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error });
  }
});

router.get("/topFiveCustomer", async (req, res) => {
  try {
    const { data, error } = await supabaseInstance.rpc('get_top_five_customer');

    if (data) {
      res.status(200).json({
        success: true,
        data: data,
      });
    } else {
      throw error
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error });
  }
});

router.get("/topFiveOutlets", async (req, res) => {
  try {
    const { data, error } = await supabaseInstance.rpc('get_top_five_outlets');

    if (data) {
      res.status(200).json({
        success: true,
        data: data,
      });
    } else {
      throw error
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error });
  }
});

router.get("/topFiveMenuItem", async (req, res) => {
  try {
    const { data, error } = await supabaseInstance.rpc('get_top_five_menuitem');

    if (data) {
      res.status(200).json({
        success: true,
        data: data,
      });
    } else {
      throw error
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error });
  }
});

router.get("/topThreeMenuItem/:outletId", async (req, res) => {
  const {outletId} =req.params;
  try {
    const { data, error } = await supabaseInstance.rpc('get_top_three_menuitem',{outlet_id:outletId});

    if (data) {
      res.status(200).json({
        success: true,
        data: data,
      });
    } else {
      throw error
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error });
  }
});

// router.get("/realtimeOrder", function (req, res) {
//   const {} =req.body;
//   res.writeHead(200, {
//     Connection: "keep-alive",
//     "Content-Type": "text/event-stream",
//     "Cache-Control": "no-cache",
//   });
//   setInterval(() => {
//     supabaseInstance.channel('custom-insert-channel')
//   .on(
//     'postgres_changes',
//     { event: 'INSERT', schema: 'public', table: 'Order', filter: 'id=eq.200' },
//     (payload) => {
//       res.write(
//         "data:" +
//           JSON.stringify({ payload})
//       );      
//     }
//   )
//   .subscribe()
//     res.write(payload);
//   }, 10000);
// });

module.exports = router;

function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000);
}