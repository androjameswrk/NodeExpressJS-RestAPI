// REST API

const express = require('express')
const app = express()
const port = 4000

const mysql = require('mysql2')

app.use(express.json()) //req.body can be used because of this

const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "storedb",
}).promise() //await

app.get('/api/products', async (req, res) => { // first end point -> can be accessed thru postman by typing the url localhost:4000/api/products
    try {
        const data = await pool.execute("SELECT * from products")
        res.status(200).json(data[0])
    }
    catch(err){
        res.status(500).json({ message: err})
    }
})

app.get('/api/products/:id', async (req, res) => {
    const id = req.params.id
    try {
        const data = await pool.execute("SELECT * from products WHERE id=?", [id])
        const rows = data[0]

        if (rows.length === 0 ) {
            res.status(404).json() //404 or Error not found
        }
        else {
            res.status(200).json(rows[0]) //200 or success/found
        }
    }
    catch(err){
        res.status(500).json({ message: err})
    }

})

function isValidProduct(product) {
    let hasErrors = false;
    const errors = {};

    if (!product.name) {
        errors.name = "The name is required";
        hasErrors = true;
    }
    if (!product.brand) {
        errors.brand = "The brand is required";
        hasErrors = true;
    }
    if (!product.category) {
        errors.category = "The category is required";
        hasErrors = true;
    }
    if (!product.price || isNaN(product.price)) {
        errors.price = "The price is not valid";
        hasErrors = true;
    }
    if (!product.description) {
        errors.description = "The description is required";
        hasErrors = true;
    }

    return { hasErrors, errors };
}


app.post('/api/products', async (req, res) => {
    const product = req.body;

    try {
        const validationResult = isValidProduct(product);

        if (validationResult.hasErrors) {
            res.status(400).json(validationResult.errors);
            return;
        }

        const created_at = new Date().toISOString();
        let sql = 'INSERT INTO products (name, brand, category, price, description, created_at) VALUES (?, ?, ?, ?, ?, ?)';
        let values = [product.name, product.brand, product.category, product.price, product.description, created_at];
        let data = await pool.execute(sql, values);

        const id = data[0].insertId;

        data = await pool.execute("SELECT * FROM products WHERE id=?", [id]);

        res.status(200).json(data[0][0]);
    } catch (err) {
        res.status(500).json({ message: err });
    }
});


app.put('/api/products/:id', async (req, res) => {
    const product = req.body
    const id = req.params.id
    
    try{
        const result = isValidProduct(product)

        if(result.hasErrors){
            res.status(400).json(result.errors)
        }

        let sql = 'UPDATE products SET name=?, brand=?, category=?, price=?, description=? WHERE id=?';
        let values = [product.name, product.brand, product.category, product.price, product.description, id];
        
        let data = await pool.execute(sql, values);

        if (data[0].affectedRows === 0){
            res.status(404).json()
            return
        }

        data = await pool.execute("SELECT * FROM products WHERE id=?", [id]);

        res.status(200).json(data[0][0])
    }
    catch (err) {
        res.status(500).json({ message: err })
    }
})

app.delete('/api/products/:id', async (req, res) => {
    const id = req.params.id;

    try {
        // Check if the product exists
        let data = await pool.execute("SELECT * FROM products WHERE id=?", [id]);

        if (data[0].length === 0) {
            res.status(404).json({ message: "Product not found" });
            return;
        }

        // Delete the product
        let sql = 'DELETE FROM products WHERE id=?';
        await pool.execute(sql, [id]);

        res.status(200).json({ message: "Product deleted successfully" });
    } 
    catch (err) {
        res.status(500).json({ message: err });
    }
});


app.listen(port, () =>{
    console.log("Server is listening on port " + port)
})