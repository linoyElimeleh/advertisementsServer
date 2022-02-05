const {MongoClient} = require('mongodb');
const fs = require('fs');
const uri = "mongodb://localhost:27017"
const databaseName = 'advertisementsDb';
const adminDatabaseName = 'creds';
const collectionName = 'Messages';
const adminsCollectionName = 'admins';
let client;
let db;
const {hashSingleImage} = require("./photoHaseService");
const {exists} = require("fs");

class MongoService {

    constructor() {
        client = new MongoClient(uri, {useNewUrlParser: true, useUnifiedTopology: true});
    }

    async getAllMessages() {
        let messages;
        try {
            await client.connect();
            db = await client.db(databaseName)
            messages = await this.getMessagesRequest()
        } catch (e) {
            console.error(e);
        } finally {
            client.close();
            return messages;
        }
    }

    async getMessagesById(id) {
        let messages;
        try {
            await client.connect();
            db = await client.db(databaseName)
            messages = await this.getMessageRequest(id)
        } catch (e) {
            console.error(e);
        } finally {
            client.close();
            return messages;
        }
    }
    async checkForAdmin(username, password) {
        let isAdmin;
        try {
            await client.connect();
            db = await client.db(adminDatabaseName)
            isAdmin = await this.getAdminRequest(username, password);
        } catch (e) {
            console.error(e);
        } finally {
            client.close();
            if(isAdmin){
                return true;
            }
            return false;
        }
    }

    async initializeMessage() {
        try {
            // Connect to the MongoDB cluster
            await client.connect();
            db = await client.db(databaseName);
            await db.dropDatabase();
            let rawData = await fs.readFileSync('data-from-server.json');
            let messages = JSON.parse(rawData);
            this.addHashedImages(messages);
            await db.collection(collectionName).insertMany(messages)
        } catch (e) {
            console.error(e);
        }
    }

    addHashedImages(messages) {
        messages.forEach(m => {
            m["photoHash"] = [];
            m.images.forEach(img => {
                m["photoHash"].push(hashSingleImage(img))
            })
        })
    }

    async getMessagesRequest() {
        let cursor = db.collection(collectionName).find({});
        let messagesPromise = await new Promise(resolve => cursor.toArray(function (err, items) {
            resolve(items);
        }));
        return messagesPromise;
    }
    async getMessageRequest(id) {
        let cursor = db.collection(collectionName).find({
            ids: parseInt(id)
        });
        let messagesPromise = await new Promise(resolve => cursor.toArray(function (err, items) {
            resolve(items);
        }));
        return messagesPromise;
    }

    async getAdminRequest(username, password) {
        let isAdmin = await db.collection(adminsCollectionName).findOne({username : username, password: password});
        return isAdmin;
    }
}

module.exports = MongoService;