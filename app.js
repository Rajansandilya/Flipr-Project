require("dotenv").config();
const express = require("express");
var MongoClient = require('mongodb').MongoClient;
const mongoose = require("mongoose");
const app = express();
const bodyParser = require("body-parser");
const fetch = require("node-fetch");


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


const locationArray = (responseArray, deviceArray, coll2, dbo) => {
    const promise = new Promise(async(resolve, reject) => {
        let deviceCount = 0;
        const devLen = deviceArray.length;
        await deviceArray.forEach(async (element) => {
            let obj ={};
            // deviceCount++;
            obj.deviceId = element.id;
            obj.locations = [];
            console.log("deviceCount = ", deviceCount)
            await dbo.collection(coll2).find({"device" : element.id}).sort({_id:-1}).limit(50).toArray(async function(err, data) {
                if (err) throw err;
                // console.log(data);
                let locArr = [];
                let locCount = 0;
                const locLen = data.length;
                if(locLen===0){
                    obj.locations = locArr;
                    responseArray.push(obj);
                    console.log("outer")
                    console.log(deviceCount + " " + devLen);
                    console.log(locCount + " " + locLen);
                    if(deviceCount===devLen&&locLen===locCount){
                        console.log("hello");
                        resolve(responseArray);
                    }
                }else{
                    await data.forEach(locs=>{
                        locCount++;
                        locArr.push(locs.gps);
                        if(locCount===locLen){
                            locArr.reverse();
                            obj.locations = locArr;
                            responseArray.push(obj);
                            console.log("responseArray", responseArray);
                        }
                        if(deviceCount===devLen&&locCount===locLen){
                            resolve(responseArray);
                        }
                    })
                }
            });
        });
    });
    return promise;
};

app.post("/deviceLoc/:collection1", async (req, res)=>{
    let responseArray = [];
    MongoClient.connect(req.body.mongoUrl,{ useNewUrlParser: true, useUnifiedTopology: true}, async function(err, db) {
        if (err) throw err;
        var dbo = db.db("__CONCOX__");

        dbo.collection(req.params.collection1).find({}).sort({_id:-1}).limit(10).toArray(async function(err, result) {
            if (err) throw err;
            let coll2 = req.query.collection2;
            locationArray(responseArray, result, coll2, dbo).then((responseArray)=>{
                res.set({
                    "name" : "Rajan Sandilya",
                    "email" : "rajan.ece.1827@iiitbh.ac.in"
                });
                res.json({
                    success : true,
                    deviceInfo : responseArray
                })
                // db.close();
            }).catch(error=>{
                res.json({
                    success : false,
                    error : error.message
                })
            })
        })
    });
})


const getGeoPosition = (address, finalArray, count) => {
    const promise = new Promise((resolve, reject) => {
        const len = address.length;
        address.forEach(async element => {
            let obj = {};
            obj.add = element;
            obj.location = [];
            let response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${element}&key=${process.env.GeocodingApi}`);
            response = await response.json();
            // console.log(response.results[0].geometry.location);
            obj.location.push(response.results[0].geometry.location.lat);
            obj.location.push(response.results[0].geometry.location.lng);
            // console.log(obj);
            finalArray.push(obj);
            console.log(finalArray);
            count++;
            if(count==len){
                resolve(finalArray);
            }
        });
    });
    return promise;
};

app.post("/getLocation", async (req, res)=>{
    let address = req.body.address;
    let finalArray = [];
    let count = 0;
    getGeoPosition(address, finalArray, count).then(data=>{
        return res.json({
            success : true,
            finalArray : data
        });
    }).catch(error=>{
        res.json({
            success : false,
            error : error.message
        })
    })
})

app.listen("5000", ()=>{
    console.log("backend started...");
})