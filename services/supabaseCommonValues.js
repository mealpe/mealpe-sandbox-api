
const outletSelectString  = "*,campusId(*,cityId(*)), bankDetailsId(*), outletAdminId(*), Tax!left(*),Timing!left(*),Restaurant_category!left(*)";
const customerSlectString = "*,campusId(*,cityId(*))"


exports.value = {outletSelectString,customerSlectString};