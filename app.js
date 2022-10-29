// init
const express = require('express');
const cors=require("cors");
const axios = require('axios');
const path = require('path');
const bodyParser = require('body-parser');

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

app.get('/*', function(req, res){
    res.sendFile(path.join(__dirname + '/dist/hw8_1/index.html'));
})
