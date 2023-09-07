const axios = require("axios").default;
var express = require("express");
var router = express.Router();
var supabaseInstance = require("../../services/supabaseClient").supabase;
var petpoojaconfig = require("../../configs/petpoojaConfig");


router.post("/pushData", async (req, res) => {
  const { outletId } = req.body;
  try {

    let restaurentDataQuery= await supabaseInstance.from("Outlet").select("*").eq("outletId", outletId);
    // if (restaurantId) {
    //   restaurentDataQuery = supabaseInstance.from("Restaurant").select("*").eq("restaurantId", restaurantId);
    // } else if (restaurantId && outletId) {
    //   restaurentDataQuery = supabaseInstance.from("Outlet").select("*").eq("restaurantId", restaurantId).eq("outletId", outletId);
    // }
   
    const restaurentData = await restaurentDataQuery;

    let payload = {
      success: 1,
      restaurants: [
        {
          restaurantid: outletId,
          active: restaurentData.data.status,
          details: {
            menusharingcode: "xxxxxx",
            currency_html: "₹",
            country: "India",
            images: [

            ],
            restaurantname: restaurentData.data.restaurantName,
            address: "pune",
            contact: restaurentData.data.mobile,
            latitude: "23.190394",
            longitude: "72.610591",
            landmark: "",
            city3: restaurentData.data.address,
            state: "Gujarat",
            minimumorderamount: "0",
            minimumdeliverytime: "60Minutes",
            deliverycharge: "50",
            deliveryhoursfrom1: "",
            deliveryhoursto1: "",
            deliveryhoursfrom2: "",
            deliveryhoursto2: "",
            sc_applicable_on: "H,P,D",
            sc_type: "2",
            sc_calculate_on: "2",
            sc_value: "5",
            tax_on_sc: "1",
            calculatetaxonpacking: 1,
            pc_taxes_id: "11213,20375",
            calculatetaxondelivery: 1,
            dc_taxes_id: "11213,20375",
            packaging_applicable_on: "ORDER",
            packaging_charge: restaurentData.packaging_charge,
            packaging_charge_type: ""
          }
        }
      ],
      ordertypes: [
        {
          ordertypeid: 1,
          ordertype: "Delivery"
        },
        {
          ordertypeid: 2,
          ordertype: "PickUp"
        },
        {
          ordertypeid: 3,
          ordertype: "DineIn"
        }
      ],
      categories: [],
      parentcategories: [],
      items: [],
      variations: [],
      addongroups: [],
      attributes: [],
      discounts: [],
      taxes: [],
      serverdatetime: "2022-01-1811:33:13",
      db_version: "1.0",
      application_version: "4.0",
      http_code: 200
    }

    let parentCategoryQuery= await supabaseInstance.from("Menu_Parent_Categories").select("*").eq("outletId", outletId);
    // if (restaurantId && outletId) {
    //   parentCategoryQuery = await supabaseInstance.from("Menu_Parent_Categories").select("*").eq("restaurantId", restaurantId).eq("outletId", outletId);
    // } else if (restaurantId) {
    //   parentCategoryQuery = await supabaseInstance.from("Menu_Parent_Categories").select("*").eq("restaurantId", restaurantId).is("outletId", null);
    // }
    const parentCategoryData = await parentCategoryQuery;
    for (let data of parentCategoryData.data) {
      payload.parentcategories.push(data)
    }

    const attributeQuery = await supabaseInstance.from("Menu_Item_Attributes").select("*");
    for (let data of attributeQuery.data) {
      payload.attributes.push(data)
    }

    let menucategoryQuery = await supabaseInstance.from("Menu_Categories").select("*").eq("outletId", outletId)
    // if (restaurantId && outletId) {
    //   menucategoryQuery = await supabaseInstance.from("Menu_Categories").select("*").eq("restaurantId", restaurantId).eq("outletId", outletId);
    // } else if (restaurantId) {
    //   menucategoryQuery = await supabaseInstance.from("Menu_Categories").select("*").eq("restaurantId", restaurantId).is("outletId", null);
    // }
    const categoryData = await menucategoryQuery;
    for (let data of categoryData.data) {
      let petpoojaObj = {
        categoryid: data.categoryid,
        active: data.status,
        categoryrank: "16",
        parent_category_id: data.parent_category_id,
        categoryname: data.categoryname,
        categorytimings: "",
        category_image_url: data.category_image_url
      }
      payload.categories.push(petpoojaObj)
    }

    let itemQuery = await supabaseInstance.from("Menu_Item").select("*").eq("outletId", outletId);
    // if (restaurantId && outletId) {
    //   itemQuery = await supabaseInstance.from("Menu_Item").select("*").eq("restaurantId", restaurantId).eq("outletId", outletId);
    // } else if (restaurantId) {
    //   itemQuery = await supabaseInstance.from("Menu_Item").select("*").eq("restaurantId", restaurantId).is("outletId", null);
    // }
    const itemData = await itemQuery;
    for (let data of itemData.data) {
      let petpoojaObj = {
        itemid: data.itemid,
        itemallowvariation: "0",
        itemrank: "52",
        item_categoryid: data.item_categoryid,
        item_ordertype: "1,2,3",
        item_packingcharges: "",
        itemallowaddon: "1",
        itemaddonbasedon: "0",
        item_favorite: "0",
        ignore_taxes: "0",
        ignore_discounts: "0",
        in_stock: "2",
        cuisine: [],
        variation_groupname: "",
        variation: [],
        addon: [],
        itemname: data.itemname,
        item_attributeid: data.attributeid,
        itemdescription: data.itemdescription,
        minimumpreparationtime: data.minimumpreparationtime,
        price: data.price,
        active: data.status,
        item_image_url: data.item_image_url,
        item_tax: "sgst,cgst",
        gst_type: "services",
        nutrition: {}
      }
      payload.items.push(petpoojaObj)

    }

    // const taxQuery = supabaseInstance.from("Tax").select("*");
    // if (restaurantId && outletId) {
    //   taxDataQuery = taxQuery.eq("restaurantId", restaurantId).eq("outletId", outletId);
    // } else if (restaurantId) {
    //   taxDataQuery = taxQuery.eq("restaurantId", restaurantId).is("outletId", null);
    // }
    // const taxData = await taxDataQuery;
    // for (let data of taxData.data) {
    //   let petpoojaObj = {
    //     taxid: data.taxid,
    //     taxname: data.taxname,
    //     tax: data.tax,
    //     taxtype: "1",
    //     tax_ordertype: "",
    //     active: "1",
    //     tax_coreortotal: "2",
    //     tax_taxtype: "1",
    //     rank: "1",
    //     consider_in_core_amount: "0",
    //     description: ""
    //   }
    //   payload.taxes.push(petpoojaObj)
    // }

    const payloadData = await axios.post(petpoojaconfig.config.push_menu_api, payload);

    if (restaurentData) {
      res.status(200).json({
        success: true,
        data: payload,
        petpooja: payloadData?.data
      });
    } else {
      throw error;
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, error: error });
  }
});

router.post("/orderStatus", async (req, res) => {
  const { restaurantId, orderId } = req.body;
  try {

    const { data, error } = await supabaseInstance.from("Order").select("*").eq("restaurantId",restaurantId).eq("orderId", orderId).maybeSingle()
      let payload = {
        restID:restaurantId,
        orderID:orderId,
        status:data.orderStatusId,
        cancel_reason:"",
        minimum_prep_time:20,
        minimum_delivery_time:"",
        rider_name:"",
        rider_phone_number:"",
        is_modified:"No"
      }

    //  const payloadData = await axios.post(petpoojaconfig.config.order_status_api, payload);

    if (data) {
      res.status(200).json({
        success: true,
        data: payload,
        petpooja: payloadData?.data
      });
    } else {
      throw error;
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, error: error });
  }
});

router.post("/fetchMenu", async (req, res) => {
  const { outletId } = req.body;
  try {
    let catgoryData = [];
    let taxData = [];
    let itemData = [];
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'app-key': petpoojaconfig.config.app_key,
        'app-secret': petpoojaconfig.config.app_secret,
        'access-token': petpoojaconfig.config.access_token
      },
    };

    const categoryid = await supabaseInstance.from("Menu_Categories").select("categoryid").eq("outletId", outletId);
    const taxid = await supabaseInstance.from("Tax").select("taxid").eq("outletId", outletId);
    const itemid = await supabaseInstance.from("Menu_Item").select("itemid").eq("outletId", outletId);
    const parentcategoryid = await supabaseInstance.from("Menu_Parent_Categories").select("parent_category_id").eq("outletId", outletId);


    const categoryId = categoryid.data.map(c => c.categoryid);
    const taxId = taxid.data.map(t => t.taxid);
    const itemId = itemid.data.map(i => i.itemid);
    const parentcategoryId = parentcategoryid.data.map(c => c.parent_category_id);

    // const menuCategoryDataRemove = await supabaseInstance.from("Menu_Categories").delete().in("categoryid", categoryId);
    // const menuItemDataRemove = await supabaseInstance.from("Menu_Item").delete().in("itemid", itemId);
    // const parentDataRemove = await supabaseInstance.from("Menu_Parent_Categories").delete().in("parent_category_id", parentcategoryId);
    // const taxDataRemove = await supabaseInstance.from("Tax").delete().in("taxid", taxId);

    const data = {
      "restID": outletId
    };
    const payloadData = await axios.post(petpoojaconfig.config.fetch_menu_api, data);

    // for (let data of payloadData?.data?.taxes) {
    //   taxQuery = await supabaseInstance.from("Tax").insert({ taxid: data.taxid, taxname: data.taxname, tax: data.tax, outletId: outletId }).select("*");
    //   taxData.push(taxQuery.data[0])
    // }

    for (let data of payloadData?.data?.categories) {
      categoryQuery = await supabaseInstance.from("Menu_Categories")
        .insert({
          outletId: outletId,
          categoryid: data.categoryid,
          categoryname: data.categoryname,
          status: data.active,
          //  parent_category_id:data.parent_category_id,
          category_image_url: data.category_image_url
        }).select("*");
      catgoryData.push(categoryQuery.data[0])
    }

    for (let data of payloadData?.data?.items) {

      let price = Number(data.price);
      let minimumpreparationtime = Number(data.minimumpreparationtime);
      itemQuery = await supabaseInstance.from("Menu_Item")
        .insert({
          itemid: data.itemid,
          // item_categoryid:data.item_categoryid,
          itemname: data.itemname,
          outletId: outletId,
          itemdescription: data.itemdescription,
          minimumpreparationtime: minimumpreparationtime,
          price: price,
          status: data.active,
          item_image_url: data.item_image_url,
          attributeid: data.item_attributeid,
          itemdescription: data.itemdescription,
        }).select("*")
      itemData.push(itemQuery.data[0])
    }

    for (let data of payloadData?.data?.parentcategories) {
      parentcategoryQuery = await supabaseInstance.from("Menu_Parent_Categories")
        .insert({
          outletId: outletId,
          parent_category_id: data.id,
          parentCategoryName: data.name,
          status: data.active,
          parent_category_image_url: data.image_url
        }).select("*");
    }

    if (payloadData?.data) {
      res.status(200).json({
        success: true,
        data: {
          categories: catgoryData,
          items: itemData,
          taxes: taxData,
          // parentcategory:parentcategoryQuery.data
        }
      });
    } else {
      throw error;
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, error: error });
  }
});

router.post("/fetchMenuCard", async (req, res) => {
  const { outletId } = req.body;
  try {

    const petPoojaQuery =await supabaseInstance.from("Outlet").select("*").eq("outletId",outletId);

    const options = {
      headers: {
        'Content-Type': 'application/json',
        'app-key': petPoojaQuery.data[0].petPoojaAppKey,
        'app-secret': petPoojaQuery.data[0].petPoojaAppSecret,
        'access-token': petPoojaQuery.data[0].petPoojaApAccessToken
      },
    };

    const data = {
      "restID": petPoojaQuery.data[0].petPoojaRestId
    };
    const payloadData = await axios.post(petpoojaconfig.config.fetch_menu_api, data, options);

    if (payloadData?.data) {
      res.status(200).json({
        success: true,
        data: payloadData.data,
        op: {fetch_menu_api: petpoojaconfig.config.fetch_menu_api, data, options}
      });
    } else {
      throw error;
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, error: error });
  }
})

function saveOrderToPetpooja(restaurantId, customerAuthUID, orderId, outletId) {
  return new Promise(async (resolve, reject) => {
    try {

      let restaurentDataQuery= await supabaseInstance.from("Outlet").select("*").eq("outletId", outletId);

      // if (restaurantId) {
      //   restaurentDataQuery = supabaseInstance.from("Restaurant").select("*").eq("restaurantId", restaurantId);
      // } else if (restaurantId && outletId) {
      //   restaurentDataQuery = supabaseInstance.from("Outlet").select("*").eq("restaurantId", restaurantId).eq("outletId", outletId);
      // }
      const restaurentData = await restaurentDataQuery;

      const customerData = await supabaseInstance.from("Customer").select("*").eq("customerAuthUID", customerAuthUID).maybeSingle();

      const orderData = await supabaseInstance.from("Order").select("*").eq("orderId", orderId)

      let payload = {
        app_key: petpoojaconfig.config.app_key,
        app_secret: petpoojaconfig.config.app_secret,
        access_token: petpoojaconfig.config.access_token,
        orderinfo: {
          OrderInfo: {
            Restaurant: {
              details: {
                res_name: restaurentData.data[0].restaurantName,
                address: restaurentData.data[0].address,
                contact_information: restaurentData.data[0].mobile,
                restID: outletId
              }
            },
            Customer: {
              details: {
                email: customerData.data.email,
                name: customerData.data.name,
                address: "2, Amin Society, Naranpura",
                phone: customerData.data.phone,
                latitude: "34.11752681212772",
                longitude: "74.72949172653219"
              }
            },
            Order: {
              details: {
                orderID: orderId,
                preorder_date: "2022-01-01",
                preorder_time: "15:50:00",
                service_charge: "0",
                sc_tax_amount: "0",
                delivery_charges: "50",
                dc_tax_amount: "2.5",
                dc_gst_details: [],
                packing_charges: "20",
                pc_tax_amount: "1",
                pc_gst_details: [],
                order_type: "",
                ondc_bap: "",
                advanced_order: "N",
                payment_type: "COD",
                table_no: "",
                no_of_persons: "0",
                discount_total: "0",
                tax_total: "65.52",
                discount_type: "F",
                total: orderData.data[0].totalPrice,
                description: "",
                created_on: "2022-01-01 15:49:00",
                enable_delivery: 1,
                min_prep_time: 20,
                callback_url: "https.xyz.abc"
              }
            },
            OrderItem: {
              details: [
                // {
                //     id: orderitemData.data[0].itemId,
                //     name: "Garlic Bread (3Pieces)",
                //     gst_liability: "vendor",
                //     item_tax: [
                //         {
                //             id: "11213",
                //             name: "CGST",
                //             amount: "3.15"
                //         },
                //         {
                //             id: "20375",
                //             name: "SGST",
                //             amount: "3.15"
                //         }
                //     ],
                //     item_discount: "14",
                //     price: orderitemData.data[0].itemPrice,
                //     final_price: orderitemData.data[0].calculatedPrice,
                //     quantity: orderitemData.data[0].quantity,
                //     description: "",
                //     variation_name: "3Pieces",
                //     variation_id: "89058",
                //     AddonItem: {
                //         details: []
                //     }
                // }
              ]
            },
            Tax: {
              details: []
            },
            Discount: {}
          },
          udid: "",
          device_type: "Web"
        }
      }
      const orderitemData = await supabaseInstance.from("Order_Item").select("*").eq("orderId", orderId);
      for (let data of orderitemData.data) {
        let petpoojaOrderObj = {

          id: data.itemId,
          name: "Garlic Bread (3Pieces)",
          gst_liability: "vendor",
          item_tax: [
            {
              id: "11213",
              name: "CGST",
              amount: "3.15"
            },
            {
              id: "20375",
              name: "SGST",
              amount: "3.15"
            }
          ],
          item_discount: "14",
          price: data.itemPrice,
          final_price: data.calculatedPrice,
          quantity: data.quantity,
          description: "",
          variation_name: "3Pieces",
          variation_id: "89058",
          AddonItem: {
            details: []
          }
        }
        payload.orderinfo.OrderInfo.OrderItem.details.push(petpoojaOrderObj);
      }

      // const taxData = await supabaseInstance.from("Tax").select("*").eq("restaurantId", restaurantId);
      // for (let data of taxData.data) {
      //   let petpoojaTaxObj = {
      //     id: data.taxid,
      //     title: data.taxname,
      //     type: "P",
      //     price: "2.5",
      //     tax: data.tax,
      //     restaurant_liable_amt: "0.00"
      //   }
      //   payload.orderinfo.OrderInfo.Tax.details.push(petpoojaTaxObj);
      // }

      const payloadData = await axios.post(petpoojaconfig.config.save_order_api, payload);


      resolve({
        success: true,
        message: "",
        data: payloadData?.data
      })
    } catch (error) {
      reject({
        success: false,
        error: error?.message || error
      })
    }
  })
};


function updateOrderStatus(orderId, updatedOrderStatus) {
  return new Promise(async (resolve, reject) => {
    try {

      const orderQuery= await supabaseInstance.from("Order").select("*,outletId(*)").eq("orderId", orderId).maybeSingle();
  
      if (orderQuery?.data) {
        const orderData = orderQuery.data;
        if (
          orderData?.outletId?.petPoojaAppKey &&
          orderData?.outletId?.petPoojaAppSecret &&
          orderData?.outletId?.petPoojaApAccessToken &&
          orderData?.outletId?.petPoojaRestId
        ) {
          let payload ={
            app_key: orderData?.outletId?.petPoojaAppKey,
            app_secret: orderData?.outletId?.petPoojaAppSecret, 
            access_token: orderData?.outletId?.petPoojaApAccessToken, 
            restID: orderData?.outletId?.petPoojaRestId,
            orderID: orderId, 
            clientorderID: orderData?.customerAuthUID,
            cancelReason: "",
            status: updatedOrderStatus
          }

          const petPoojaUpdateOrderStatus = await axios.post(petpoojaconfig.config.update_order_status_api, payload);

          if (petPoojaUpdateOrderStatus.data) {
            resolve({success: true, data: petPoojaUpdateOrderStatus.data})
          }

        } else {
          resolve({success: false, error: "Petpooja config not found."})
        }
      } else {
        resolve({success: false, error: "Order not found."})
      }

    } catch (error) {
      reject({
        success: false,
        error: error?.message || error
      })
    }
  })
};
// updateOrderStatus("cf9474cc-392b-4c49-b246-a0afc1e34e47", "5").then(res => {
//   console.log("res", res);
// }).catch(err => {
//   console.error(err);
// })
module.exports = { router, saveOrderToPetpooja ,updateOrderStatus};
