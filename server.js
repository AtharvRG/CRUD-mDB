require('dotenv').config();
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
    console.error("MongoDB URI not found. Make sure MONGODB_URI is set in your .env file.");
    process.exit(1);
}

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

let db;
let itemsCollection;

MongoClient.connect(mongoUri)
    .then(client => {
        console.log('Connected to MongoDB Atlas');
        db = client.db();
        itemsCollection = db.collection('items');

        app.listen(port, () => {
            console.log(`Server running at http://localhost:${port}`);
            console.log(`Frontend accessible at http://localhost:${port}`);
        });
    })
    .catch(error => {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    });

// GET items
app.get('/api/items', async (req, res) => {
    try {
        if (!itemsCollection) return res.status(503).json({ message: 'Database not available' });
        const items = await itemsCollection.find({}).sort({ name: 1 }).toArray();
        res.json(items);
    } catch (error) {
        console.error('Error fetching items:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// GET item by ID
app.get('/api/items/:id', async (req, res) => {
    try {
        if (!itemsCollection) return res.status(503).json({ message: 'Database not available' });
        const { id } = req.params;
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid item ID format' });
        }
        const item = await itemsCollection.findOne({ _id: new ObjectId(id) });
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }
        res.json(item);
    } catch (error) {
        console.error('Error fetching item by ID:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// POST item
app.post('/api/items', async (req, res) => {
    try {
        if (!itemsCollection) return res.status(503).json({ message: 'Database not available' });
        const newItem = req.body;
        if (!newItem.name || !newItem.quantity || !newItem.unit || !newItem.category || !newItem.location) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        newItem.quantity = parseFloat(newItem.quantity);
        if (isNaN(newItem.quantity)) {
             return res.status(400).json({ message: 'Quantity must be a number' });
        }

        newItem.createdAt = new Date();

        const result = await itemsCollection.insertOne(newItem);
        res.status(201).json({ ...newItem, _id: result.insertedId });
    } catch (error) {
        console.error('Error creating item:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// PUT item
app.put('/api/items/:id', async (req, res) => {
    try {
        if (!itemsCollection) return res.status(503).json({ message: 'Database not available' });
        const { id } = req.params;
        const updates = req.body;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid item ID format' });
        }
        if (!updates.name || !updates.quantity || !updates.unit || !updates.category || !updates.location) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        updates.quantity = parseFloat(updates.quantity);
        if (isNaN(updates.quantity)) {
             return res.status(400).json({ message: 'Quantity must be a number' });
        }


        delete updates._id;
        updates.updatedAt = new Date();

        const result = await itemsCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updates }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: 'Item not found' });
        }

        res.json({ message: 'Item updated successfully', _id: id, ...updates });
    } catch (error) {
        console.error('Error updating item:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// DELETE item
app.delete('/api/items/:id', async (req, res) => {
    try {
        if (!itemsCollection) return res.status(503).json({ message: 'Database not available' });
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid item ID format' });
        }

        const result = await itemsCollection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Item not found' });
        }

        res.status(200).json({ message: 'Item deleted successfully' });
    } catch (error) {
        console.error('Error deleting item:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});
