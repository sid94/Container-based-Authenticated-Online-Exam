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
        obj = await randomId(obj);
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
            let result = await this.questions.aggregate([{ $sample: { size: 4 } }]).toArray();
            return result.map((obj)=>{obj.id = obj._id;delete obj._id;return obj});
        }
        catch (err) {
            throw err
        }
    }

    async score(val){
        try{
            let retObj = {};
            const queryVal = val.sol;
            let acc = {};
            let quesAns = queryVal.split(",").map((val)=>{
                let arr = val.split("_");
                acc[arr[0]] = arr[1];
            });
            const result = await this.questions.find({_id:{$in:Object.keys(acc)}}).toArray();
            let grade = result.reduce((sum,val)=>{
                if(val.answer === acc[val._id]){
                    return sum +=1;
                }
            },0);
            retObj.score = grade;
            retObj.outof = result.length;
            return retObj
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