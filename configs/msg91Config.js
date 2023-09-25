const config = {
    auth_key: "402858AGD4HFBwoV65042ca9P1",
    senderId:"",
    email_domain:"mealpe.org",
    email_from:"info@mealpe.org",

    //* templates
    otp_template_id: '650ab13bd6fc0535ea202243',
    email_otp_template_id:"global_otp",
    feedback_template_id: "650bd219d6fc054af0781a44",
    order_delivered_template_id: "650bd1d1d6fc05033851c464",
    order_cancellation_template_id: "650bd172d6fc05507e0950a2",
    refund_template_id: "650bd124d6fc051257188e13",
    welcome_template_id: "650bd0b6d6fc0558d7651c52",
    order_confirmation_template_id: "650bd07cd6fc056a8b3e8f82",



    //* API
    send_mobile_otp_api: 'https://control.msg91.com/api/v5/otp',
    verify_mobile_otp_api: 'https://control.msg91.com/api/v5/otp/verify',
    send_email_api: 'https://control.msg91.com/api/v5/email/send',
    send_mobile_sms: 'https://control.msg91.com/api/v5/flow/',
};

exports.config = config;