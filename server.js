const express = require("express");
const axios = require("axios");
const redis = require('redis');

const app = express();
const PORT = 8000;

let redisClient;
(async function () {
    redisClient = redis.createClient();
    redisClient.on("error", (error) => console.log("ERROR!:" + error))
    await redisClient.connect();
})()

async function fetchApiData(id) {
    const res = await axios.get(`https://jsonplaceholder.typicode.com/todos/${+id}`)
    console.log("Request sent to the API");
    return await res.data;
}

async function getSpeciesData(req, res) {
    let id = req.params.id;
    let result;
    let isCached = false;
    try {
        const cacheResults = await redisClient.get(id);
        if (cacheResults) {
            isCached = true;
            result = JSON.parse(cacheResults);
        } else {
            result = await fetchApiData(id);
            if (result.length === 0) {
                throw "API returned an empty array"
            }
            await redisClient.set(id, JSON.stringify(result));
        }

        res.send({ fromCache: isCached, data: result });
    } catch (error) {
        console.log(error);
        res.status(404).send("Data unavailable");
    }

}

app.get("/todo/:id", getSpeciesData);

app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
})