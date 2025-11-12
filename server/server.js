import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const key = JSON.parse(fs.readFileSync("./firebaseKey.json", "utf8"));

admin.initializeApp({
    credential: admin.credential.cert(key)
});

const db = admin.firestore();

const app = express();
app.use(cors());
app.use(express.json());


app.use(express.static(path.join(__dirname, "../public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

let collectionType = null;
let collectionProb = null;

async function loadData() {
    collectionType = await db.collection("categoryTable").get();
    collectionProb = await db.collection("problems").get();
}

await loadData();

setInterval(async () => {
  console.log("⏳ 重新載入 Firestore 資料中...");
  await loadData();
  console.log("✅ Firestore 資料已更新");
}, 6*60*60*1000);

app.get("/api/categories", async (req, res) => {
    try {
        let categories = [];

        collectionType.forEach(doc => {
            const data = doc.data();
            categories.push({
                id: data.id,
                category: data.category.trim()
            });
        });

        let flag=1;
        collectionProb.forEach(doc => {
            const data = doc.data();
            const cat = data.category;

            cat.forEach(cate => {
                if(!categories.find(item => item.category === cate)){
                    console.log("NO",cate);
                    flag=0;
                }
            });
        });
        if(flag){
            console.log("All OK");
        }
        
        res.json(categories);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

app.post("/api/search",(req,res) => {
    try {

        let results =[];
        let searchRules = req.body;

        searchRules.forEach(item =>{
            collectionProb.forEach(doc => {
                const data = doc.data();
                let flag=1;

                if(item.id!==""){
                    if(item.id==="ALL"){
                        results.push({
                            id:data.id,
                            name: data.title,
                            difficulty: data.difficulty,
                            category: JSON.stringify(data.category)
                        });

                        return;
                    }
                }


                if(item.id!==""){
                    if(data.id!==item.id) flag=0;
                }
                
                if(item.name!==""){
                    if(!data.title.includes(item.name)) flag=0;
                }
 
                if(item.difficulty!==-1){
                    if(data.difficulty!==item.difficulty) flag=0;
                }

                const itemcate=JSON.parse(item.category);
                if(itemcate.length!==0){
                    if(!itemcate.every(c=>data.category.includes(c))) flag=0;
                }
                

                if(flag){
                    const exists = results.some(item => item.id === data.id);

                    if(!exists){
                        results.push({
                            id:data.id,
                            name: data.title,
                            difficulty: data.difficulty,
                            category: JSON.stringify(data.category),
                        });
                    }
                }
            });
        })
        
        res.json(results);
    } catch(err){
        console.log(err);
        res.status(500).json({ error: "search error" });
    }
});

app.post("/api/detail",(req,res)=>{
    try{
        const id = req.body.id;
        let detail=null;

        collectionProb.forEach(item =>{
            const data = item.data();
            if (data.id === id) detail = data;
        });

        res.json(detail);
    }catch(err){
        console.log(err);
        res.status(500).json({ error: "detail search error" });
    }
});

// ✅ 啟動後端（最後一行）
app.listen(3000, () => {
    console.log("✅ Server running at http://localhost:3000");
});
