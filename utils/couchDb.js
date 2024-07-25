const nano = require('nano');
require('dotenv').config();

class CouchDBClient {
    constructor() {
        this.couch = nano(process.env.COUCH_URL);
    }

    async insert(key, data) {
        const [dbName, docId] = key.split('/');
        try {
            // Use database
            let dbList = await this.couch.db.list()
            if  (!dbList.includes(dbName)){
                await this.couch.db.create(dbName);
            } 
            const db = this.couch.use(dbName);
            // Insert document
            const doclist = await db.list()
            const ids = doclist.rows.map(row => row.id);
            if (ids.includes(docId)) {
                let exist_doc = await this.couch.use(dbName).get(docId, { revs_info: true })
                await db.insert({
                    _id: docId,
                    _rev: exist_doc["_rev"],
                    data: data,
            });
            }
            else {
                await db.insert({
                    _id: docId,
                    data: data,
            });
            }
            // console.log('Document inserted successfully.');
        } catch (error) {
            console.error('Error inserting document:', error);
        }
    }

    async retrieve(key) {
        const [dbName, docId] = key.split('/');
        try {
            const db = this.couch.use(dbName);
            const doc = await db.get(docId);
            return doc.data;
        } catch (error) {
            console.error('Error retrieving document:', error);
        }
    }
}

module.exports = CouchDBClient;
