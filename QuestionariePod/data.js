import mongo from 'mongodb';


export default class Data {

    constructor(client, db) {
        this.client = client;
        this.db = db;
        this.questions =  db.collection('questions')
    }

    static async make() {
        const dbUrl = DB_URL;
        let client;
        try {
          client = await mongo.connect(dbUrl, MONGO_CONNECT_OPTIONS );
        }
        catch (err) {
          const msg = `cannot connect to URL "${dbUrl}": ${err}`;
          throw msg ;
        }
        const db = client.db();
        const data = new Data(client, db);
        return data;
    }

    async create(obj){
        obj = await randomId(obj)
        try{
            await this.questions.insertOne(obj)
        }
        catch (err) {
            if (isDuplicateError(err)) {
                const msg = `object having id ${obj._id} already exists`;
                throw [ msg ];
            }
            else {
                throw err;
            }
        }
    }

    async find(){
        try{
            return await this.questions.aggregate([{ $sample: { size: 3 } }]).toArray();
        }
        catch (err) {
            throw err
        }
    }
}

function isDuplicateError(err) {
    return (err.code === 11000);
}

function randomId(obj){
    obj._id = ((Math.random() * 1000) + 1).toFixed(5);
    return obj
}

const MONGO_CONNECT_OPTIONS = { useUnifiedTopology: true };

const DB_URL = "mongodb://localhost:27017/Exam"