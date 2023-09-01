// var express = require("express");
// var router = express.Router();
// var supabaseInstance = require("../services/supabaseClient").supabase;

// // router.post("/createRole", async (req, res) => {
// //     const { role, access, outletId,restaurantId } = req.body;
    
// //     try {
// //         if(outletId && restaurantId)
// //         {
// //             const { data, error } = await supabaseInstance
// //             .from("Outlet_Role")
// //             .insert({ role: role, access: access, outletId: outletId,restaurantId:restaurantId })
// //             .select("*")
// //             if (data) {
// //                 res.status(200).json({
// //                     success: true,
// //                     data: data,
// //                 });
// //             } else {
// //                 throw error;
// //             }
// //         }else if (restaurantId){
// //             const { data, error } = await supabaseInstance
// //             .from("Outlet_Role")
// //             .insert({ role: role, access: access, restaurantId: restaurantId })
// //             .select("*")
// //             if (data) {
// //                 res.status(200).json({
// //                     success: true,
// //                     data: data,
// //                 });
// //             } else {
// //                 throw error;
// //             }
// //         }else{
// //             res.status(500).json({
// //                 success: false,
// //             });
// //         }
// //     } catch (error) {
// //         res.status(500).json({ success: false, error: error });
// //     }
// // });

// router.post("/createRole", async (req, res) => {
//     const { role, access, outletId } = req.body;

//     try {
//         const { data, error } = await supabaseInstance
//             .from("Outlet_Role")
//             .insert({ role: role, access: access, outletId: outletId })
//             .select("*")
//         if (data) {
//             res.status(200).json({
//                 success: true,
//                 data: data,
//             });
//         } else {
//             throw error;
//         }
//     } catch (error) {
//         res.status(500).json({ success: false, error: error });
//     }
// });

// // router.get("/getRole/:restaurentType/:Id", async (req, res) => {
// //     const {restaurentType,Id}=req.params
// //     try {
// //         if (restaurentType=="outlet") {
// //             const { data, error } = await supabaseInstance
// //                 .from("Outlet_Role")
// //                 .select("*")
// //                 .eq("outletId",Id)
        
// //             if (data) {
// //                 res.status(200).json({
// //                     success: true,
// //                     data: data,
// //                 });
// //             } else {
// //                 throw error
// //             }
// //         } else if (restaurentType=="restaurent") {
// //             const { data, error } = await supabaseInstance
// //                 .from("Outlet_Role")
// //                 .select("*")
// //                 .eq("restaurantId",Id)

// //             if (data) {
// //                 res.status(200).json({
// //                     success: true,
// //                     data: data,
// //                 });
// //             } else {
// //                 throw error
// //             }
// //         } else {
// //             res.status(500).json({
// //                 success: false,
// //             }); 
// //         }
 
// //     } catch (error) {
// //         res.status(500).json({ success: false, error: error.message });
// //     }
// // });

// router.get("/getRole/:restaurentType/:Id", async (req, res) => {
//     const {restaurentType,Id}=req.params
//     try {
//         if (restaurentType=="outlet") {
//             const { data, error } = await supabaseInstance
//                 .from("Outlet_Role")
//                 .select("*")
//                 .eq("outletId",Id)
        
//             if (data) {
//                 res.status(200).json({
//                     success: true,
//                     data: data,
//                 });
//             } else {
//                 throw error
//             }
//         } else {
//             res.status(500).json({
//                 success: false,
//             }); 
//         }
 
//     } catch (error) {
//         res.status(500).json({ success: false, error: error.message });
//     }
// });

// router.post("/updateRole/:roleId", async (req, res) => {
//     const { roleId } = req.params;
//     const roleData = req.body;

//     try {
//         const { data, error } = await supabaseInstance
//             .from("Outlet_Role")
//             .update({ ...roleData })
//             .eq("roleId", roleId)
//             .select("*");

//         if (data) {
//             res.status(200).json({
//                 success: true,
//                 message: "Data updated succesfully",
//                 data: data,
//             });
//         } else {
//             throw error;
//         }
//     } catch (error) {
//         res.status(500).json({ success: false, error: error.message });
//     }
// });

// // router.post("/createStaff", async (req, res) => {

// //     const { outletId,restaurantId, email, password, name, mobile, address, pancard, roleId } = req.body;

// //     try {
// //         const { data, error } = await supabaseInstance.auth.signUp(
// //             {
// //                 email: email,
// //                 password: password,
// //                 options: {
// //                     data: {
// //                         isRestaurant: false,
// //                         isOutlet: false,
// //                         isOutletStaff: true,
// //                     }
// //                 }
// //             })
// //         if (data?.user) {
// //             const outletStaffAuthUId = data.user.id;
// //             const metadata =data?.user?.user_metadata;
// //             console.log("metadata",metadata);
// //             if (outletId && restaurantId) {
// //                 const staffDetails = await supabaseInstance.from("Outlet_Staff")
// //                     .insert({ outletStaffAuthUId, outletId, restaurantId, email, name, mobile, address, pancard, roleId })
// //                     .select("*")
// //                     .maybeSingle();

// //                 if (staffDetails.data) {
// //                     res.send({ success: true, data: staffDetails.data });
// //                 } else {
// //                     throw staffDetails.error;
// //                 }

// //             } else if (restaurantId) {
// //                 const staffDetails = await supabaseInstance.from("Outlet_Staff")
// //                     .insert({ outletStaffAuthUId, restaurantId, email, name, mobile, address, pancard, roleId })
// //                     .select("*")
// //                     .maybeSingle();

// //                 if (staffDetails.data) {
// //                     res.send({ success: true, data: staffDetails.data });
// //                 } else {
// //                     throw staffDetails.error;
// //                 }
// //             }else{
// //                 res.status(500).json({
// //                     success: false,
// //                 });
// //             }
// //         } else {
// //             throw error
// //         }

// //     } catch (error) {
// //         res.status(500).json({ success: false, error: error.message });
// //     }
// // })

// router.post("/createStaff", async (req, res) => {

//     const { outletId, email, password, name, mobile, address, pancard, roleId } = req.body;

//     try {
//         const { data, error } = await supabaseInstance.auth.signUp(
//             {
//                 email: email,
//                 password: password,
//                 options: {
//                     data: {
//                         isRestaurant: false,
//                         isOutlet: false,
//                         isOutletStaff: true,
//                     }
//                 }
//             })
//         if (data?.user) {
//             const outletStaffAuthUId = data.user.id;
//             const metadata =data?.user?.user_metadata;
//             console.log("metadata",metadata);
//             if (outletId) {
//                 const staffDetails = await supabaseInstance.from("Outlet_Staff")
//                     .insert({ outletStaffAuthUId, outletId, email, name, mobile, address, pancard, roleId })
//                     .select("*")
//                     .maybeSingle();

//                 if (staffDetails.data) {
//                     res.send({ success: true, data: staffDetails.data });
//                 } else {
//                     throw staffDetails.error;
//                 }

//             }else{
//                 res.status(500).json({
//                     success: false,
//                 });
//             }
//         } else {
//             throw error
//         }

//     } catch (error) {
//         res.status(500).json({ success: false, error: error.message });
//     }
// })

// router.post("/updateStaff/:outletStaffAuthUId", async (req, res) => {

//     const { outletStaffAuthUId } = req.params;
//     const staffData = req.body;
//     delete staffData?.email;
//     delete staffData?.password;
//     try {
//         const { data, error } = await supabaseInstance
//             .from("Outlet_Staff")
//             .update({ ...staffData })
//             .eq("outletStaffAuthUId", outletStaffAuthUId)
//             .select("*");

//         if (data) {
//             res.status(200).json({
//                 success: true,
//                 message: "Data updated succesfully",
//                 data: data,
//             });
//         } else {
//             throw error;
//         }
//     } catch (error) {
//         res.status(500).json({ success: false, error: error.message });
//     }
// });

// router.get("/getStaff/:staffType/:Id", async (req, res) => {
//     const {staffType,Id}=req.params;
//     try {
//         if (staffType== "outletstaff") {
//             const { data, error } = await supabaseInstance
//                 .from("Outlet_Staff")
//                 .select("*,roleId(*)")
//                 .eq("outletId",Id)

//             if (data) {
//                 res.status(200).json({
//                     success: true,
//                     data: data,
//                 });
//             } else {
//                 throw error
//             }
//         }else if (staffType=="restaurentstaff") {

//             const { data, error } = await supabaseInstance
//                 .from("Outlet_Staff")
//                 .select("*,roleId(*)")
//                 .eq("restaurantId",Id)

//             if (data) {
//                 res.status(200).json({
//                     success: true,
//                     data: data,
//                 });
//             } else {
//                 throw error
//             }
//         }else{
//             res.status(500).json({
//                 success: false,
//             }); 
//         }
     
 
//     } catch (error) {
//         res.status(500).json({ success: false, error: error.message });
//     }
// });

// module.exports = router;

