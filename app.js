// init
const express = require('express');
const cors=require("cors");
const axios = require('axios');
const path = require('path');
const bodyParser = require('body-parser');
var nodemailer = require("nodemailer");
const ical = require('ical-generator');
const moment = require('moment/moment');

// create express app
const app = express();
app.use(cors());
app.options('*', cors());

// app.use(bodyParser.json());
// app.use(express.static(path.join(__dirname, 'dist/hw8_1')));

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'dist/hw8_1')));

const PORT = process.env.PORT || 8080;
app.listen(PORT, function() {
    console.log('Madara Uchiha listening on port: ' + PORT);
});


// API KEYS
const yelpAPIKey = '_tJrB11bJhADgGtaOcEO7u8L2vYSv_9zNQoZ7N-XIiwfx0lPyfTV_dD6DIJutNivj6HglY0SW8iv-ETfC25nPBqVbSSLi8IiP5KrKurupEJID_xcz1jzQsTNIv8bY3Yx';

// usage functions
function get_yelp_autocomplete_url(){
    return "https://api.yelp.com/v3/autocomplete?text=";
}

function get_yelp_search_url(){
    return 'https://api.yelp.com/v3/businesses/search?';
}

function get_yelp_business_url(){
    return "https://api.yelp.com/v3/businesses/";
}

function get_yelp_reviews_url(){
    return "https://api.yelp.com/v3/businesses/";
}

function get_headers(){
    return {
        'Authorization': 'Bearer _tJrB11bJhADgGtaOcEO7u8L2vYSv_9zNQoZ7N-XIiwfx0lPyfTV_dD6DIJutNivj6HglY0SW8iv-ETfC25nPBqVbSSLi8IiP5KrKurupEJID_xcz1jzQsTNIv8bY3Yx'
    }
}

function gmaps_address_to_coordinates(){
    return "https://maps.googleapis.com/maps/api/geocode/json?" + "&address=";
}

function gmaps_api_key(){
    return "AIzaSyC-mnEJ8lBdMvTER57xKHvqvEwwAT02RhY";
}

function get_miles_from_meters(meters){
    return (meters * 0.000621371).toFixed(2);
}

function get_meters_from_miles(miles){
    return miles * 1609;
}

async function getReviews(id){
    try{
        let url = get_yelp_reviews_url() + id + "/reviews";
        console.log(url);
        var response = await axios.get(url, {headers: get_headers()});
        var data = await response.data;
        var reviews = [];
        for (var i = 0; i < data.reviews.length; i++){
            var ratings = "";
            if(data.reviews[i].rating){
                var temp = data.reviews[i].rating;
                ratings += temp+"/5";
            }
            var review = {
                user: data.reviews[i].user.name,
                text: data.reviews[i].text,
                rating: ratings,
                time_created: data.reviews[i].time_created.split(" ")[0]
            };
            reviews.push(review);
        }
        return reviews;
    }
    catch(err){
        console.log(err);
        return [];
    }
}

// backend calls routes

// demo call
// app.get('/*', (req, res) => {
//     console.log("hello");
//     res.sendFile(path.join(__dirname + '/dist/hw8_1/index.html'));
//     // res.send("Hello World");
// });

// demo call
// app.get('/', (req, res) => {
//     res.send('Hello World!');
// });

// gmaps coordinates from address
app.get('/gmaps/:address', async function (req, res){
    try{
        let address = req.params.address;
        let url = gmaps_address_to_coordinates() + address + "&key=" + gmaps_api_key();
        // console.log(url);
        let response = await axios.get(url);
        var data = await response.data;
        if(data.results.length > 0){
            res.json({coordinates: data.results[0].geometry.location});
            return;
        }
        // var coordinates = data.results[0].geometry.location;
        res.json({errors: "gmaps error"});
    }
    catch(err){
        console.log(err);
        res.json({errors: "gmaps error"});
    }
    
});



// yelp autocomplete api
app.get('/autocomplete/:text', async function (req, res) {
    try{
        let url = get_yelp_autocomplete_url() + req.params.text;
        var response = await axios.get(url, {headers: get_headers()});
        var data = await response.data;
        var keywords = [];
        // terms from categroies
        for (var i = 0; i < data.categories.length; i++){
            keywords.push(data.categories[i].title);
        }
        for (var i = 0; i < data.terms.length; i++) {
            keywords.push(data.terms[i].text);
        }
        // send json response
        res.json({terms: keywords});
    }
    catch(err){
        console.log(err);
        res.json({errors: "yelp autocomplete error"});
    }
});

// yelp search api
app.get('/searchB', async function (req, res) {
    try{
        let term = req.query.term;
        let latitude = req.query.latitude;
        let longitude = req.query.longitude;
        let radius = req.query.radius;
        if(radius==null || radius==""){
            radius = 10;
        }
        let category = req.query.category;
        if(category==null || category==""){
            category = "all";
        }
        let limit = "10";
        mradius = get_meters_from_miles(radius);
        let url = get_yelp_search_url() + 'term=' + term + '&latitude=' + String(latitude) + '&longitude=' + String(longitude) + '&limit=' + limit + '&radius=' + mradius + '&categories=' + category;
        console.log(url);
        var response = await axios.get(url, {headers: get_headers()});
        var data = await response.data;
        var businesses = [];
        for (var i = 0; i < data.businesses.length; i++){
            var business = {
                id: data.businesses[i].id,
                sid: i+1,
                name: data.businesses[i].name,
                image_url: data.businesses[i].image_url,
                rating: data.businesses[i].rating,
                distance: get_miles_from_meters(data.businesses[i].distance)
            };
            businesses.push(business);
        }
        res.json({businesses: businesses});
        // console.log(data);
    }
    catch(err){
        console.log(err);
        res.json({errors: "yelp search error"});
    }
    // res.send(data);
});

// yelp business api
app.get('/business/:id', async function (req, res) {
    let business;
    try{
        let url = get_yelp_business_url() + req.params.id;
        console.log(url);
        var response = await axios.get(url, {headers: get_headers()});
        var data = await response.data;
        var supported_categories = [];
        if(data.categories){
            for (var i = 0; i < data.categories.length; i++){
                supported_categories.push(data.categories[i].title);
            }
        }
        var business_category = supported_categories.join(" | ");
        var business_addr = [];
        if(data.location){
            for (var i = 0; i < data.location.display_address.length; i++){
                business_addr.push(data.location.display_address[i]);
            }
        }
        var business_addr_str = business_addr.join(", ");
        var business_coordinates = [];
        if(data.coordinates){
            business_coordinates.push(data.coordinates.latitude);
            business_coordinates.push(data.coordinates.longitude);
        }
        var make_gmaps_coordinates = {};
        if(business_coordinates.length != 0){
            make_gmaps_coordinates = {center: { lat: business_coordinates[0], lng: business_coordinates[1] }};
        }
        var is_open_now = "";
        var status_class = "b_closed";
        if(data.hours && data.hours[0]){
            is_open_now = data.hours[0].is_open_now==true? "Open Now" : "Closed";
            status_class = data.hours[0].is_open_now==true? "b_open" : "b_closed";
        }
        console.log("here already");
        var bphotos_1 = "";
        var bphotos_2 = "";
        var bphotos_3 = "";
        if(data.photos){
            bphotos_1 = data.photos[0]==null?"":data.photos[0];
            bphotos_2 = data.photos[1]==null?"":data.photos[1];
            bphotos_3 = data.photos[2]==null?"":data.photos[2];
        }
        var transactions = [];
        if(data.transactions){
            for (var i = 0; i < data.transactions.length; i++){
                transactions.push(data.transactions[i]);
            }
        }
        var supported_transactions = transactions.join(" | ");
        var price = "";
        if(data.price){
            price = data.price;
        }
        var business_reviews = await getReviews(req.params.id);
        sharelinkfortwitter = "Check " + data.name + " on Yelp. " +data.url;
        business = {
            id: data.id,
            name: data.name,
            url: data.url,
            display_phone: data.display_phone==null?"":data.display_phone,
            categories: business_category,
            display_address: business_addr_str,
            business_coordinates: business_coordinates,
            is_open_now: is_open_now,
            transactions: supported_transactions,
            price: price,
            gmaps_data: make_gmaps_coordinates,
            reviews: business_reviews,
            photo_1: bphotos_1,
            photo_2: bphotos_2,
            photo_3: bphotos_3,
            sharelinkfortwitter: sharelinkfortwitter,
            selectTab: 0,
            status_class: status_class
        };  
        res.json({business: business});
    }
    catch(err){
        console.log(err);
        res.json({errors: "yelp error", business: business});
    }

    // res.send(data);
});

// yelp reviews api
app.get('/reviews/:id', async function (req, res) {
    let url = get_yelp_reviews_url() + req.params.id + "/reviews";
    console.log(url);
    var response = await axios.get(url, {headers: get_headers()});
    var data = await response.data;
    var reviews = [];
    for (var i = 0; i < data.reviews.length; i++){
        var ratings = "";
        if(data.reviews[i].rating){
            var temp = data.reviews[i].rating;
            ratings += temp+"/5";
        }
        var review = {
            user: data.reviews[i].user.name,
            text: data.reviews[i].text,
            rating: ratings,
            time_created: data.reviews[i].time_created.split(" ")[0]
        };
        reviews.push(review);
    }
    res.json({reviews: reviews});
    // res.send(data);
    // axios.get(url, {headers: get_headers()})
    //     .then(response => {
    //         res.send(response.data);
    //     })
    //     .catch(error => {
    //         console.log(error);
    //     });
});

// listen for requests
// app.listen(3008, () => {
//     console.log("Server is listening on port 3000");
//     console.log("http://127.0.0.1:3000");
// });

// send email with nodemailer with the calender invite
app.post('/sendemail', function (req, res) {
    console.log(req.body);
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: "patelshrey8211@gmail.com",
       pass: "gcfdbhgpephkqebc"
        }
    });
    var mailOptions = {
        from: 'patelshrey8211@gmail.com',
        to: req.body.email,
        subject: 'Reservation Confirmation for ' + req.body.restaurant_name,
        html: `
        <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" style="font-family:arial, 'helvetica neue', helvetica, sans-serif"><head><meta charset="UTF-8"><meta content="width=device-width, initial-scale=1" name="viewport"><meta name="x-apple-disable-message-reformatting"><meta http-equiv="X-UA-Compatible" content="IE=edge"><meta content="telephone=no" name="format-detection"><title>New email template 2022-12-17</title><!--[if (mso 16)]><style type="text/css"> a {text-decoration: none;} </style><![endif]--><!--[if gte mso 9]><style>sup { font-size: 100% !important; }</style><![endif]--><!--[if gte mso 9]><xml> <o:OfficeDocumentSettings> <o:AllowPNG></o:AllowPNG> <o:PixelsPerInch>96</o:PixelsPerInch> </o:OfficeDocumentSettings> </xml><![endif]--><style type="text/css">#outlook a { padding:0;}.es-button { mso-style-priority:100!important; text-decoration:none!important;}a[x-apple-data-detectors] { color:inherit!important; text-decoration:none!important; font-size:inherit!important; font-family:inherit!important; font-weight:inherit!important; line-height:inherit!important;}.es-desk-hidden { display:none; float:left; overflow:hidden; width:0; max-height:0; line-height:0; mso-hide:all;}[data-ogsb] .es-button { border-width:0!important; padding:10px 20px 10px 20px!important;}@media only screen and (max-width:600px) {p, ul li, ol li, a { line-height:150%!important } h1, h2, h3, h1 a, h2 a, h3 a { line-height:120% } h1 { font-size:30px!important; text-align:left } h2 { font-size:24px!important; text-align:left } h3 { font-size:20px!important; text-align:left } .es-header-body h1 a, .es-content-body h1 a, .es-footer-body h1 a { font-size:30px!important; text-align:left } .es-header-body h2 a, .es-content-body h2 a, .es-footer-body h2 a { font-size:24px!important; text-align:left } .es-header-body h3 a, .es-content-body h3 a, .es-footer-body h3 a { font-size:20px!important; text-align:left } .es-menu td a { font-size:14px!important } .es-header-body p, .es-header-body ul li, .es-header-body ol li, .es-header-body a { font-size:14px!important } .es-content-body p, .es-content-body ul li, .es-content-body ol li, .es-content-body a { font-size:14px!important } .es-footer-body p, .es-footer-body ul li, .es-footer-body ol li, .es-footer-body a { font-size:14px!important } .es-infoblock p, .es-infoblock ul li, .es-infoblock ol li, .es-infoblock a { font-size:12px!important } *[class="gmail-fix"] { display:none!important } .es-m-txt-c, .es-m-txt-c h1, .es-m-txt-c h2, .es-m-txt-c h3 { text-align:center!important } .es-m-txt-r, .es-m-txt-r h1, .es-m-txt-r h2, .es-m-txt-r h3 { text-align:right!important } .es-m-txt-l, .es-m-txt-l h1, .es-m-txt-l h2, .es-m-txt-l h3 { text-align:left!important } .es-m-txt-r img, .es-m-txt-c img, .es-m-txt-l img { display:inline!important } .es-button-border { display:inline-block!important } a.es-button, button.es-button { font-size:18px!important; display:inline-block!important } .es-adaptive table, .es-left, .es-right { width:100%!important } .es-content table, .es-header table, .es-footer table, .es-content, .es-footer, .es-header { width:100%!important; max-width:600px!important } .es-adapt-td { display:block!important; width:100%!important } .adapt-img { width:100%!important; height:auto!important } .es-m-p0 { padding:0px!important } .es-m-p0r { padding-right:0px!important } .es-m-p0l { padding-left:0px!important } .es-m-p0t { padding-top:0px!important } .es-m-p0b { padding-bottom:0!important } .es-m-p20b { padding-bottom:20px!important } .es-mobile-hidden, .es-hidden { display:none!important } tr.es-desk-hidden, td.es-desk-hidden, table.es-desk-hidden { width:auto!important; overflow:visible!important; float:none!important; max-height:inherit!important; line-height:inherit!important } tr.es-desk-hidden { display:table-row!important } table.es-desk-hidden { display:table!important } td.es-desk-menu-hidden { display:table-cell!important } .es-menu td { width:1%!important } table.es-table-not-adapt, .esd-block-html table { width:auto!important } table.es-social { display:inline-block!important } table.es-social td { display:inline-block!important } .es-desk-hidden { display:table-row!important; width:auto!important; overflow:visible!important; max-height:inherit!important } }</style></head>
<body data-new-gr-c-s-loaded="14.1089.0" style="width:100%;font-family:arial, 'helvetica neue', helvetica, sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0"><div class="es-wrapper-color" style="background-color:#F6F6F6"><!--[if gte mso 9]><v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t"> <v:fill type="tile" color="#f6f6f6"></v:fill> </v:background><![endif]--><table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top;background-color:#F6F6F6"><tr><td valign="top" style="padding:0;Margin:0"><table class="es-header" cellspacing="0" cellpadding="0" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%;background-color:transparent;background-repeat:repeat;background-position:center top"><tr><td align="center" style="padding:0;Margin:0"><table class="es-header-body" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px"><tr><td align="left" style="padding:0;Margin:0;padding-top:20px;padding-left:20px;padding-right:20px"><!--[if mso]><table style="width:560px" cellpadding="0" cellspacing="0"><tr><td style="width:180px" valign="top"><![endif]--><table class="es-left" cellspacing="0" cellpadding="0" align="left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left"><tr><td class="es-m-p0r es-m-p20b" valign="top" align="center" style="padding:0;Margin:0;width:180px"><table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"><tr><td align="center" style="padding:0;Margin:0;font-size:0px"><img class="adapt-img" src="https://auduah.stripocdn.email/content/guids/6d8e989e-90bc-4891-bb44-890332a6407e/images/yelp_logo.png" alt style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic" width="180" height="69"></td>
</tr></table></td></tr></table><!--[if mso]></td><td style="width:20px"></td><td style="width:360px" valign="top"><![endif]--><table cellspacing="0" cellpadding="0" align="right" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"><tr><td align="left" style="padding:0;Margin:0;width:360px"><table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"><tr></tr></table></td></tr></table><!--[if mso]></td></tr></table><![endif]--></td></tr></table></td>
</tr></table><table class="es-content" cellspacing="0" cellpadding="0" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%"><tr><td align="center" style="padding:0;Margin:0"><table class="es-content-body" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px"><tr><td align="left" style="padding:0;Margin:0;padding-top:20px;padding-left:20px;padding-right:20px"><table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"><tr><td valign="top" align="center" style="padding:0;Margin:0;width:560px"><table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"><tr><td align="left" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#333333;font-size:14px">Hi there,<br>Your reservation is confirmed. Please look for the attached invite and save to your calender. Have a nice Day!<br><br>Regards.<br></p>
</td></tr></table></td></tr></table></td></tr></table></td>
</tr></table><table class="es-footer" cellspacing="0" cellpadding="0" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%;background-color:transparent;background-repeat:repeat;background-position:center top"><tr><td align="center" style="padding:0;Margin:0"><table class="es-footer-body" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px"><tr><td align="left" style="Margin:0;padding-top:20px;padding-bottom:20px;padding-left:20px;padding-right:20px"><!--[if mso]><table style="width:560px" cellpadding="0" cellspacing="0"><tr><td style="width:270px" valign="top"><![endif]--><table class="es-left" cellspacing="0" cellpadding="0" align="left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left"><tr><td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:270px"><table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"><tr><td style="padding:0;Margin:0;display:none" align="center"></td>
</tr></table></td></tr></table><!--[if mso]></td><td style="width:20px"></td><td style="width:270px" valign="top"><![endif]--><table class="es-right" cellspacing="0" cellpadding="0" align="right" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right"><tr><td align="left" style="padding:0;Margin:0;width:270px"><table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"><tr><td style="padding:0;Margin:0;display:none" align="center"></td></tr></table></td></tr></table><!--[if mso]></td></tr></table><![endif]--></td></tr></table></td></tr></table></td></tr></table></div></body></html>
        `
    };
    // calender invite
    const cal = ical({ domain: "https://trail5yelpsp82.wl.r.appspot.com/", name: 'Reservation Confirmation' });
    // cal.domain("localhost");
    cal.createEvent({
        start: req.body.start,        
        end: req.body.end,           
        summary: req.body.summary,         
        description: req.body.description, 
        location: req.body.location,       
        url: req.body.url,                 
        status: "CONFIRMED",
    });
    const attachment = cal.toString();
    mailOptions.attachments = [{
        method: 'REQUEST',
        component: "VEVENT",
        filename: 'invite.ics',
        content: attachment,
        contentType: 'text/calendar'
    }];

    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
            res.json({errors: "email error"});
        } else {
            console.log('Email sent: ' + info.response);
            res.json({errors: ""});
        }
    });
});



app.get('/*', function(req, res){
    res.sendFile(path.join(__dirname + '/dist/hw8_1/index.html'));
})
